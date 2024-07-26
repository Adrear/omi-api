import {Timestamp} from "@google-cloud/firestore";

export class SmspvaVerificationDocument {
    static collectionName = 'smspva-verifications';

    country: string;
    date: Timestamp;
    count_info: object;
    service_code: string;
    source: string;
    price: number;
    serviceDescription: string;

    constructor(
        country: string,
        date: Timestamp,
        count_info: object,
        service_code: string,
        source: string,
        price: number,
        serviceDescription: string
    ) {
        this.country = country;
        this.date = date;
        this.count_info = count_info;
        this.service_code = service_code;
        this.source = source;
        this.price = price;
        this.serviceDescription = serviceDescription;
    }
}
