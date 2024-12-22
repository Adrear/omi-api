import nodemailer from 'nodemailer';

export class MailerService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'mail.privateemail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'contact@cotsi.org',
                pass: ',zU(Q0b(?$i04yWUsK4uLo*',
            },
        });
    }

    async sendMail(to: string, subject: string, text: string, html?: string) {
        return await this.transporter.sendMail({
            from: '"Contact Form" <contact@cotsi.org>',
            to,
            subject,
            text,
            html,
        });
    }
}