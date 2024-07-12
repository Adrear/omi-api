export class SmshubCountryDocument {
    static collectionName = 'smshub-countries';

    id: number;
    name: string;
    key: string;
    operators: [];

    constructor(id: number, name: string, key: string, operators: []) {
        this.id = id;
        this.name = name;
        this.key = key;
        this.operators = operators;
    }
}
