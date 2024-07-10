export class CountryDocument {
    static collectionName = 'countries';

    id: number;
    rus: string;
    eng: string;
    chn: string;
    visible: number;
    retry: number;
    rent: number;
    multiService: number;

    constructor(id: number, rus: string, eng: string, chn: string, visible: number, retry: number, rent: number, multiService: number) {
        this.id = id;
        this.rus = rus;
        this.eng = eng;
        this.chn = chn;
        this.visible = visible;
        this.retry = retry;
        this.rent = rent;
        this.multiService = multiService;
    }
}