export class FiveSimCountryDocument {
    static collectionName = '5sim-countries';

    id: string;
    iso: string;
    prefix: string;
    text_en: string;
    text_ru: string;

    constructor(id: string, iso: string, prefix: string, text_en: string, text_ru: string) {
        this.id = id;
        this.iso = iso;
        this.prefix = prefix;
        this.text_en = text_en;
        this.text_ru = text_ru;
    }
}
