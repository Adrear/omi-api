import * as functions from 'firebase-functions';
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

export const api = functions.region('europe-west1').https.onRequest(async (request, response) => {
    await createNestServer(expressServer);
    expressServer(request, response);
});