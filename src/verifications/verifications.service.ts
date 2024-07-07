import {Inject, Injectable, Logger,} from '@nestjs/common';
import * as dayjs from 'dayjs';
import {CollectionReference, Timestamp} from '@google-cloud/firestore';
import {VerificationDocument} from './documents/verification.document';

@Injectable()
export class RawReadingsService {
    private logger: Logger = new Logger(RawReadingsService.name);

    constructor(
        @Inject(VerificationDocument.collectionName)
        private verificationsCollection: CollectionReference<VerificationDocument>,
    ) {}

    async create({ name, date }): Promise<VerificationDocument> {
        const docRef = this.verificationsCollection.doc(name);
        const dateMillis = dayjs(date).valueOf();
        await docRef.set({
            name,
            date: Timestamp.fromMillis(dateMillis),
        });
        const verificationDoc = await docRef.get();
        return verificationDoc.data();
    }

    async findAll(): Promise<VerificationDocument[]> {
        const snapshot = await this.verificationsCollection.get();
        const verifications: VerificationDocument[] = [];
        snapshot.forEach(doc => verifications.push(doc.data()));
        return verifications;
    }
}