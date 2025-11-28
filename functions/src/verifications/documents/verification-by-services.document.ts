import {Timestamp} from "@google-cloud/firestore";

export class VerificationDocument {
    static collectionName = 'verifications';

    day: string;
    serviceID: string;
    createdAt?: Timestamp;
    totalServiceCount: number;
    [countryID: string]: any; // Динамічні ключі для країн

    constructor(
        day: string,
        serviceID: string,
        totalServiceCount: number,
        createdAt?: Timestamp
    ) {
        this.day = day;
        this.serviceID = serviceID;
        this.totalServiceCount = totalServiceCount;
        this.createdAt = createdAt;
    }
}
