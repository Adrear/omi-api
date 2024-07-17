import {Inject, Injectable, Logger} from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {CollectionReference} from '@google-cloud/firestore';
import {firstValueFrom} from 'rxjs';
import {FiveSimCountryDocument, SmsActivateCountryDocument, CountryDocument, SmshubCountryDocument, SimsmsCountryDocument, SmspvaCountryDocument} from './documents/index.document';
import {ConfigService} from "@nestjs/config";
import dataSmshub from './smshub.json'
import dataSimsms from './simsms.json'
import dataSmspva from './smspva.json'

@Injectable()
export class CountriesService {
    private logger: Logger = new Logger(CountriesService.name);

    constructor(
        @Inject(CountryDocument.collectionName)
        private countriesCollection: CollectionReference<CountryDocument>,
        @Inject(SmsActivateCountryDocument.collectionName)
        private smsActivateCountriesCollection: CollectionReference<SmsActivateCountryDocument>,
        @Inject(FiveSimCountryDocument.collectionName)
        private fiveSimCountriesCollection: CollectionReference<FiveSimCountryDocument>,
        @Inject(SmshubCountryDocument.collectionName)
        private smshubCountriesCollection: CollectionReference<SmshubCountryDocument>,
        @Inject(SimsmsCountryDocument.collectionName)
        private simsmsCountriesCollection: CollectionReference<SimsmsCountryDocument>,
        @Inject(SmspvaCountryDocument.collectionName)
        private smspvaCountriesCollection: CollectionReference<SmspvaCountryDocument>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {}

    async getAllCountries() {
        const snapshot = await this.countriesCollection.get();
        return snapshot.docs.map(doc => doc.data());
    }

    async updateCountries(source: string): Promise<{ message: string }> {
        try {
            if (source === 'smshub') {
                await this.addSmshubCountries();
                return { message: 'Countries updated successfully' };
            } else if (source === 'simsms') {
                await this.addSimsmsCountries();
                return { message: 'Countries updated successfully' };
            } else if (source === 'smspva') {
                await this.addSmspvaCountries();
                return { message: 'Countries updated successfully' };
            } else {
                const apiUrl = this.getApiUrl(source);
                const response = await firstValueFrom(this.httpService.get(apiUrl));
                if (response.data) {
                    await this.addCountries(response.data, source);
                    return { message: 'Countries updated successfully' };
                } else {
                    throw new Error('Failed to fetch countries');
                }
            }
        } catch (error: any) {
            this.logger.error(`Failed to update countries: ${error.message}`);
            throw new Error('Failed to update countries');
        }
    }
    private getApiUrl(source: string): string {
        if (source === 'sms-activate') {
            return `https://api.sms-activate.org/stubs/handler_api.php?api_key=${this.configService.get<string>('app.api_key_sms_activate')}&action=getCountries&lang=en`;
        } else if (source === '5sim') {
            return `https://5sim.net/v1/guest/countries`;
        }
        throw new Error('Unknown data source');
    }

    public async addCountries(data: any, source: string): Promise<void> {
        if (source === 'sms-activate') {
            await this.addSmsActivateCountries(data);
        } else if (source === '5sim') {
            await this.addFiveSimCountries(data);
        }
    }
    private async addSmshubCountries() {
        const batch = this.smshubCountriesCollection.firestore.batch();
        for (const country of dataSmshub) {
            const docRef = this.smshubCountriesCollection.doc(country['ID'].toString());
            batch.set(docRef, {
                id: country['ID'],
                name: country['Name'],
                key: country['Countries'],
                operators: country['Available Operators'].split(',')
            });
        }
        await batch.commit();
    }

    private async addSimsmsCountries() {
        const batch = this.simsmsCountriesCollection.firestore.batch();
        for (const country of dataSimsms) {
            const docRef = this.simsmsCountriesCollection.doc(country['code'].toString());
            batch.set(docRef, {
                id: country['code'],
                text_ru: country['country']
            });
        }
        await batch.commit();
    }

    private async addSmspvaCountries() {
        const batch = this.smspvaCountriesCollection.firestore.batch();
        for (const country of dataSmspva) {
            const docRef = this.smspvaCountriesCollection.doc(country['Code'].toString());
            batch.set(docRef, {
                id: country['Code'],
                text_en: country['Country']
            });
        }
        await batch.commit();
    }

    private async addSmsActivateCountries(countries: any[]) {
        const batch = this.smsActivateCountriesCollection.firestore.batch();
        for (const countryID in countries) {
            const docRef = this.smsActivateCountriesCollection.doc(countryID);
            batch.set(docRef, countries[countryID]);
        }
        await batch.commit();
    }

    private async addFiveSimCountries(countries: any[]): Promise<void> {
        const batch = this.fiveSimCountriesCollection.firestore.batch();
        for (const countryKey in countries) {
            const country = countries[countryKey];
            const iso = Object.entries(country.iso).find(([, value]) => value === 1)?.[0];
            const prefix = Object.entries(country.prefix).find(([, value]) => value === 1)?.[0];
            const countryData = {
                iso: iso || 'unknown',
                prefix: prefix || 'unknown',
                text_en: country.text_en,
                text_ru: country.text_ru
            }
            const docRef = iso ? this.fiveSimCountriesCollection.doc(iso) : this.fiveSimCountriesCollection.doc();
            batch.set(docRef, countryData);
        }
        await batch.commit();
    }
}
