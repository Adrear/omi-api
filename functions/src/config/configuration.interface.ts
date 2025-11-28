export interface Configuration {
    app: {
        port: number;
        sa_key: string;
        api_key_sms_activate: string;
        api_key_5sim: string;
        api_key_smshub: string;
        api_key_smspva: string;
        recaptcha_secret_key?: string;
        exchange_rates_api_key?: string;
        smtp_host?: string;
        smtp_port?: number;
        smtp_secure?: boolean;
        smtp_user?: string;
        smtp_pass?: string;
        smtp_from?: string;
        admin_api_token?: string;
    };
}
