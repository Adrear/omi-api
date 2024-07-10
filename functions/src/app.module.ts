import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { FirestoreModule } from './firestore/firestore.module';
import { VerificationsModule } from './verifications/verifications.module';
import {ServicesModule} from "./services/services.module";
import {CountriesModule} from "./countries/countries.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        FirestoreModule.forRoot({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                keyFilename: configService.get('app.sa_key'),
            }),
            inject: [ConfigService],
        }),
        VerificationsModule,
        ServicesModule,
        CountriesModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}