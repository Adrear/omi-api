import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { FirestoreModule } from './firestore/firestore.module';
import { VerificationsModule } from './verifications/verifications.module';
import {ServicesModule} from "./services/services.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        FirestoreModule.forRoot({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                keyFilename: configService.get<string>('SA_KEY'),
            }),
            inject: [ConfigService],
        }),
        VerificationsModule,
        ServicesModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}