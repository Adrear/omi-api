export class SmshubServiceDocument {
    static collectionName = 'smshub-services';

    code: string;
    name: string;

    constructor(code: string, name: string) {
        this.code = code;
        this.name = name;
    }
}
