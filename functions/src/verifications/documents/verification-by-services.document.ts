import {Timestamp} from "@google-cloud/firestore";
interface CountryVerification {
    countryID: string;
    data: { [day: number]: { count: number | null; priceUSD: number | null } };
}

export class VerificationByServicesDocument {
    static collectionName = 'verificationsByServices';

    serviceID: string;
    createdAt?: Timestamp;
    month: string;
    countries: CountryVerification[];

    constructor(
        serviceID: string,
        month: string,
        countries: CountryVerification[],
        createdAt?: Timestamp
    ) {
        this.serviceID = serviceID;
        this.month = month;
        this.countries = countries;
        this.createdAt = createdAt;
    }
}
