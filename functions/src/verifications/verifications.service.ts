import dayjs from 'dayjs';
import { Inject, Injectable } from '@nestjs/common';
import { CollectionReference, Timestamp } from '@google-cloud/firestore';
import { VerificationDocument } from './documents/verification.document';

@Injectable()
export class RawReadingsService {

    constructor(
        @Inject(VerificationDocument.collectionName)
        private verificationsCollection: CollectionReference<VerificationDocument>,
    ) {}

    async create({ name, date }: { name: string, date: Date }): Promise<VerificationDocument> {
        const docRef = this.verificationsCollection.doc(name);
        const dateMillis = dayjs(date).valueOf();
        await docRef.set({
            name,
            date: Timestamp.fromMillis(dateMillis),
        } as VerificationDocument); // Додайте типізацію тут як VerificationDocument
        const verificationDoc = await docRef.get();
        return verificationDoc.data() as VerificationDocument;
    }

    async findAll(): Promise<VerificationDocument[]> {
        const snapshot = await this.verificationsCollection.get();
        const verifications: VerificationDocument[] = [];
        snapshot.forEach(doc => verifications.push(doc.data()));
        return verifications;
    }
}
