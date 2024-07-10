import {Inject, Injectable, Logger} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CollectionReference } from '@google-cloud/firestore';
import { firstValueFrom } from 'rxjs';
import { ServiceDocument } from './documents/service.document';

@Injectable()
export class ServicesService {
    private logger: Logger = new Logger(ServicesService.name);

    constructor(
        @Inject(ServiceDocument.collectionName)
        private servicesCollection: CollectionReference<ServiceDocument>,
        private readonly httpService: HttpService
    ) {}

    async addServices(services: any[]) {
        const batch = this.servicesCollection.firestore.batch();
        const collectionRef = this.servicesCollection;

        services.forEach(service => {
            const docRef = collectionRef.doc(service.code);
            batch.set(docRef, service);
        });

        await batch.commit();
    }

    async getAllServices() {
        const snapshot = await this.servicesCollection.get();
        return snapshot.docs.map(doc => doc.data());
    }

    async updateServices() {
        const url = 'https://api.sms-activate.org/stubs/handler_api.php?api_key=93639df3e1b7c6c26A11e20e5b997e89&action=getServicesList&lang=en';

        try {
            const response = await firstValueFrom(this.httpService.get<any>(url));

            if (response.data.status === 'success') {
                await this.addServices(response.data.services);
                return { message: 'Services updated successfully' };
            } else {
                throw new Error('Failed to fetch services');
            }
        } catch (error: any) {
            this.logger.error(`Failed to update services: ${error.message}`);
            throw new Error('Failed to update services');
        }
    }
}
