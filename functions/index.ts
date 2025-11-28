import * as functions from 'firebase-functions';
import { VerificationsService } from './src/verifications/verifications.service';
import { AppModule } from './src/app.module';
import { NestFactory } from '@nestjs/core';
import { TIMEOUT_SECONDS, TIMEZONE, CRON_SCHEDULES, REGION } from './config';

const initializeService = async () => {
    const app = await NestFactory.createApplicationContext(AppModule);
    return app.get(VerificationsService);
};

const executeVerifications = async (tasks: Promise<unknown>[], part: string) => {
    try {
        await Promise.all(tasks.map(task => task.catch(err => console.error(`${part} error: ${err.message}`))));
        console.log(`${part} part of verifications updated successfully.`);
    } catch (error) {
        console.error(`Error initializing service or running ${part} verifications:`, error);
    }
};

export const scheduledFunctionFirstPart = functions.region(REGION)
    .runWith({ timeoutSeconds: TIMEOUT_SECONDS })
    .pubsub
    .schedule(CRON_SCHEDULES.firstPart)
    .timeZone(TIMEZONE)
    .onRun(async (context) => {
        const verificationsService = await initializeService();
        await executeVerifications([
            verificationsService.updateVerifications('sms-activate'),
            verificationsService.updateVerifications('5sim', '1'),
            verificationsService.updateVerifications('smshub', '1'),
            verificationsService.updateVerifications('smspva')
        ], 'First');
    });

export const scheduledFunctionSecondPart = functions.region(REGION)
    .runWith({ timeoutSeconds: TIMEOUT_SECONDS })
    .pubsub
    .schedule(CRON_SCHEDULES.secondPart)
    .timeZone(TIMEZONE)
    .onRun(async (context) => {
        const verificationsService = await initializeService();
        await executeVerifications([
            verificationsService.updateVerifications('5sim', '2'),
            verificationsService.updateVerifications('smshub', '2')
        ], 'Second');
    });

export const scheduledFunctionThirdPart = functions.region(REGION)
    .runWith({ timeoutSeconds: TIMEOUT_SECONDS })
    .pubsub
    .schedule(CRON_SCHEDULES.thirdPart)
    .timeZone(TIMEZONE)
    .onRun(async (context) => {
        const verificationsService = await initializeService();
        await executeVerifications([
            verificationsService.updateVerifications('5sim', '3'),
            verificationsService.updateVerifications('smshub', '3')
        ], 'Third');
    });

export const createVerifications = functions.region(REGION)
    .runWith({ timeoutSeconds: TIMEOUT_SECONDS })
    .pubsub
    .schedule(CRON_SCHEDULES.finalPart)
    .timeZone(TIMEZONE)
    .onRun(async (context) => {
        const verificationsService = await initializeService();
        await executeVerifications([
            verificationsService.updateVerifications('')
        ], 'Final');
    });
