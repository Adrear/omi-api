import {Inject, Injectable, Logger} from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {CollectionReference, Timestamp} from '@google-cloud/firestore';
import { firstValueFrom } from 'rxjs';
import {VerificationDocument, SmsActivateVerificationDocument, FiveSimVerificationDocument} from './documents/index.document';
import {FiveSimServiceDocument} from '../services/documents/index.document';
import {ConfigService} from '@nestjs/config';
import dayjs from 'dayjs';
import timeout from '../helpers/timeout'

@Injectable()
export class VerificationsService {

    private logger: Logger = new Logger(VerificationsService.name);

    constructor(
        @Inject(VerificationDocument.collectionName)
        private verificationsCollection: CollectionReference<VerificationDocument>,
        @Inject(FiveSimVerificationDocument.collectionName)
        private fiveSimVerificationsCollection: CollectionReference<FiveSimVerificationDocument>,
        @Inject(FiveSimServiceDocument.collectionName)
        private fiveSimServicesCollection: CollectionReference<FiveSimServiceDocument>,
        @Inject(SmsActivateVerificationDocument.collectionName)
        private smsActivateVerificationsCollection: CollectionReference<SmsActivateVerificationDocument>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {}

    async getAllVerifications(source: any): Promise<number> {
        let snapshot;
        if (source === 'sms-activate') {
            snapshot = await this.smsActivateVerificationsCollection.get();
        } else {
            snapshot = await this.verificationsCollection.get();
        }
        return snapshot.docs.length;
    }

    async updateVerifications(source: string): Promise<{ message: string }> {
        try {
            if (source === 'smshub') {
                // await this.addSmshubServices();
                return { message: 'Verifications updated successfully' };
            } else if (source === 'simsms') {
                // await this.addSimsmsServices();
                return { message: 'Verifications updated successfully' };
            } else if (source === '5sim') {
                await this.addFiveSimServices();
                return { message: 'Verifications updated successfully' };
            } else if (source === 'smspva') {
                // await this.addSmspvaServices();
                return { message: 'Verifications updated successfully' };
            } else {
                const apiUrl = this.getApiUrl(source);
                const response = await firstValueFrom(this.httpService.get(apiUrl));
                if (response.data) {
                    await this.addServices(response.data, source);
                    return { message: 'Verifications updated successfully' };
                } else {
                    throw new Error('Failed to fetch verifications');
                }
            }
        } catch (error: any) {
            this.logger.error(`Failed to update verifications: ${error.message}`);
            throw new Error('Failed to update verifications');
        }
    }

    private getApiUrl(source: string): string {
        if (source === 'sms-activate') {
            return `https://api.sms-activate.org/stubs/handler_api.php?api_key=${this.configService.get<string>('app.api_key_sms_activate')}&action=getPricesVerification&lang=en`;
        }
        throw new Error('Unknown data source');
    }

    public async addServices(data: any, source: string): Promise<void> {
        if (source === 'sms-activate') {
            await this.addSmsActivateVerifications(data);
        }
    }

    private async addSmsActivateVerifications(data: any[]) {
        const batch = this.smsActivateVerificationsCollection.firestore.batch();

        for (const [serviceCode, countries] of Object.entries<any>(data)) {
            for (const [countryId, { count, price, retail_price }] of Object.entries<any>(countries)) {
                const verificationData: SmsActivateVerificationDocument = {
                    date: Timestamp.fromMillis(dayjs().valueOf()),
                    source: 'sms-activate',
                    service_code: serviceCode,
                    country_id: Number(countryId),
                    price: Number(price),
                    retail_price: Number(retail_price),
                    count: Number(count),
                };

                const docRef = this.smsActivateVerificationsCollection.doc(); // Generate Firestore document ID
                batch.set(docRef, verificationData);
            }
        }
        await batch.commit();
    }

    private async addFiveSimServices() {
        const batchLimit = 100; // Firestore має ліміт на 500 операцій в одному батчі
        let batch = this.fiveSimVerificationsCollection.firestore.batch();
        let batchCounter = 0;

        const servicesSnapshot = await this.fiveSimServicesCollection.get();

        for (const doc of servicesSnapshot.docs) {
            const url = `https://5sim.net/v1/guest/prices?product=${doc.id}`;
            const response = await firstValueFrom(this.httpService.get(url, {
                headers: {
                    Authorization: `Bearer ${this.configService.get<string>('app.api_key_5sim')}`,
                },
            }));

            await timeout(6000);
            console.log('Fetching data for product:', doc.id);

            if (response && response.data) {
                for (const [serviceID, countries] of Object.entries<any>(response.data)) {
                    if (countries) {
                        for (const [country, price_info] of Object.entries<any>(countries)) {
                            if (price_info) {
                                const verificationData: FiveSimVerificationDocument = {
                                    date: Timestamp.fromMillis(dayjs().valueOf()),
                                    source: '5sim',
                                    service_code: serviceID,
                                    country: country,
                                    price_info: price_info,
                                };

                                const docRef = this.fiveSimVerificationsCollection.doc(); // Generate Firestore document ID
                                batch.set(docRef, verificationData);
                                batchCounter++;

                                if (batchCounter >= batchLimit) {
                                    await batch.commit();
                                    batch = this.fiveSimVerificationsCollection.firestore.batch();
                                    batchCounter = 0;
                                }
                            }
                        }
                    }
                }
            } else {
                console.error(`Failed to fetch data for product ${doc.id}`);
            }
        }

        if (batchCounter > 0) {
            await batch.commit(); // Комміт останнього батчу
        }
    }
}
