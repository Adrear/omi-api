import { Controller, Post, Body } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { HttpService } from '@nestjs/axios';
import {firstValueFrom} from 'rxjs';

@Controller('contact')
export class ContactController {
    constructor(
        private readonly httpService: HttpService,
        private readonly mailerService: MailerService
    ) {}

    @Post()
    async sendContactForm(
        @Body() body: { name: string; email: string; organisation: string; message: string; recaptcha: string }
    ) {
        const { name, email, organisation, message, recaptcha } = body;

        try {
            // Перевірка reCAPTCHA
            const recaptchaSecret = 'YOUR_SECRET_KEY'; // Ваш секретний ключ reCAPTCHA
            const verificationUrl = `https://www.google.com/recaptcha/api/siteverify`;

            const response = await firstValueFrom(
                this.httpService.post(verificationUrl, null, {
                    params: {
                        secret: recaptchaSecret,
                        response: recaptcha,
                    },
                })
            );

            const { success, score } = response.data;

            if (!success || score < 0.5) {
                return {
                    success: false,
                    message: 'reCAPTCHA verification failed. Please try again.',
                };
            }

            const subject = `New contact form submission from ${name}`;
            const text = `Name: ${name}\nEmail: ${email}\nOrganisation: ${organisation}\nMessage: ${message}`;
            const html = `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Organisation:</strong> ${organisation}</p>
                <p><strong>Message:</strong> ${message}</p>
            `;

            await this.mailerService.sendMail('kirillmanakhov2306@gmail.com', subject, text, html);

            return { success: true, message: 'Message sent successfully!' };
        } catch (error) {
            console.error('Error:', error);
            return { success: false, message: 'Failed to send message. Please try again later.' };
        }
    }
}
