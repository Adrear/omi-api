import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CollectionReference, Timestamp } from '@google-cloud/firestore';
import { firstValueFrom } from 'rxjs';
import { SmsActivateVerificationDocument } from '../documents/index.document';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

@Injectable()
export class SmsActivateService {

    private logger: Logger = new Logger(SmsActivateService.name);
    constructor(
        @Inject(SmsActivateVerificationDocument.collectionName)
        private smsActivateVerificationsCollection: CollectionReference<SmsActivateVerificationDocument>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {}

    public async addSmsActivateVerifications(): Promise<void> {
        this.logger.debug('Fetching verification data for sms-activate');
        const apiUrl = `https://api.sms-activate.org/stubs/handler_api.php?api_key=${this.configService.get<string>('app.api_key_sms_activate')}&action=getPricesVerification&lang=en`;
        const response = await firstValueFrom(this.httpService.get(apiUrl));
        const batch = this.smsActivateVerificationsCollection.firestore.batch();

        for (const [serviceCode, countries] of Object.entries<any>(response.data)) {
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
}
