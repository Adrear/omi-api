import { Inject, Injectable, Logger } from '@nestjs/common';
import { CollectionReference, Timestamp } from '@google-cloud/firestore';
import { VerificationDocument, VerificationByServicesDocument } from './documents/index.document';
import {
    getAllVerificationsUtil,
    exportVerificationsToCSVUtil,
    createVerificationsUtil,
    getVerificationsByServiceForTimelineUtil,
    getVerificationsByCountryForTimelineUtil
} from './utils';
import { ExchangeRatesDocument } from "../exchange-rates/documents/exchange-rates.document";
import { SmshubService } from './byService/smshub.service';
import { FiveSimService } from './byService/5sim.service';
import { SmsActivateService } from './byService/sms-activate.service';
import { SmspvaService } from './byService/smspva.service';
import dayjs from 'dayjs';
import pLimit from 'p-limit';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {ServiceDocument} from "../services/documents/service.document";
import * as _ from 'lodash';
import {CountryDocument} from "../countries/documents/country.document";
// @ts-ignore
import { Parser } from 'json2csv';
import * as fs from 'fs';
import path from "path";

dayjs.extend(customParseFormat);
interface GetAllVerificationsParams {
    source?: string;
    date?: string;
}

function getDocumentSize(doc: any): number {
    const jsonData = JSON.stringify(doc);
    return Buffer.byteLength(jsonData, 'utf-8'); // Розмір у байтах
}


@Injectable()
export class VerificationsService {
    private logger: Logger = new Logger(VerificationsService.name);
    constructor(
        @Inject(VerificationDocument.collectionName)
        private verificationsCollection: CollectionReference<VerificationDocument>,
        @Inject(VerificationByServicesDocument.collectionName)
        private verificationsByServicesCollection: CollectionReference<VerificationByServicesDocument>,
        @Inject(ServiceDocument.collectionName)
        private servicesCollection: CollectionReference<ServiceDocument>,
        @Inject(CountryDocument.collectionName)
        private countriesCollection: CollectionReference<CountryDocument>,
        @Inject(ExchangeRatesDocument.collectionName)
        private exchangeRatesCollection: CollectionReference<ExchangeRatesDocument>,
        private readonly smshubService: SmshubService,
        private readonly fiveSimService: FiveSimService,
        private readonly smsActivateService: SmsActivateService,
        private readonly smspvaService: SmspvaService,
    ) {}
    async getAllVerifications({ source, date }: GetAllVerificationsParams): Promise<number> {
        return getAllVerificationsUtil({
            source,
            date,
            verificationsCollection: this.verificationsCollection,
            logger: this.logger
        });
    }

    async exportVerificationsToCSV(day: string) {
        return exportVerificationsToCSVUtil({
            day,
            verificationsCollection: this.verificationsCollection,
            logger: this.logger
        });
    }

    async createVerifications(day: string) {
        return createVerificationsUtil({
            day,
            logger: this.logger,
            verificationsCollection: this.verificationsCollection,
            servicesCollection: this.servicesCollection,
            countriesCollection: this.countriesCollection,
            smsActivateService: this.smsActivateService,
            fiveSimService: this.fiveSimService,
            smspvaService: this.smspvaService,
            smshubService: this.smshubService,
        });
    }

    async getVerificationsByServiceForTimeline(serviceID: string, body: any) {
        return getVerificationsByServiceForTimelineUtil({
            serviceID,
            verificationsCollection: this.verificationsCollection,
            limit: 5
        });
    }

    async getVerificationsByCountryForTimeline(countryID: string, body: any) {
        const { services, days } = body;
        return getVerificationsByCountryForTimelineUtil({
            countryID,
            services,
            days,
            verificationsCollection: this.verificationsCollection,
            logger: this.logger
        });
    }
    async createVerificationsByServiceForMonth(serviceID: string, month: string) {
        try {
            const batchSizeLimit = 500;
            let batch = this.verificationsByServicesCollection.firestore.batch();
            let batchOperationCount = 0;

            const serviceDoc = await this.servicesCollection.doc(serviceID).get();
            if (!serviceDoc.exists) {
                this.logger.warn(`Service ${serviceID} not found.`);
                return;
            }
            const serviceData = serviceDoc.data();
            this.logger.log(`Processing service: ${serviceID}`);

            const exchangeRatesSnapshot = await this.exchangeRatesCollection.get();
            const exchangeRatesMap: Record<string, number> = {};
            exchangeRatesSnapshot.forEach(doc => {
                exchangeRatesMap[doc.id] = doc.data()?.RUB ?? 100;
            });

            const countriesSnapshot = await this.countriesCollection.get();
            const countriesData = countriesSnapshot.docs.map(doc => ({
                id: doc.id,
                id_activate: doc.data().id_activate,
                id_5sim: doc.data().id_5sim,
                id_smspva: doc.data().id_smspva,
                id_smshub: doc.data().id_smshub
            }));

            const verificationsByCountry: Record<string, { data: Record<number, { count: number | null; priceUSD: number | null }> }> = {};
            const daysInMonth = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();

            const allDaysPromises = Array.from({ length: daysInMonth }, (_, i) => i + 1).map(async (day) => {
                const dayStr = `${month}-${day.toString().padStart(2, '0')}`;
                const exchangeRate = exchangeRatesMap[dayStr] ?? 100;

                const [smsActivateData, fiveSimData, smspvaData, smshubData] = await Promise.all([
                    serviceData?.id_activate ? this.smsActivateService.getVerificationsByDayAndService({ day: dayStr, service_code: serviceData.id_activate }) : Promise.resolve([]),
                    serviceData?.id_5sim ? this.fiveSimService.getVerificationsByDayAndService({ day: dayStr, service_code: serviceData.id_5sim }) : Promise.resolve([]),
                    serviceData?.id_smspva ? this.smspvaService.getVerificationsByDayAndService({ day: dayStr, service_code: serviceData.id_smspva }) : Promise.resolve([]),
                    serviceData?.id_smshub ? this.smshubService.getVerificationsByDayAndService({ day: dayStr, service_code: serviceData.id_smshub }) : Promise.resolve([])
                ]);

                const smsActivateMap = Object.fromEntries(smsActivateData.map(el => [el.country, el]));
                const fiveSimMap = Object.fromEntries(fiveSimData.map(el => [el.country, el]));
                const smspvaMap = Object.fromEntries(smspvaData.map(el => [el.country, el]));
                const smshubMap = Object.fromEntries(smshubData.map(el => [el.country, el]));

                for (const country of countriesData) {
                    const smsActivateDoc = smsActivateMap[country.id_activate];
                    const fiveSimDoc = fiveSimMap[country.id_5sim];
                    const smspvaDoc = smspvaMap[country.id_smspva];
                    const smshubDoc = smshubMap[country.id_smshub];

                    const totalCount = (smsActivateDoc?.count ?? 0) +
                        (fiveSimDoc?.count ?? 0) +
                        (smspvaDoc?.count ?? 0) +
                        (smshubDoc?.count ?? 0);

                    const countryPrice = (
                        ((smsActivateDoc?.price ?? 0) / exchangeRate * (smsActivateDoc?.count ?? 0)) +
                        ((fiveSimDoc?.price ?? 0) / exchangeRate * (fiveSimDoc?.count ?? 0)) +
                        ((smspvaDoc?.price ?? 0) * (smspvaDoc?.count ?? 0)) +
                        ((smshubDoc && smshubDoc.price != null && smshubDoc.count != null ? smshubDoc.price * smshubDoc.count : 0))
                    ) / (totalCount || 1);

                    if (totalCount > 0 || countryPrice > 0) {
                        if (!verificationsByCountry[country.id]) {
                            verificationsByCountry[country.id] = { data: {} };
                        }

                        verificationsByCountry[country.id].data[day - 1] = {
                            count: totalCount || null,
                            priceUSD: totalCount > 0 ? countryPrice : null
                        };
                    }
                }
            });

            await Promise.all(allDaysPromises);

            const verificationData = {
                serviceID,
                createdAt: Timestamp.now(),
                month,
                countries: Object.entries(verificationsByCountry)
                    .map(([countryID, value]) => ({
                        countryID,
                        data: Object.fromEntries(
                            Object.entries(value.data).filter(([, { count, priceUSD }]) => count !== null || priceUSD !== null)
                        )
                    }))
            };

            const docRef = this.verificationsByServicesCollection.doc(`${month}_${serviceID}`);
            batch.set(docRef, verificationData);
            batchOperationCount++;

            const totalServiceCount = verificationData.countries.reduce((acc, cur) => {
                return acc + Object.values(cur.data).reduce((sum, d) => sum + (d.count ?? 0), 0);
            }, 0);

            batch.update(this.servicesCollection.doc(serviceID), { totalServiceCount });
            batchOperationCount++;

            if (batchOperationCount >= batchSizeLimit) {
                await batch.commit();
                this.logger.log('Batch committed (limit reached). Creating new batch.');
                batch = this.verificationsByServicesCollection.firestore.batch();
                batchOperationCount = 0;
            }

            await batch.commit();
            this.logger.log(`Дані для сервісу ${serviceID} успішно записані.`);
        } catch (error) {
            this.logger.error('Error in createVerificationsByServiceForMonth:', error);
        }
    }

    async createVerificationsByCountriesForMonth(month: string) {
        try {
            if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
                throw new Error(`Invalid month format: ${month}. Expected format is YYYY-MM.`);
            }

            const startDay = `${month}-01`;
            const endDay = dayjs(startDay).endOf('month').format('YYYY-MM-DD');

            // Завантажуємо дані
            const verificationsSnapshot = await this.verificationsCollection
                .where('day', '>=', startDay)
                .where('day', '<=', endDay)
                .get();

            if (verificationsSnapshot.empty) {
                this.logger.log(`No verifications found for the month: ${month}`);
                return;
            }

            const countryData: { [key: string]: any } = {};

            // Генеруємо дані для кожної країни
            verificationsSnapshot.docs.forEach(doc => {
                const { day, serviceID, createdAt, totalServiceCount, verificationsFor100USD, ...rest } = doc.data();
                const dayIndex = parseInt(day.slice(-2), 10) - 1;
                const countryMonth = day.slice(0, 7);

                Object.entries(rest).forEach(([countryID, countryInfo]: [string, any]) => {
                    const documentId = `${countryMonth}_${countryID}`;

                    if (!countryData[documentId]) {
                        countryData[documentId] = {
                            month: countryMonth,
                            countryID,
                            createdAt: Timestamp.now(),
                            services: [],
                        };
                    }

                    let serviceEntry = countryData[documentId].services.find(
                        (s: any) => s.serviceID === serviceID
                    );

                    if (!serviceEntry) {
                        serviceEntry = { serviceID, data: Array(31).fill(null) };
                        countryData[documentId].services.push(serviceEntry);
                    }

                    serviceEntry.data[dayIndex] = countryInfo;
                });
            });

            const newCollection = this.verificationsCollection.firestore.collection('verificationsByCountries');
            const limit = pLimit(3); // Ліміт одночасних запитів
            const writePromises: Promise<void>[] = []; // Оголошуємо тип явно

            Object.entries(countryData).forEach(([docId, docData], index) => {
                writePromises.push(limit(async () => {
                    const docSize = getDocumentSize(docData);

                    if (docSize > 1048576) {
                        this.logger.error(`Document ${docId} exceeds size limit: ${docSize} bytes`);
                        return; // Пропускаємо великі документи
                    }

                    const docRef = newCollection.doc(docId);

                    // Записуємо дані в Firestore
                    await docRef.set(docData);
                    this.logger.log(`Written document: ${docId}`);
                }));
            });

            await Promise.all(writePromises);
            this.logger.log(`Processed verifications for the month: ${month}`);
        } catch (error) {
            this.logger.error('Error creating verificationsByCountries:', error);
        }
    }

    async exportVerificationsForAllServicesToCSV(month: string) {
        try {
            const servicesSnapshot = await this.servicesCollection.get();
            if (servicesSnapshot.empty) {
                this.logger.warn('No services found.');
                return;
            }
            const filePath = path.join(process.cwd(), `verifications_${month}.csv`);

            const stream = fs.createWriteStream(filePath, { flags: 'w' });
            stream.write('date,serviceID,serviceName,countryID,exchangeRate,count,priceUSD,smspva_count,smspva_priceUSD,smshub_count,smshub_priceUSD,sms_activate_count,sms_activate_priceRUB,5sim_count,5sim_priceRUB\n');

            const limit = pLimit(5); // Запускати не більше 5 потоків одночасно

            await Promise.all(
                servicesSnapshot.docs.map(serviceDoc =>
                    limit(() => this.exportVerificationsByServiceToCSV(serviceDoc.id, month, stream))
                )
            );

            // for (const serviceDoc of servicesSnapshot.docs) {
            //     const serviceID = serviceDoc.id;
            //     this.logger.log(`Processing service: ${serviceID}`);
            //     await this.exportVerificationsByServiceToCSV(serviceID, month, stream);
            // }

            stream.end();
            this.logger.log(`CSV file created successfully: ${filePath}`);
        } catch (error) {
            this.logger.error('Error in exportVerificationsForAllServicesToCSV:', error);
        }
    }

    async exportVerificationsByServiceToCSV(serviceID: string, month: string, stream: fs.WriteStream) {
        try {
            const serviceDoc = await this.servicesCollection.doc(serviceID).get();
            if (!serviceDoc.exists) {
                this.logger.warn(`Service ${serviceID} not found.`);
                return;
            }
            const serviceData = serviceDoc.data();

            const exchangeRatesSnapshot = await this.exchangeRatesCollection.get();
            const exchangeRatesMap: Record<string, number> = {};
            exchangeRatesSnapshot.forEach(doc => {
                exchangeRatesMap[doc.id] = doc.data()?.RUB ?? 100;
            });

            const countriesSnapshot = await this.countriesCollection
                .where('not_used', '==', false)
                .get();
            const countriesData = countriesSnapshot.docs.map(doc => ({
                id: doc.id,
                id_activate: doc.data().id_activate,
                id_5sim: doc.data().id_5sim,
                id_smspva: doc.data().id_smspva,
                id_smshub: doc.data().id_smshub
            }));

            const daysInMonth = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();

            for (let day = 1; day <= daysInMonth; day++) {
                const dayStr = `${month}-${day.toString().padStart(2, '0')}`;
                const exchangeRate = exchangeRatesMap[dayStr] ?? 100;

                const [smsActivateData, fiveSimData, smspvaData, smshubData] = await Promise.all([
                    serviceData?.id_activate ? this.smsActivateService.getVerificationsByDayAndService({ day: dayStr, service_code: serviceData.id_activate }) : Promise.resolve([]),
                    serviceData?.id_5sim ? this.fiveSimService.getVerificationsByDayAndService({ day: dayStr, service_code: serviceData.id_5sim }) : Promise.resolve([]),
                    serviceData?.id_smspva ? this.smspvaService.getVerificationsByDayAndService({ day: dayStr, service_code: serviceData.id_smspva }) : Promise.resolve([]),
                    serviceData?.id_smshub ? this.smshubService.getVerificationsByDayAndService({ day: dayStr, service_code: serviceData.id_smshub }) : Promise.resolve([])
                ]);

                const smsActivateMap = Object.fromEntries(smsActivateData.map(el => [el.country, el]));
                const fiveSimMap = Object.fromEntries(fiveSimData.map(el => [el.country, el]));
                const smspvaMap = Object.fromEntries(smspvaData.map(el => [el.country, el]));
                const smshubMap = Object.fromEntries(smshubData.map(el => [el.country, el]));

                for (const country of countriesData) {
                    const smsActivateDoc = smsActivateMap[country.id_activate] || {};
                    const fiveSimDoc = fiveSimMap[country.id_5sim] || {};
                    const smspvaDoc = smspvaMap[country.id_smspva] || {};
                    const smshubDoc = smshubMap[country.id_smshub] || {};
                    const totalCount = (smsActivateDoc.count ?? 0) + (fiveSimDoc.count ?? 0) + (smspvaDoc.count ?? 0) + (smshubDoc.count ?? 0);
                    const countryPrice = (
                        ((smsActivateDoc.price ?? 0) / exchangeRate * (smsActivateDoc.count ?? 0)) +
                        ((fiveSimDoc.price ?? 0) / exchangeRate * (fiveSimDoc.count ?? 0)) +
                        ((smspvaDoc.price ?? 0) * (smspvaDoc.count ?? 0)) +
                        ((smshubDoc.price ?? 0) * (smshubDoc.count ?? 0))
                    ) / (totalCount || 1);

                    if (totalCount > 0 || countryPrice > 0) {
                        const row = {
                            date: dayStr,
                            serviceID,
                            serviceName: serviceData?.name || '',
                            countryID: country.id,
                            exchangeRate,
                            count: totalCount || null,
                            priceUSD: totalCount > 0 ? countryPrice : null,
                            smspva_count: smspvaDoc.count || 0,
                            smspva_priceUSD: smspvaDoc.price || 0,
                            smshub_count: smshubDoc.count || 0,
                            smshub_priceUSD: smshubDoc.price || 0,
                            sms_activate_count: smsActivateDoc.count || 0,
                            sms_activate_priceRUB: smsActivateDoc.price || 0,
                            '5sim_count': fiveSimDoc.count || 0,
                            '5sim_priceRUB': fiveSimDoc.price || 0
                        };

                        stream.write(Object.values(row).join(',') + '\n');
                    }
                }
            }
            this.logger.log(`Дані для сервісу ${serviceID} записані у CSV.`);
        } catch (error) {
            this.logger.error('Error in exportVerificationsByServiceToCSV:', error);
        }
    }

    async updateVerifications(source: string, part?: string): Promise<{ message: string }> {
        try {
            switch (source) {
                case 'sms-activate':
                    this.logger.debug('Updating SMS-Activate verifications...');
                    await this.smsActivateService.addSmsActivateVerifications();
                    break;
                case '5sim':
                    this.logger.debug('Updating 5sim verifications...');
                    await this.fiveSimService.addFiveSimVerifications(part);
                    break;
                case 'smshub':
                    this.logger.debug('Updating SMSHub verifications...');
                    await this.smshubService.addSmshubVerifications(part);
                    break;
                case 'smspva':
                    this.logger.debug('Updating SMSPVA verifications...');
                    await this.smspvaService.addSmspvaVerifications();
                    break;
                case 'simsms':
                    this.logger.debug('Updating SimSMS verifications...');
                    // await this.addSimsmsServices();
                    break;
                case '':
                    this.logger.warn('Create verifications...');
                    const today = new Date();
                    today.setDate(today.getDate() - 1);
                    const date = today.toISOString().split('T')[0];
                    await this.createVerifications(date);
                    // await this.createVerifications('2024-11-23');
                    return { message: 'not ready' };
                default:
                    this.logger.warn(`Unknown source: ${source}`);
                    return { message: 'There is no such service' };
            }
            return { message: 'Verifications updated successfully' };
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error(`Failed to update verifications: ${error.message}`);
                throw new Error(`Failed to update verifications: ${error.message}`);
            } else {
                this.logger.error('An unknown error occurred');
                throw new Error('Failed to update verifications due to an unknown error');
            }
        }
    }
}
