import { Timestamp } from '@google-cloud/firestore';

export class VerificationDocument {
    static collectionName = 'verifications';

    date!: Timestamp;
    source!: string;
    service_code!: string;
    country_id!: number;
    price!: number;
    retail_price!: number;
    count!: number;

    constructor(
        date: Timestamp,
        source: string,
        service_code: string,
        country_id: number,
        price: number,
        retail_price: number,
        count: number
    ) {
        this.date = date;
        this.source = source;
        this.service_code = service_code;
        this.country_id = country_id;
        this.price = price;
        this.retail_price = retail_price;
        this.count = count;
    }
}