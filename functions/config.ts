import * as functions from 'firebase-functions';
import { VerificationsService } from './src/verifications/verifications.service';
import { AppModule } from './src/app.module';
import { NestFactory } from '@nestjs/core';

const initializeService = async () => {
    const app = await NestFactory.createApplicationContext(AppModule);
    return app.get(VerificationsService);
};

const executeVerifications = async (tasks: Promise<void>[], part: string) => {
    try {
        await Promise.all(tasks.map(task => task.catch(err => console.error(`${part} error: ${err.message}`))));
        console.log(`${part} part of verifications updated successfully.`);
    } catch (error) {
        console.error(`Error initializing service or running ${part} verifications:`, error);
    }
};

const TIMEOUT_SECONDS = 540;
const TIMEZONE = 'UTC';

export const scheduledFunctionFirstPart = functions.region('europe-west1')
    .runWith({ timeoutSeconds: TIMEOUT_SECONDS })
    .pubsub
    .schedule('30 22 * * *')
    .timeZone(TIMEZONE)
    .onRun(async (context) => {
        const verificationsService = await initializeService();
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
    .schedule('45 22 * * *')
    .timeZone(TIMEZONE)
    .onRun(async (context) => {
        const verificationsService = await initializeService();
        await executeVerifications([
            verificationsService.updateVerifications('5sim', '2').then(() => undefined),
            verificationsService.updateVerifications('smshub', '2').then(() => undefined),
        ], 'Second');
    });

export const scheduledFunctionThirdPart = functions.region('europe-west1')
    .runWith({ timeoutSeconds: TIMEOUT_SECONDS })
    .pubsub
    .schedule('0 23 * * *')
    .timeZone(TIMEZONE)
    .onRun(async (context) => {
        const verificationsService = await initializeService();
        await executeVerifications([
            verificationsService.updateVerifications('5sim', '3').then(() => undefined),
            verificationsService.updateVerifications('smshub', '3').then(() => undefined),
        ], 'Third');
    });
//
export const createVerifications = functions.region('europe-west1')
    .runWith({ timeoutSeconds: TIMEOUT_SECONDS })
    .pubsub
    .schedule('0 0 * * *')
    .timeZone(TIMEZONE)
    .onRun(async (context) => {
        const verificationsService = await initializeService();
        await executeVerifications([
            verificationsService.updateVerifications('').then(() => undefined)
        ], 'Final');
    });
