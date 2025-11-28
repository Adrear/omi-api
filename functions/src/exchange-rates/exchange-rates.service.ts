import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CollectionReference } from '@google-cloud/firestore';
import { firstValueFrom } from 'rxjs';
import { ExchangeRatesDocument } from './documents/index.document';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExchangeRatesService {
    private logger: Logger = new Logger(ExchangeRatesService.name);
    private readonly apiKey: string;
    private readonly baseCurrency = 'USD';

    constructor(
        @Inject(ExchangeRatesDocument.collectionName)
        private exchangeRatesCollection: CollectionReference<ExchangeRatesDocument>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {
        this.apiKey = this.configService.get<string>('app.exchange_rates_api_key') ?? '';
    }

    async fetchAndStoreHistoricalRates() {
        const startDate = new Date('2024-07-26');
        const endDate = new Date();

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];

            try {
                const exchangeRates = await this.fetchExchangeRates(dateStr);
                if (exchangeRates) {
                    await this.saveExchangeRateToFirestore(dateStr, exchangeRates);
                }
            } catch (error) {
                this.logger.error(`Помилка при обробці ${dateStr}: ${(error as Error).message}`);
            }
        }
    }

    private async fetchExchangeRates(date: string): Promise<Partial<ExchangeRatesDocument> | null> {
        const [year, month, day] = date.split('-');

        const formattedMonth = String(Number(month));
        const formattedDay = String(Number(day));

        const url = `https://v6.exchangerate-api.com/v6/${this.apiKey}/history/${this.baseCurrency}/${year}/${formattedMonth}/${formattedDay}`;

        try {
            const response = await firstValueFrom(this.httpService.get(url));
            if (response.data.result !== 'success') {
                this.logger.warn(`Не вдалося отримати курс для ${date}`);
                return null;
            }

            return {
                id: date,
                date: date,
                base_code: response.data.base_code,
                USD: response.data.conversion_rates.USD,
                EUR: response.data.conversion_rates.EUR,
                RUB: response.data.conversion_rates.RUB,
                UAH: response.data.conversion_rates.UAH,
            };
        } catch (error) {
            this.logger.error(`Помилка при обробці ${date}: ${(error as Error).message}`);
            return null;
        }
    }

    private async saveExchangeRateToFirestore(date: string, exchangeRate: Partial<ExchangeRatesDocument>) {
        try {
            const fullDocument: ExchangeRatesDocument = {
                id: date,
                date: date,
                base_code: exchangeRate.base_code ?? 'USD',
                USD: exchangeRate.USD ?? 0,
                EUR: exchangeRate.EUR ?? 0,
                RUB: exchangeRate.RUB ?? 0,
                UAH: exchangeRate.UAH ?? 0,
            };

            await this.exchangeRatesCollection.doc(date).set(fullDocument);
            this.logger.log(`Курс за ${date} успішно збережено.`);
        } catch (error) {
            this.logger.error(`Помилка збереження в Firestore (${date}): ${(error as Error).message}`);
        }
    }
}
