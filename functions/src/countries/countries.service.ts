import {Inject, Injectable, Logger} from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {CollectionReference} from '@google-cloud/firestore';
import {firstValueFrom} from 'rxjs';
import {CountryDocument} from './documents/country.document';

@Injectable()
export class CountriesService {
    private logger: Logger = new Logger(CountriesService.name);

    constructor(
        @Inject(CountryDocument.collectionName)
        private countriesCollection: CollectionReference<CountryDocument>,
        private readonly httpService: HttpService
    ) {}

    async addCountries(countries: any[]) {
        const batch = this.countriesCollection.firestore.batch();
        for (const countryID in countries) {
            const docRef = this.countriesCollection.doc(countryID);
            batch.set(docRef, countries[countryID]);
        }

        await batch.commit();
    }

    async getAllCountries() {
        const snapshot = await this.countriesCollection.get();
        return snapshot.docs.map(doc => doc.data());
    }

    async updateCountries() {
        const url = 'https://api.sms-activate.io/stubs/handler_api.php?api_key=93639df3e1b7c6c26A11e20e5b997e89&action=getCountries';

        try {
            const response = await firstValueFrom(this.httpService.get<any>(url));

            if (response.data) {
                await this.addCountries(response.data);
                return { message: 'Countries updated successfully' };
            } else {
                throw new Error('Failed to fetch countries');
            }
        } catch (error: any) {
            this.logger.error(`Failed to update countries: ${error.message}`);
            throw new Error('Failed to update countries');
        }
    }
}
