import { Controller, Post, Body } from '@nestjs/common';
import { MailerService } from './mailer.service';

@Controller('contact')
export class ContactController {
    constructor(private readonly mailerService: MailerService) {}

    @Post()
    async sendContactForm(@Body() body: { name: string; email: string; message: string }) {
        const { name, email, message } = body;

        try {
            const subject = `New Contact Form Submission from ${name}`;
            const text = `Name: ${name}\nEmail: ${email}\nMessage: ${message}`;
            const html = `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong> ${message}</p>
            `;

            await this.mailerService.sendMail('your-receiving-email@exnodeample.com', subject, text, html);

            return { success: true, message: 'Message sent successfully!' };
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, message: 'Failed to send message. Please try again later.' };
        }
    }
}
