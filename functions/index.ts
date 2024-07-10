import * as functions from 'firebase-functions';
import * as express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './src/app.module';

const expressServer = express();

const createNestServer = async (expressInstance) => {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));
    await app.init();
};

createNestServer(expressServer);

export const api = functions.https.onRequest(expressServer);