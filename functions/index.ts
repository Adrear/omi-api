import * as functions from 'firebase-functions';
import { VerificationsService } from './src/verifications/verifications.service';
import { AppModule } from './src/app.module';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const expressServer = express();
const createNestServer = async (expressInstance: express.Application) => {
    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressInstance)
    );
    app.enableCors();
    await app.init();
};
let verificationsService: VerificationsService;
const initializeService = async () => {
    if (!verificationsService) {
        const app = await NestFactory.createApplicationContext(AppModule);
        verificationsService = app.get(VerificationsService);
    }
};
const executeVerifications = async (tasks: Promise<void>[], part: string) => {
    try {
        await Promise.all(tasks.map(task => task.catch(err => console.error(`${part} error: ${err.message}`))));
        console.log(`${part} part of verifications updated successfully.`);
    } catch (error) {
        console.error(`Error initializing service or running ${part} verifications:`, error);
    }
};
export const api = functions.region('europe-west1').https.onRequest(async (request, response) => {
    await createNestServer(expressServer);
    expressServer(request, response);
});
const TIMEOUT_SECONDS = 540;
const TIMEZONE = 'Europe/Kyiv';

export const scheduledFunctionFirstPart = functions.region('europe-west1')
    .runWith({ timeoutSeconds: TIMEOUT_SECONDS })
    .pubsub
    .schedule('0 21 * * *')
    .timeZone(TIMEZONE)
    .onRun(async (context) => {
        await initializeService();
        await executeVerifications([
            verificationsService.updateVerifications('sms-activate').then(() => undefined),
            verificationsService.updateVerifications('5sim', '1').then(() => undefined),
            verificationsService.updateVerifications('smshub', '1').then(() => undefined),
            verificationsService.updateVerifications('smspva').then(() => undefined)
        ], 'First');
    });

export const scheduledFunctionSecondPart = functions.region('europe-west1')
    .runWith({ timeoutSeconds: TIMEOUT_SECONDS })
    .pubsub
    .schedule('15 21 * * *')
    .timeZone(TIMEZONE)
    .onRun(async (context) => {
        await initializeService();
        await executeVerifications([
            verificationsService.updateVerifications('5sim', '2').then(() => undefined),
            verificationsService.updateVerifications('smshub', '2').then(() => undefined),
        ], 'Second');
    });

export const scheduledFunctionThirdPart = functions.region('europe-west1')
    .runWith({ timeoutSeconds: TIMEOUT_SECONDS })
    .pubsub
    .schedule('30 21 * * *')
    .timeZone(TIMEZONE)
    .onRun(async (context) => {
        await initializeService();
        await executeVerifications([
            verificationsService.updateVerifications('5sim', '3').then(() => undefined),
            verificationsService.updateVerifications('smshub', '3').then(() => undefined),
        ], 'Third');
    });
