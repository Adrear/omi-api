import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';

@Injectable()
export class ServicesService {
    private firestore: Firestore;

    constructor() {
        this.firestore = new Firestore();
    }

    async addServices(services: any[]) {
        const batch = this.firestore.batch();
        const collectionRef = this.firestore.collection('services');

        services.forEach(service => {
            const docRef = collectionRef.doc(service.code);
            batch.set(docRef, service);
        });

        await batch.commit();
    }

    async getAllServices() {
        const snapshot = await this.firestore.collection('services').get();
        return snapshot.docs.map(doc => doc.data());
    }
}