import { Timestamp } from '@google-cloud/firestore';

export class VerificationDocument {
    static collectionName = 'verifications';

    name: string;
    date: Timestamp;
}