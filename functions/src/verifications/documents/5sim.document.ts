import { Timestamp } from '@google-cloud/firestore';

interface ProviderInfo {
    cost: number;
    count: number;
}
interface PriceInfo {
    [provider: string]: ProviderInfo;
}
export class FiveSimVerificationDocument {
    static collectionName = '5sim-verifications';

    date!: Timestamp;
    source!: string;
    service_code!: string;
    country!: string;
    price_info!: PriceInfo;

    constructor(
        date: Timestamp,
        source: string,
        service_code: string,
        country: string,
        price: PriceInfo
    ) {
        this.date = date;
        this.source = source;
        this.service_code = service_code;
        this.country = country;
        this.price_info = price;
    }
}