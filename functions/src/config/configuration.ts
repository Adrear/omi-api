import { registerAs } from '@nestjs/config';
import * as functions from 'firebase-functions';

export default registerAs('app', () => {
    const projectConfig = (functions.config() as Record<string, any>)?.project || {};

    return {
        port: process.env.APP_PORT || projectConfig.port || 3000,
        sa_key: process.env.SA_KEY || projectConfig.sa_key,
        api_key_sms_activate: process.env.API_KEY_SMS_ACTIVATE || projectConfig.api_key_sms_activate,
        api_key_5sim: process.env.API_KEY_5SIM || projectConfig.api_key_5sim,
        api_key_smshub: process.env.API_KEY_SMSHUB || projectConfig.api_key_smshub,
        api_key_smspva: process.env.API_KEY_SMSPVA || projectConfig.api_key_smspva,
        recaptcha_secret_key: process.env.RECAPTCHA_SECRET_KEY || projectConfig.recaptcha_secret_key,
        exchange_rates_api_key: process.env.EXCHANGE_RATES_API_KEY || projectConfig.exchange_rates_api_key,
        smtp_host: process.env.SMTP_HOST || projectConfig.smtp_host,
        smtp_port: Number(process.env.SMTP_PORT || projectConfig.smtp_port || 465),
        smtp_secure: (process.env.SMTP_SECURE || projectConfig.smtp_secure || 'true') === 'true',
        smtp_user: process.env.SMTP_USER || projectConfig.smtp_user,
        smtp_pass: process.env.SMTP_PASS || projectConfig.smtp_pass,
        smtp_from: process.env.SMTP_FROM || projectConfig.smtp_from || 'contact@cotsi.org',
        admin_api_token: process.env.ADMIN_API_TOKEN || projectConfig.admin_api_token,
        alert_emails: (process.env.ALERT_EMAILS || projectConfig.alert_emails || '')
            .split(',')
            .map((email: string) => email.trim())
            .filter(Boolean)
    };
});
