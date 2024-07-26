import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CollectionReference, Timestamp } from '@google-cloud/firestore';
import { firstValueFrom } from 'rxjs';
import { SmshubVerificationDocument } from '../documents/index.document';
import { ServiceDocument } from '../../services/documents/index.document';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timeout from '../../helpers/timeout';
import * as _ from 'lodash';
dayjs.extend(customParseFormat);

@Injectable()
export class SmshubService {

    private logger: Logger = new Logger(SmshubService.name);

    constructor(
        @Inject(SmshubVerificationDocument.collectionName)
        private smshubVerificationsCollection: CollectionReference<SmshubVerificationDocument>,
        @Inject(ServiceDocument.collectionName)
        private servicesCollection: CollectionReference<ServiceDocument>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {}

    public async addSmshubVerifications(): Promise<void> {
        const batchLimit = 100;
        let batch = this.smshubVerificationsCollection.firestore.batch();
        let batchCounter = 0;

        const servicesSnapshot = await this.servicesCollection
            .orderBy('id_smshub')
            .where('__name__', '>=', 'mv')
            .get();

        for (const doc of servicesSnapshot.docs) {
            const url = `https://smshub.org/stubs/handler_api.php?api_key=${this.configService.get<string>('app.api_key_smshub')}&action=getPrices&service=${doc.data().id_smshub}&currency=840`;
            const response = await firstValueFrom(this.httpService.get(url));

            await timeout(6000);
            this.logger.debug(`Fetching data for service: ${doc.id}`);

            if (response && response.data) {
                for (const [countryID, service] of Object.entries<any>(response.data)) {
                    if (service && !_.isEmpty(service)) {
                        for (const [serviceID, price_info] of Object.entries<any>(service)) {
                            if (price_info) {
                                const verificationData: SmshubVerificationDocument = {
                                    date: Timestamp.fromMillis(dayjs().valueOf()),
                                    source: 'smshub',
                                    service_code: serviceID,
                                    country: countryID,
                                    price_info: price_info,
                                };

                                const docRef = this.smshubVerificationsCollection.doc(); // Generate Firestore document ID
                                batch.set(docRef, verificationData);
                                batchCounter++;

                                if (batchCounter >= batchLimit) {
                                    await batch.commit();
                                    batch = this.smshubVerificationsCollection.firestore.batch();
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
            await batch.commit();
        }
    }
}
