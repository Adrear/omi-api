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

                for (const countryDoc of countriesSnapshot.docs) {
                    const smsActivateDoc = smsActivateDocs.find(el => el.country === countryDoc.data().id_activate);
                    const fiveSimDoc = fiveSimDocs.find(el => el.country === countryDoc.data().id_5sim);
                    const smspvaDoc = smspvaDocs.find(el => el.country === countryDoc.data().id_smspva);
                    const smshubDoc = smshubDocs.find(el => el.country === countryDoc.data().id_smshub);

                    const totalCount = (smsActivateDoc?.count || 0) + (fiveSimDoc?.count || 0) + (smspvaDoc?.count || 0) + (smshubDoc?.count || 0);

                    if (totalCount > 0) {
                        verification[countryDoc.id] = {
                            priceUSD: (
                                ((smsActivateDoc?.price || 0) / 100 * (smsActivateDoc?.count || 0)) +
                                ((fiveSimDoc?.price || 0) / 100 * (fiveSimDoc?.count || 0)) +
                                ((smspvaDoc?.price || 0) * (smspvaDoc?.count || 0)) +
                                ((smshubDoc?.price || 0) * (smshubDoc?.count || 0))
                            ) / totalCount,
                            count: totalCount
                        };
                    }
                }

                const verificationData = {
                    day: day,
                    createdAt: new Date(),
                    serviceID: serviceDoc.id,
                    ...verification
                };

                const docRef = this.verificationsCollection.doc(`${day}_${serviceDoc.id}`);
                batch.set(docRef, verificationData);
            });
            await Promise.all(promises);
            await batch.commit();

        } catch (error) {
            this.logger.error('Error in createVerifications:', error);
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
                    // await this.createVerifications();
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
