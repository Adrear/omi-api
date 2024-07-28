import * as functions from 'firebase-functions';
import { VerificationsService } from './src/verifications/verifications.service';
import { AppModule } from './src/app.module';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// Створіть екземпляр Express
const expressServer = express();

const createNestServer = async (expressInstance: express.Application) => {
    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressInstance)
    );
    app.enableCors();
    await app.init();
};

// Ініціалізуйте сервіс один раз
let verificationsService: VerificationsService;

const initializeService = async () => {
    if (!verificationsService) {
        const app = await NestFactory.createApplicationContext(AppModule);
        verificationsService = app.get(VerificationsService);
    }
};

const executeVerifications = async (tasks: Promise<void>[], part: string) => {
    try {
        await initializeService();
        await Promise.all(tasks.map(task => task.catch(err => console.error(`${part} error: ${err.message}`))));
        console.log(`${part} part of verifications updated successfully.`);
    } catch (error) {
        console.error(`Error initializing service or running ${part} verifications:`, error);
    }
};

export const api = functions.https.onRequest(async (request, response) => {
    await createNestServer(expressServer);
    expressServer(request, response);
});

// Константи для налаштувань
const TIMEOUT_SECONDS = 540;
const TIMEZONE = 'Europe/Kyiv';

export const scheduledFunctionFirstPart = functions
    .runWith({ timeoutSeconds: TIMEOUT_SECONDS })
    .pubsub
    .schedule('0 22 * * *')
    .timeZone(TIMEZONE)
    .onRun(async (context) => {
        await executeVerifications([
            verificationsService.updateVerifications('sms-activate').then(() => undefined),
            verificationsService.updateVerifications('5sim', '1').then(() => undefined),
            verificationsService.updateVerifications('smshub', '1').then(() => undefined),
            verificationsService.updateVerifications('smspva').then(() => undefined)
        ], 'First');
    });

export const scheduledFunctionSecondPart = functions
    .runWith({ timeoutSeconds: TIMEOUT_SECONDS })
    .pubsub
    .schedule('15 22 * * *')
    .timeZone(TIMEZONE)
    .onRun(async (context) => {
        await executeVerifications([
            verificationsService.updateVerifications('5sim', '2').then(() => undefined),
            verificationsService.updateVerifications('smshub', '2').then(() => undefined),
        ], 'Second');
    });

export const scheduledFunctionThirdPart = functions
    .runWith({ timeoutSeconds: TIMEOUT_SECONDS })
    .pubsub
    .schedule('30 22 * * *')
    .timeZone(TIMEZONE)
    .onRun(async (context) => {
        await executeVerifications([
            verificationsService.updateVerifications('5sim', '3').then(() => undefined),
            verificationsService.updateVerifications('smshub', '3').then(() => undefined),
        ], 'Third');
    });
