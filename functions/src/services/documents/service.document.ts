export class ServiceDocument {
    static collectionName = 'services';

    id: string;
    name: string;
    logo: string;
    category: string;
    id_activate: string;
    name_activate: string;
    id_smshub: string;
    name_smshub: string;
    id_5sim: string;
    name_5sim: string;
    id_simsms: string;
    name_simsms: string;
    id_smspva: string;
    name_smspva: string;

    constructor(
        id: string,
        name: string,
        logo: string,
        category: string,
        id_activate: string,
        name_activate: string,
        id_smshub: string,
        name_smshub: string,
        id_5sim: string,
        name_5sim: string,
        id_simsms: string,
        name_simsms: string,
        id_smspva: string,
        name_smspva: string
    ) {
        this.id = id;
        this.name = name;
        this.logo = logo;
        this.category = category;
        this.id_activate = id_activate;
        this.name_activate = name_activate;
        this.id_smshub = id_smshub;
        this.name_smshub = name_smshub;
        this.id_5sim = id_5sim;
        this.name_5sim = name_5sim;
        this.id_simsms = id_simsms;
        this.name_simsms = name_simsms;
        this.id_smspva = id_smspva;
        this.name_smspva = name_smspva;
    }
}