import { Timestamp } from '@google-cloud/firestore';

export class VerificationDocument {
    static collectionName = 'verifications';
    name: string;
    date: Timestamp;

    constructor(name: string, date: Timestamp) {
        this.name = name;
        this.date = date;
    }
}