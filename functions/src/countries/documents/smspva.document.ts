export class SmspvaCountryDocument {
    static collectionName = 'smspva-countries';

    id: string;
    text_en: string;

    constructor(id: string, text_en: string) {
        this.id = id;
        this.text_en = text_en;
    }
}
