export class SimsmsServiceDocument {
    static collectionName = 'simsms-services';

    code: string;
    name: string;

    constructor(code: string, name: string) {
        this.code = code;
        this.name = name;
    }
}
