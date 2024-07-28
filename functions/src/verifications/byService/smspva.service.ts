import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CollectionReference, Timestamp } from '@google-cloud/firestore';
import { firstValueFrom } from 'rxjs';
import { SmspvaVerificationDocument } from '../documents/index.document';
import { ServiceDocument } from '../../services/documents/index.document';
import { CountryDocument } from '../../countries/documents/index.document';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timeout from '../../helpers/timeout';
import getStartAndFinishDates from "../../helpers/getStartAndFinishDate";
import * as _ from "lodash";
dayjs.extend(customParseFormat);

interface PriceData {
    price: number;
    description: string;
}

interface ServicesPricesMap {
    [key: string]: {
        [key: string]: PriceData;
    };
}

@Injectable()
export class SmspvaService {
    private logger: Logger = new Logger(SmspvaService.name);
    constructor(
        @Inject(SmspvaVerificationDocument.collectionName)
        private smspvaVerificationsCollection: CollectionReference<SmspvaVerificationDocument>,
        @Inject(ServiceDocument.collectionName)
        private servicesCollection: CollectionReference<ServiceDocument>,
        @Inject(CountryDocument.collectionName)
        private countriesCollection: CollectionReference<CountryDocument>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {}

    public async getVerificationsByDayAndService ({ day, service_code }: { day: string, service_code: string }) {
        const { startDate, finishDate} = getStartAndFinishDates(day)
        const verificationsSnapshot = await this.smspvaVerificationsCollection
            .where('date', '>=', startDate)
            .where('date', '<=', finishDate)
            .where('service_code', '==', service_code)
            .get();
        const smspvaDocs = verificationsSnapshot.docs.map(doc => {
            return {
                day,
                service_code,
                country: doc.data().country,
                price: doc.data().price,
                serviceDescription: doc.data().serviceDescription,
                source: doc.data().source,
                count: doc.data().count_info[`Total_${doc.data().country}`]
            }
        })
        return _.uniqBy(smspvaDocs, 'country');
    }
    public async addSmspvaVerifications() {
        const batchLimit = 100;
        let batch = this.smspvaVerificationsCollection.firestore.batch();
        let batchCounter = 0;

        const countriesSnapshot = await this.countriesCollection
            .orderBy('id_smspva')
            .get();
        const servicesSnapshot = await this.servicesCollection
            .orderBy('id_smspva')
            .get();

        const apiKey = this.configService.get<string>('app.api_key_smspva');
        const pricesUrl = 'https://api.smspva.com/activation/servicesprices';
        const pricesResponse = await firstValueFrom(this.httpService.get(pricesUrl, {
            headers: {
                apikey: apiKey,
            }
        }));

        const pricesData: any[] = pricesResponse?.data?.data || [];

        const servicesPricesMap: ServicesPricesMap = {};
        pricesData.forEach(priceData => {
            const { service, country, price, serviceDescription } = priceData;
            if (!servicesPricesMap[service]) {
                servicesPricesMap[service] = {};
            }
            servicesPricesMap[service][country] = {
                price: Number(price),
                description: serviceDescription,
            };
        });

        for (const doc of countriesSnapshot.docs) {
            const url = `https://api.smspva.com/activation/countnumbers/${doc.data().id_smspva}`;
            const response = await firstValueFrom(this.httpService.get(url, {
                headers: {
                    apikey: apiKey,
                }
            }));

            await timeout(1000);
            this.logger.debug(`Fetching data for country: ${doc.id}`);

            const operatorsArray = response?.data?.data;
            const servicesMap: { [key: string]: { [key: string]: number } } = {};
            const validServices = new Set<string>();
            servicesSnapshot.forEach(serviceDoc => {
                validServices.add(serviceDoc.data().id_smspva);
            });

            if (operatorsArray) {
                for (const operatorObject of operatorsArray) {
                    const operator = operatorObject.operator;
                    for (const serviceObject of operatorObject.services) {
                        const serviceId = serviceObject.service;
                        const total = serviceObject.total;
                        if (validServices.has(serviceId) && total > 0) {
                            if (!servicesMap[serviceId]) {
                                servicesMap[serviceId] = {};
                            }
                            servicesMap[serviceId][operator] = total;
                        }
                    }
                }

                for (const serviceId of Object.keys(servicesMap)) {
                    const priceData: PriceData | undefined = servicesPricesMap[serviceId]?.[doc.data().id_smspva];
                    if (priceData) {
                        const verificationData = {
                            country: doc.data().id_smspva,
                            date: Timestamp.fromMillis(dayjs().valueOf()),
                            count_info: servicesMap[serviceId],
                            service_code: serviceId,
                            source: 'smspva',
                            price: priceData.price,
                            serviceDescription: priceData.description,
                        };

                        const docRef = this.smspvaVerificationsCollection.doc();
                        batch.set(docRef, verificationData);
                        batchCounter++;

                        if (batchCounter >= batchLimit) {
                            await batch.commit();
                            batch = this.smspvaVerificationsCollection.firestore.batch();
                            batchCounter = 0;
                        }
                    } else {
                        this.logger.error(`No price data found for service ${serviceId} in country ${doc.data().id_smspva}`);
                    }
                }
            } else {
                this.logger.error(`Failed to fetch data for product ${doc.id}`);
            }
        }

        if (batchCounter > 0) {
            await batch.commit(); // Комміт останнього батчу
        }
    }
}
