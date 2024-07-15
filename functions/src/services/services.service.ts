import {Inject, Injectable, Logger} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CollectionReference } from '@google-cloud/firestore';
import { firstValueFrom } from 'rxjs';
import { ServiceDocument, SmshubServiceDocument, SmsActivateServiceDocument, FiveSimServiceDocument } from './documents/index.document';
import {ConfigService} from "@nestjs/config";
import dataSmshub from "./smshub.json";
import data5sim from "./5sim.json";

@Injectable()
export class ServicesService {
    private logger: Logger = new Logger(ServicesService.name);

    constructor(
        @Inject(ServiceDocument.collectionName)
        private servicesCollection: CollectionReference<ServiceDocument>,
        @Inject(SmsActivateServiceDocument.collectionName)
        private smsActivateServicesCollection: CollectionReference<SmsActivateServiceDocument>,
        @Inject(FiveSimServiceDocument.collectionName)
        private fiveSimServicesCollection: CollectionReference<FiveSimServiceDocument>,
        @Inject(SmshubServiceDocument.collectionName)
        private smshubServicesCollection: CollectionReference<SmshubServiceDocument>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {}

    async getAllServices() {
        const snapshot = await this.servicesCollection.get();
        return snapshot.docs.map(doc => doc.data());
    }

    async updateServices(source: string): Promise<{ message: string }> {
        try {
            if (source === 'smshub') {
                await this.addSmshubServices();
                return { message: 'Services updated successfully' };
            } else if (source === '5sim') {
                await this.addFiveSimServices();
                return { message: 'Services updated successfully' };
            } else {
                const apiUrl = this.getApiUrl(source);
                const response = await firstValueFrom(this.httpService.get(apiUrl));
                if (response.data) {
                    await this.addServices(response.data, source);
                    return { message: 'Services updated successfully' };
                } else {
                    throw new Error('Failed to fetch services');
                }
            }
        } catch (error: any) {
            this.logger.error(`Failed to update services: ${error.message}`);
            throw new Error('Failed to update services');
        }
    }

    private getApiUrl(source: string): string {
        if (source === 'sms-activate') {
            return `https://api.sms-activate.org/stubs/handler_api.php?api_key=${this.configService.get<string>('app.api_key_sms_activate')}&action=getServicesList&lang=en`;
        }
        throw new Error('Unknown data source');
    }

    public async addServices(data: any, source: string): Promise<void> {
        if (source === 'sms-activate') {
            await this.addSmsActivateServices(data.services);
        }
    }

    private async addSmshubServices() {
        const batch = this.smshubServicesCollection.firestore.batch();
        for (const service of dataSmshub) {
            const docRef = this.smshubServicesCollection.doc(service['ID'].toString());
            batch.set(docRef, {
                code: service['ID'],
                name: service['Name']
            });
        }
        await batch.commit();
    }
    private async addFiveSimServices(): Promise<void> {
        const batch = this.fiveSimServicesCollection.firestore.batch();
        for (const country of data5sim) {
            const docRef = this.fiveSimServicesCollection.doc(country['API 5SIM'].toString());
            batch.set(docRef, {
                code: country['API 5SIM'],
                name: country['Service']
            });
        }
        await batch.commit();
    }

    private async addSmsActivateServices(services: any[]) {
        const batch = this.smsActivateServicesCollection.firestore.batch();
        const collectionRef = this.smsActivateServicesCollection;

        services.forEach(service => {
            const docRef = collectionRef.doc(service.code);
            batch.set(docRef, service);
        });
        await batch.commit();
    }
}
