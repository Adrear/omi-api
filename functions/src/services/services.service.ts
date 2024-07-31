import {Inject, Injectable, Logger} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CollectionReference } from '@google-cloud/firestore';
import { firstValueFrom } from 'rxjs';
import { ServiceDocument, SmshubServiceDocument, SmsActivateServiceDocument, FiveSimServiceDocument, SimsmsServiceDocument, SmspvaServiceDocument } from './documents/index.document';
import {ConfigService} from "@nestjs/config";
import dataSmshub from "./smshub.json";
import data5sim from "./5sim.json";
import dataSimsms from "./simsms.json";
import dataSmspva from "./smspva.json";
import dataMaster from "./services.json";

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
        @Inject(SimsmsServiceDocument.collectionName)
        private simsmsServicesCollection: CollectionReference<SimsmsServiceDocument>,
        @Inject(SmspvaServiceDocument.collectionName)
        private smspvaServicesCollection: CollectionReference<SmspvaServiceDocument>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {}

    async getAllServices({ lastVisible, itemsPerPage = 20 }: { lastVisible?: string | null, itemsPerPage?: number }) {
        // const totalSnapshot = await this.servicesCollection.get();
        // const totalDocuments = totalSnapshot.size;
        let query = this.servicesCollection
            .orderBy('totalServiceCount', 'desc')
            .limit(itemsPerPage);

        if (lastVisible) {
            query = query.startAfter(lastVisible);
        }
        const snapshot = await query.get();
        const services = snapshot.docs.map(doc => doc.data());
        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
        return {
            data: services,
            meta: {
                // total: totalDocuments,
                lastVisible: lastVisibleDoc ? lastVisibleDoc.id : null,
            }
        };
    }

    async updateServices(source: string): Promise<{ message: string }> {
        try {
            if (!source) {
                await this.updateMasterServices();
                return { message: 'Services updated successfully' };
            } else if (source === 'smshub') {
                await this.addSmshubServices();
                return { message: 'Services updated successfully' };
            } else if (source === 'simsms') {
                await this.addSimsmsServices();
                return { message: 'Services updated successfully' };
            } else if (source === 'smspva') {
                await this.addSmspvaServices();
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

    private async updateMasterServices() {
        const batch = this.servicesCollection.firestore.batch();
        for (const service of dataMaster) {
            const docRef = this.servicesCollection.doc(service.id);
            const serviceData: any = {
                id: service.id,
                name: service.name,
                logo: service.logo,
                category: service.category,
                id_activate: service.id_activate,
                name_activate: service.name_activate,
                id_smshub: service.id_smshub,
                name_smshub: service.name_smshub,
                id_5sim: service.id_5sim,
                name_5sim: service.name_5sim,
                id_simsms: service.id_simsms,
                name_simsms: service.name_simsms,
                id_smspva: service.id_smspva,
                name_smspva: service.name_smspva,
            };
            Object.keys(serviceData).forEach(key => {
                if (serviceData[key] === undefined || serviceData[key] === null || serviceData[key] === "") {
                    delete serviceData[key];
                }
            });

            batch.set(docRef, serviceData);
        }
        await batch.commit();
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
    private async addSimsmsServices() {
        const batch = this.simsmsServicesCollection.firestore.batch();
        for (const service of dataSimsms) {
            const docRef = this.simsmsServicesCollection.doc(service['Код'].toString());
            batch.set(docRef, {
                code: service['Код'],
                name: service['Сервис']
            });
        }
        await batch.commit();
    }
    private async addSmspvaServices() {
        const batch = this.smspvaServicesCollection.firestore.batch();
        for (const service of dataSmspva) {
            const docRef = this.smspvaServicesCollection.doc(service['Code'].toString());
            batch.set(docRef, {
                code: service['Code'],
                name: service['Service']
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
