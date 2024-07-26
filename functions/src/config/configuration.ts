import { registerAs } from '@nestjs/config';
import * as functions from 'firebase-functions';

export default registerAs('app', () => ({
    port: process.env.APP_PORT || functions.config().project.port || 3000,
    sa_key: process.env.SA_KEY || functions.config().project.sa_key,
    api_key_sms_activate: process.env.API_KEY_SMS_ACTIVATE || functions.config().project.api_key_sms_activate,
    api_key_5sim: process.env.API_KEY_5SIM || functions.config().project.api_key_5sim,
    api_key_smshub: process.env.API_KEY_SMSHUB || functions.config().project.api_key_smshub,
    api_key_smspva: process.env.API_KEY_SMSPVA || functions.config().project.api_key_smspva,
}));
