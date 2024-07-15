export class FiveSimServiceDocument {
    static collectionName = '5sim-services';

    code: string;
    name: string;

    constructor(code: string, name: string) {
        this.code = code;
        this.name = name;
    }
}
