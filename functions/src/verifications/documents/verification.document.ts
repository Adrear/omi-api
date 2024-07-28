export class VerificationDocument {
    static collectionName = 'verifications';

    day: string;
    serviceID: string;

    constructor(
        day: string,
        serviceID: string,
    ) {
        this.day = day;
        this.serviceID = serviceID;
    }
}