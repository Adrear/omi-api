import { Timestamp } from '@google-cloud/firestore';

export class SmshubVerificationDocument {
    static collectionName = 'smshub-verifications';

    date!: Timestamp;
    source!: string;
    service_code!: string;
    country!: string;
    price_info!: object;

    constructor(
        date: Timestamp,
        source: string,
        service_code: string,
        country: string,
        price: object
    ) {
        this.date = date;
        this.source = source;
        this.service_code = service_code;
        this.country = country;
        this.price_info = price;
    }
}
