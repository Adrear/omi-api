import { VerificationDocument, SmsActivateVerificationDocument, FiveSimVerificationDocument, SmshubVerificationDocument, SmspvaVerificationDocument } from '../verifications/documents/index.document';
import {ServiceDocument, SmsActivateServiceDocument, FiveSimServiceDocument, SmshubServiceDocument, SmspvaServiceDocument, SimsmsServiceDocument} from "../services/documents/index.document";
import {CountryDocument, SmsActivateCountryDocument, FiveSimCountryDocument, SmshubCountryDocument, SmspvaCountryDocument, SimsmsCountryDocument} from "../countries/documents/index.document";
export const FirestoreDatabaseProvider = 'firestoredb';
export const FirestoreOptionsProvider = 'firestoreOptions'
export const FirestoreCollectionProviders: string[] = [
    VerificationDocument.collectionName,
    ServiceDocument.collectionName,
    CountryDocument.collectionName,
    SmsActivateVerificationDocument.collectionName,
    SmsActivateServiceDocument.collectionName,
    SmsActivateCountryDocument.collectionName,
    FiveSimVerificationDocument.collectionName,
    FiveSimServiceDocument.collectionName,
    FiveSimCountryDocument.collectionName,
    SmshubVerificationDocument.collectionName,
    SmshubServiceDocument.collectionName,
    SmshubCountryDocument.collectionName,
    SmspvaVerificationDocument.collectionName,
    SmspvaServiceDocument.collectionName,
    SmspvaCountryDocument.collectionName,
    SimsmsCountryDocument.collectionName,
    SimsmsServiceDocument.collectionName
];