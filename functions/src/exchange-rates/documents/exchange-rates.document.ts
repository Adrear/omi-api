export class CountryDocument {
    static collectionName = 'countries';

    id: string;
    name: string;
    code: string;
    flag: string;
    region: object;
    region_wb: string;
    id_activate: string;
    id_5sim: string;
    id_smshub: string;
    id_simsms: string;
    id_smspva: string;
    not_used: boolean;

    constructor(
        id: string,
        name: string,
        code: string,
        flag: string,
        region: object,
        region_wb: string,
        id_activate: string,
        id_5sim: string,
        id_smshub: string,
        id_simsms: string,
        id_smspva: string,
        not_used: boolean
    ) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.flag = flag;
        this.region= region;
        this.region_wb = region_wb;
        this.id_activate = id_activate;
        this.id_5sim = id_5sim;
        this.id_smshub = id_smshub;
        this.id_simsms = id_simsms;
        this.id_smspva = id_smspva;
        this.not_used = not_used;
    }
}