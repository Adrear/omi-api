export class ExchangeRatesDocument {
    static collectionName = 'exchangeRates';

    id: string;
    date: string;
    base_code: string;
    USD: number;
    EUR: number;
    RUB: number;
    UAH: number;

    constructor(
        id: string,
        date: string,
        base_code: string,
        USD: number,
        EUR: number,
        RUB: number,
        UAH: number
    ) {
        this.id = id;
        this.date = date;
        this.base_code = base_code;
        this.USD = USD;
        this.EUR = EUR;
        this.RUB = RUB;
        this.UAH = UAH;
    }
}