import { VerificationDocument } from '../verifications/documents/verification.document';
import {ServiceDocument} from "../services/documents/service.document";
import {CountryDocument, SmsActivateCountryDocument, FiveSimCountryDocument, SmshubCountryDocument} from "../countries/documents/index.document";
export const FirestoreDatabaseProvider = 'firestoredb';
export const FirestoreOptionsProvider = 'firestoreOptions'
export const FirestoreCollectionProviders: string[] = [
    VerificationDocument.collectionName,
    ServiceDocument.collectionName,
    CountryDocument.collectionName,
    SmsActivateCountryDocument.collectionName,
    FiveSimCountryDocument.collectionName,
    SmshubCountryDocument.collectionName
];