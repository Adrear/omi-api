import {CollectionReference, Timestamp, Query} from '@google-cloud/firestore';
import dayjs from 'dayjs';
import {Logger} from '@nestjs/common';
import {VerificationDocument} from '../documents/index.document';
import {SmsActivateVerificationDocument, FiveSimVerificationDocument} from '../documents/index.document';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export async function getAllVerificationsUtil({
                                                  source,
                                                  date,
                                                  logger,
                                                  verificationsCollection
                                              }: {
    source?: string;
    date?: string;
    logger: Logger;
    verificationsCollection: CollectionReference<VerificationDocument>;
}): Promise<number> {
    let collection: CollectionReference<VerificationDocument> | CollectionReference<SmsActivateVerificationDocument> | CollectionReference<FiveSimVerificationDocument>;

    if (source === 'sms-activate') {
        return 0; // Можна реалізувати логіку, якщо потрібно
    } else if (source === '5sim') {
        return 0; // Можна реалізувати логіку, якщо потрібно
    } else {
        collection = verificationsCollection;
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

    logger.debug(`Executing query with date: ${date}`);
    const snapshot = await query.get();
    logger.debug(`Query returned ${snapshot.docs.length} documents`);

    return snapshot.docs.length;
}
