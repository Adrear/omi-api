import { Module, DynamicModule, Global } from '@nestjs/common';
import * as admin from 'firebase-admin';

interface FirebaseStorageModuleFactoryOptions {
    useFactory: (...args: any[]) => {
        bucketName: string;
        serviceAccount: admin.ServiceAccount;
    };
    inject: any[];
}

@Global()
@Module({})
export class FirebaseStorageModule {
    static forRoot(options: FirebaseStorageModuleFactoryOptions): DynamicModule {
        const optionsProvider = {
            provide: 'FIREBASE_STORAGE_OPTIONS',
            useFactory: options.useFactory,
            inject: options.inject,
        };

        const adminProvider = {
            provide: 'FIREBASE_ADMIN',
            useFactory: (storageOptions: { bucketName: string; serviceAccount: admin.ServiceAccount }) => {
                if (!admin.apps.length) {
                    admin.initializeApp({
                        credential: admin.credential.cert(storageOptions.serviceAccount),
                        storageBucket: storageOptions.bucketName,
                    });
                }
                return admin;
            },
            inject: ['FIREBASE_STORAGE_OPTIONS'],
        };

        const storageProvider = {
            provide: 'FIREBASE_STORAGE',
            useFactory: (adminApp: typeof admin) => adminApp.storage().bucket(),
            inject: ['FIREBASE_ADMIN'],
        };

        return {
            module: FirebaseStorageModule,
            providers: [optionsProvider, adminProvider, storageProvider],
            exports: [storageProvider],
        };
    }
}
