export class SimsmsCountryDocument {
    static collectionName = 'simsms-countries';

    id: string;
    text_ru: string;

    constructor(id: string, text_ru: string) {
        this.id = id;
        this.text_ru = text_ru;
    }
}
