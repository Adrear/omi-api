import { registerAs } from '@nestjs/config';
import * as functions from 'firebase-functions';

export default registerAs('app', () => ({
    port: process.env.APP_PORT || functions.config().project.port || 3000,
    sa_key: process.env.SA_KEY || functions.config().project.sa_key,
    api_key_sms_activate: process.env.API_KEY_SMS_ACTIVATE || functions.config().project.api_key_sms_activate,
}));
