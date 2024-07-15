export class SmsActivateServiceDocument {
    static collectionName = 'sms-activate-services';

    code: string;
    name: string;

    constructor(code: string, name: string) {
        this.code = code;
        this.name = name;
    }
}