import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CollectionReference, Timestamp } from '@google-cloud/firestore';
import { firstValueFrom } from 'rxjs';
import { FiveSimVerificationDocument } from '../documents/index.document';
import { ServiceDocument } from '../../services/documents/index.document';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timeout from '../../helpers/timeout';
dayjs.extend(customParseFormat);

@Injectable()
export class FiveSimService {
    private logger: Logger = new Logger(FiveSimService.name);
    constructor(
        @Inject(FiveSimVerificationDocument.collectionName)
        private fiveSimVerificationsCollection: CollectionReference<FiveSimVerificationDocument>,
        @Inject(ServiceDocument.collectionName)
        private servicesCollection: CollectionReference<ServiceDocument>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {}
    public async addFiveSimVerifications() {
        const batchLimit = 100; // Firestore має ліміт на 500 операцій в одному батчі
        let batch = this.fiveSimVerificationsCollection.firestore.batch();
        let batchCounter = 0;

        const servicesSnapshot = await this.servicesCollection
            .orderBy('id_5sim')
            .where('id_5sim', '>=', 'hepsiburadacom')
            .where('id_5sim', '<=', 'gx')
            .get();

        for (const doc of servicesSnapshot.docs) {
            const url = `https://5sim.net/v1/guest/prices?product=${doc.data().id_5sim}`;
            const response = await firstValueFrom(this.httpService.get(url, {
                headers: {
                    Authorization: `Bearer ${this.configService.get<string>('app.api_key_5sim')}`,
                },
            }));

            await timeout(6000);
            this.logger.debug(`Fetching data for service: ${doc.id}`);

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
                this.logger.error(`Failed to fetch data for product ${doc.id}`);
            }
        }

        if (batchCounter > 0) {
            await batch.commit(); // Комміт останнього батчу
        }
    }
}
