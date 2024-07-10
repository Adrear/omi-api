import dayjs from 'dayjs';
import {Inject, Injectable, Logger} from '@nestjs/common';
import {CollectionReference, Timestamp} from '@google-cloud/firestore';
import {VerificationDocument} from './documents/verification.document';
import { firstValueFrom } from 'rxjs';
import {HttpService} from "@nestjs/axios";
import {ConfigService} from '@nestjs/config';

@Injectable()
export class VerificationsService {
    private logger: Logger = new Logger(VerificationsService.name);

    constructor(
        @Inject(VerificationDocument.collectionName)
        private verificationsCollection: CollectionReference<VerificationDocument>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {}

    async findAll(): Promise<VerificationDocument[]> {
        const snapshot = await this.verificationsCollection.get();
        const verifications: VerificationDocument[] = [];
        snapshot.forEach(doc => verifications.push(doc.data()));
        return verifications;
    }

    async updateVerifications(): Promise<{ message: string }> {
        const apiKey = this.configService.get<string>('app.api_key_sms_activate');
        const apiUrl = `https://api.sms-activate.org/stubs/handler_api.php?action=getPricesVerification&api_key=${apiKey}`;

        try {
            const response = await firstValueFrom(this.httpService.get(apiUrl));

            if (response.data) {
                await this.addVerifications(response.data);
                return { message: 'Verifications updated successfully' };
            } else {
                throw new Error('Failed to fetch verifications');
            }
        } catch (error: any) {
            this.logger.error(`Failed to update verifications: ${error.message}`);
            throw new Error('Failed to update verifications');
        }
    }

    private async addVerifications(data: any): Promise<void> {
        const batch = this.verificationsCollection.firestore.batch();

        for (const [serviceCode, countries] of Object.entries<any>(data)) {
            for (const [countryId, { count, price, retail_price }] of Object.entries<any>(countries)) {
                const verificationData: VerificationDocument = {
                    date: Timestamp.fromMillis(dayjs().valueOf()),
                    source: 'sms-activate',
                    service_code: serviceCode,
                    country_id: Number(countryId),
                    price: Number(price),
                    retail_price: Number(retail_price),
                    count: Number(count),
                };

                const docRef = this.verificationsCollection.doc(); // Generate Firestore document ID
                batch.set(docRef, verificationData);
            }
        }

        await batch.commit();
    }
}
