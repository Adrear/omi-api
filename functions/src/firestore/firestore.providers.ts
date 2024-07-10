import { VerificationDocument } from '../verifications/documents/verification.document';
import {ServiceDocument} from "../services/documents/service.document";
export const FirestoreDatabaseProvider = 'firestoredb';
export const FirestoreOptionsProvider = 'firestoreOptions'
export const FirestoreCollectionProviders: string[] = [
    VerificationDocument.collectionName,
    ServiceDocument.collectionName
];