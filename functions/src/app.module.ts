import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { FirestoreModule } from './firestore/firestore.module';
import { VerificationsModule } from './verifications/verifications.module';
import {ServicesModule} from "./services/services.module";
import {CountriesModule} from "./countries/countries.module";
import { ContactModule } from './nodemailer/contact.module';
import {ExchangeRatesModule } from "./exchange-rates/exchange-rates.module";
import * as path from 'path';
import * as fs from 'fs';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        FirestoreModule.forRoot({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const keyFilename = configService.get<string>('app.sa_key') || '';

                const resolveKeyPath = (): string => {
                    if (!keyFilename) {
                        throw new Error('Service account key path (SA_KEY) is not configured');
                    }
                    const candidates = [
                        keyFilename,
                        path.resolve(process.cwd(), keyFilename),
                        path.resolve(process.cwd(), '..', keyFilename),
                    ];
                    const found = candidates.find(candidate => fs.existsSync(candidate));
                    if (!found) {
                        throw new Error(`Service account key file not found. Tried: ${candidates.join(', ')}`);
                    }
                    return found;
                };

                return {
                    keyFilename: resolveKeyPath(),
                };
            },
            inject: [ConfigService],
        }),
        VerificationsModule,
        ServicesModule,
        CountriesModule,
        ContactModule,
        ExchangeRatesModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
