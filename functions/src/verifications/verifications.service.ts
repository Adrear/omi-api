import {Inject, Injectable, Logger} from '@nestjs/common';
import {CollectionReference, Timestamp, Query} from '@google-cloud/firestore';
import {VerificationDocument, SmsActivateVerificationDocument, FiveSimVerificationDocument} from './documents/index.document';
import { SmshubService } from './byService/smshub.service';
import { FiveSimService } from './byService/5sim.service';
import { SmsActivateService } from './byService/sms-activate.service';
import { SmspvaService } from './byService/smspva.service';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
interface GetAllVerificationsParams {
    source?: string;
    date?: string;
}
@Injectable()
export class VerificationsService {
    private logger: Logger = new Logger(VerificationsService.name);
    constructor(
        @Inject(VerificationDocument.collectionName)
        private verificationsCollection: CollectionReference<VerificationDocument>,
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

    async updateVerifications(source: string): Promise<{ message: string }> {
        try {
            switch (source) {
                case 'sms-activate':
                    this.logger.debug('Updating SMS-Activate verifications...');
                    await this.smsActivateService.addSmsActivateVerifications();
                    break;
                case '5sim':
                    this.logger.debug('Updating 5sim verifications...');
                    await this.fiveSimService.addFiveSimVerifications();
                    break;
                case 'smshub':
                    this.logger.debug('Updating SMSHub verifications...');
                    await this.smshubService.addSmshubVerifications();
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
                    this.logger.warn('Source is empty, not ready to update verifications.');
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
