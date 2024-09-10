import {Inject, Injectable, Logger} from '@nestjs/common';
import {CollectionReference, Timestamp, Query} from '@google-cloud/firestore';
import {VerificationDocument, SmsActivateVerificationDocument, FiveSimVerificationDocument} from './documents/index.document';
import { SmshubService } from './byService/smshub.service';
import { FiveSimService } from './byService/5sim.service';
import { SmsActivateService } from './byService/sms-activate.service';
import { SmspvaService } from './byService/smspva.service';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {ServiceDocument} from "../services/documents/service.document";
import * as _ from 'lodash';
import {CountryDocument} from "../countries/documents/country.document";
// @ts-ignore
import { Parser } from 'json2csv';
import * as fs from 'fs';

dayjs.extend(customParseFormat);
interface GetAllVerificationsParams {
    source?: string;
    date?: string;
}

interface VerificationEntry {
    priceUSD: number;
    count: number;
}


@Injectable()
export class VerificationsService {
    private logger: Logger = new Logger(VerificationsService.name);
    constructor(
        @Inject(VerificationDocument.collectionName)
        private verificationsCollection: CollectionReference<VerificationDocument>,
        @Inject(ServiceDocument.collectionName)
        private servicesCollection: CollectionReference<ServiceDocument>,
        @Inject(CountryDocument.collectionName)
        private countriesCollection: CollectionReference<CountryDocument>,
        private readonly smshubService: SmshubService,
        private readonly fiveSimService: FiveSimService,
        private readonly smsActivateService: SmsActivateService,
        private readonly smspvaService: SmspvaService,
    ) {}
    async getAllVerifications({ source, date }: GetAllVerificationsParams): Promise<number> {
        let collection: CollectionReference<VerificationDocument> | CollectionReference<SmsActivateVerificationDocument> | CollectionReference<FiveSimVerificationDocument>;

        if (source === 'sms-activate') {
            // collection = this.smsActivateVerificationsCollection;
            return 0
        } else if (source === '5sim') {
            // collection = this.fiveSimVerificationsCollection;
            return 0
        } else {
            collection = this.verificationsCollection;
        }

        let query: Query<VerificationDocument> | Query<SmsActivateVerificationDocument> | Query<FiveSimVerificationDocument> = collection;

        if (date) {
            const dateObj = dayjs(date, 'DD-MM-YYYY');
            if (!dateObj.isValid()) {
                throw new Error(`Invalid date format: ${date}`);
            }
            const startOfDay = Timestamp.fromDate(dateObj.startOf('day').toDate());
            const endOfDay = Timestamp.fromDate(dateObj.endOf('day').toDate());
            query = query.where('date', '>=', startOfDay).where('date', '<=', endOfDay);
        }

        this.logger.debug(`Executing query with date: ${date}`);
        const snapshot = await query.get();
        this.logger.debug(`Query returned ${snapshot.docs.length} documents`);
        return snapshot.docs.length;
    }

    async exportVerificationsToCSV(day: string) {
        try {
            const verificationsSnapshot = await this.verificationsCollection.where('day', '==', day).get();

            if (verificationsSnapshot.empty) {
                this.logger.log(`No verifications found for day: ${day}`);
                return;
            }

            const verificationsData: any[] = [];

            verificationsSnapshot.docs.forEach((doc) => {
                const data = doc.data();
                const verificationEntry: { [key: string]: any } = {
                    id: doc.id,
                    day: data.day,
                    serviceID: data.serviceID,
                    totalServiceCount: data.totalServiceCount,
                    verificationsFor100USD: data.verificationsFor100USD,
                    createdAt: data.createdAt && data.createdAt.toDate().toISOString(),
                };

                // Додаємо дані по країнам, якщо є
                Object.keys(data).forEach((key) => {
                    if (key !== 'day' && key !== 'serviceID' && key !== 'totalServiceCount' && key !== 'verificationsFor100USD' && key !== 'createdAt') {
                        verificationEntry[`${key}_priceUSD`] = data[key]?.priceUSD || 0;
                        verificationEntry[`${key}_count`] = data[key]?.count || 0;
                    }
                });

                verificationsData.push(verificationEntry);
            });

            const json2csvParser = new Parser();
            const csv = json2csvParser.parse(verificationsData);

            const filePath = `verifications_${day}.csv`;
            fs.writeFileSync(filePath, csv);

            this.logger.log(`CSV file created: ${filePath}`);

        } catch (error) {
            this.logger.error('Error exporting verifications to CSV:', error);
        }
    }

    async createVerifications(day: string) {
        try {
            let batch = this.verificationsCollection.firestore.batch();
            const servicesSnapshot = await this.servicesCollection.get();

            const promises = servicesSnapshot.docs.map(async (serviceDoc) => {
                this.logger.log(serviceDoc.id);

                const [smsActivateDocs, fiveSimDocs, smspvaDocs, smshubDocs] = await Promise.all([
                    serviceDoc.data().id_activate ? this.smsActivateService.getVerificationsByDayAndService({
                        day: day,
                        service_code: serviceDoc.data().id_activate
                    }) : Promise.resolve([]),
                    serviceDoc.data().id_5sim ? this.fiveSimService.getVerificationsByDayAndService({
                        day: day,
                        service_code: serviceDoc.data().id_5sim
                    }) : Promise.resolve([]),
                    serviceDoc.data().id_smspva ? this.smspvaService.getVerificationsByDayAndService({
                        day: day,
                        service_code: serviceDoc.data().id_smspva
                    }) : Promise.resolve([]),
                    serviceDoc.data().id_smshub ? this.smshubService.getVerificationsByDayAndService({
                        day: day,
                        service_code: serviceDoc.data().id_smshub
                    }) : Promise.resolve([])
                ]);

                const countriesSnapshot = await this.countriesCollection.get();
                const verification: { [countryId: string]: VerificationEntry } = {};
                let totalServiceCount = 0; // Змінна для зберігання загальної кількості верифікацій для сервісу
                let verificationsFor100USD = 0;

                for (const countryDoc of countriesSnapshot.docs) {
                    const smsActivateDoc = smsActivateDocs.find(el => el.country === countryDoc.data().id_activate);
                    const fiveSimDoc = fiveSimDocs.find(el => el.country === countryDoc.data().id_5sim);
                    const smspvaDoc = smspvaDocs.find(el => el.country === countryDoc.data().id_smspva);
                    const smshubDoc = smshubDocs.find(el => el.country === countryDoc.data().id_smshub);

                    const totalCount = (smsActivateDoc?.count || 0) + (fiveSimDoc?.count || 0) + (smspvaDoc?.count || 0) + (smshubDoc?.count || 0);
                    const countryPrice = (
                        ((smsActivateDoc?.price || 0) / 100 * (smsActivateDoc?.count || 0)) +
                        ((fiveSimDoc?.price || 0) / 100 * (fiveSimDoc?.count || 0)) +
                        ((smspvaDoc?.price || 0) * (smspvaDoc?.count || 0)) +
                        ((smshubDoc?.price || 0) * (smshubDoc?.count || 0))
                    ) / totalCount;

                    if (totalCount > 0) {
                        verification[countryDoc.id] = {
                            priceUSD: countryPrice,
                            count: totalCount
                        };
                        totalServiceCount += totalCount;
                        verificationsFor100USD += (100 / countryPrice) * totalCount;
                    }
                }

                const verificationData = {
                    day: day,
                    createdAt: Timestamp.now(),
                    serviceID: serviceDoc.id,
                    totalServiceCount,
                    verificationsFor100USD,
                    ...verification
                };

                const docRef = this.verificationsCollection.doc(`${day}_${serviceDoc.id}`);
                batch.set(docRef, verificationData);
                await this.servicesCollection.doc(serviceDoc.id).update({ totalServiceCount });
            });
            await Promise.all(promises);
            await batch.commit();

        } catch (error) {
            this.logger.error('Error in createVerifications:', error);
        }
    }
    async getVerificationsByServiceForTimeline (serviceID: string, body: any) {
        const servicesSnapshot = await this.verificationsCollection
            .where('serviceID', '==', serviceID)
            .orderBy('day', 'desc')
            .limit(5)
            .get();
        return servicesSnapshot.docs.map(el => el.data());
    }

    async getLastVerificationsByService(serviceID: string) {
        const servicesSnapshot = await this.verificationsCollection
            .where('serviceID', '==', serviceID)
            .orderBy('day', 'desc')
            .limit(1)
            .get();
        return servicesSnapshot.docs.map(el => el.data())[0];
    }

    private getYesterdayDate(): string {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const year = yesterday.getFullYear();
        const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
        const day = yesterday.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    async getVerificationsByCountryForTimeline(countryID: string, body: any) {
        try {
            const { services, days } = body;
            const transformedData: { [key: string]: any } = {
                countryID: countryID,
                days: []
            };

            for (let i = 1; i < days+1; i++) {
                const currentDay = this.getDateNDaysAgo(i);
                const countryVerificationsSnapshot = await this.verificationsCollection
                    .where('day', '==', currentDay)
                    .where('serviceID', 'in', services)
                    .get();

                if (!countryVerificationsSnapshot.empty) {
                    const dayData: { [key: string]: any } = {
                        day: currentDay,
                    };

                    countryVerificationsSnapshot.docs.forEach(doc => {
                        const data = doc.data() as VerificationDocument;
                        const serviceID = data.serviceID;
                        if (data[countryID] && data[countryID].count > 0) {
                            dayData[serviceID] = data[countryID];
                        }
                    });

                    transformedData.days.push(dayData);
                }
            }

            return transformedData.days.length > 0 ? transformedData : null;

        } catch (error) {
            this.logger.error('Error in getVerificationsByCountryForTimeline:', error);
            throw error;
        }
    }

    private getDateNDaysAgo(n: number): string {
        const date = new Date();
        date.setDate(date.getDate() - n);
        return this.formatDateToString(date);
    }

    private formatDateToString(date: Date): string {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0'); // Січень - 0!
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }


    async getLastVerificationsByCountry(countryID: string) {
        try {
            const day = this.getYesterdayDate();

            // Отримуємо всі документи за вчорашній день
            const countryVerificationsSnapshot = await this.verificationsCollection
                .where('day', '==', day)
                .get();

            if (countryVerificationsSnapshot.empty) {
                return null;
            }

            const transformedData: { [key: string]: any } = {
                createdAt: null,
                day: day,
                countryID: countryID
            };

            countryVerificationsSnapshot.docs.forEach(doc => {
                const data = doc.data() as VerificationDocument;
                const serviceID = data.serviceID;
                if (data[countryID] && data[countryID].count > 0) {
                    transformedData.createdAt = data.createdAt || transformedData.createdAt;
                    transformedData[serviceID] = data[countryID];
                }
            });

            return transformedData;

        } catch (error) {
            this.logger.error('Error in getLastVerificationsByCountry:', error);
            throw error;
        }
    }

    async updateCountryIndexes(day: string) {
        try {
            const verificationsSnapshot = await this.verificationsCollection
                .where('day', '==', day)
                .get();

            const countriesSnapshot = await this.countriesCollection
                .where('not_used', '==', false)
                .get();

            if (verificationsSnapshot.empty) {
                return null;
            }
            for (const countryDoc of countriesSnapshot.docs) {
                let totalCountryCount = 0
                verificationsSnapshot.docs.forEach(verificationDoc => {
                    const data = verificationDoc.data() as VerificationDocument;
                    if (data[countryDoc.id] && data[countryDoc.id].count > 0) {
                        totalCountryCount += data[countryDoc.id].count;
                    }
                });

                await this.countriesCollection.doc(countryDoc.id).update({ totalCountryCount });
            }
            return 'finish'
        } catch (error) {
            this.logger.error('Error in getLastVerificationsByCountry:', error);
            throw error;
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
