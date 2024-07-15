import { VerificationDocument } from '../verifications/documents/verification.document';
import {ServiceDocument, SmsActivateServiceDocument, FiveSimServiceDocument, SmshubServiceDocument} from "../services/documents/index.document";
import {CountryDocument, SmsActivateCountryDocument, FiveSimCountryDocument, SmshubCountryDocument} from "../countries/documents/index.document";
export const FirestoreDatabaseProvider = 'firestoredb';
export const FirestoreOptionsProvider = 'firestoreOptions'
export const FirestoreCollectionProviders: string[] = [
    VerificationDocument.collectionName,
    ServiceDocument.collectionName,
    SmsActivateServiceDocument.collectionName,
    FiveSimServiceDocument.collectionName,
    SmshubServiceDocument.collectionName,
    CountryDocument.collectionName,
    SmsActivateCountryDocument.collectionName,
    FiveSimCountryDocument.collectionName,
    SmshubCountryDocument.collectionName
];