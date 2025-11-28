import { registerAs } from '@nestjs/config';
import * as functions from 'firebase-functions';

export default registerAs('app', () => ({
    port: process.env.APP_PORT || functions.config().project.port || 3000,
    sa_key: process.env.SA_KEY || functions.config().project.sa_key,
    api_key_sms_activate: process.env.API_KEY_SMS_ACTIVATE || functions.config().project.api_key_sms_activate,
    api_key_5sim: process.env.API_KEY_5SIM || functions.config().project.api_key_5sim,
    api_key_smshub: process.env.API_KEY_SMSHUB || functions.config().project.api_key_smshub,
    api_key_smspva: process.env.API_KEY_SMSPVA || functions.config().project.api_key_smspva,
    recaptcha_secret_key: process.env.RECAPTCHA_SECRET_KEY || functions.config().project.recaptcha_secret_key,
    exchange_rates_api_key: process.env.EXCHANGE_RATES_API_KEY || functions.config().project.exchange_rates_api_key,
    smtp_host: process.env.SMTP_HOST || functions.config().project.smtp_host,
    smtp_port: Number(process.env.SMTP_PORT || functions.config().project.smtp_port || 465),
    smtp_secure: (process.env.SMTP_SECURE || functions.config().project.smtp_secure || 'true') === 'true',
    smtp_user: process.env.SMTP_USER || functions.config().project.smtp_user,
    smtp_pass: process.env.SMTP_PASS || functions.config().project.smtp_pass,
    smtp_from: process.env.SMTP_FROM || functions.config().project.smtp_from || 'contact@cotsi.org'
}));
