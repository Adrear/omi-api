import nodemailer, { Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailerService {
    private transporter: Transporter;
    private readonly fromAddress: string;

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('app.smtp_host');
        const port = this.configService.get<number>('app.smtp_port');
        const secure = this.configService.get<boolean>('app.smtp_secure');
        const user = this.configService.get<string>('app.smtp_user');
        const pass = this.configService.get<string>('app.smtp_pass');

        if (!host || !port || !user || !pass) {
            throw new Error('SMTP configuration is missing. Please set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS');
        }

        this.fromAddress = this.configService.get<string>('app.smtp_from') || user;
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
        });
    }

    async sendMail(to: string[], subject: string, text: string, html?: string) {
        return this.transporter.sendMail({
            from: `"Contact Form" <${this.fromAddress}>`,
            to,
            subject,
            text,
            html,
        });
    }
}
