import {CollectionReference, Query, Timestamp} from "@google-cloud/firestore";
import {VerificationDocument} from "../documents/verification.document";
import {SmsActivateVerificationDocument} from "../documents/sms-activate.document";
import {FiveSimVerificationDocument} from "../documents/5sim.document";
import dayjs from "dayjs";

interface GetAllVerificationsParams {
    source?: string;
    date?: string;
}

export function getAllVerifications({ source, date }: GetAllVerificationsParams): Promise<number> {
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