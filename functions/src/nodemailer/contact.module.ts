import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { MailerService } from './mailer.service';

@Module({
    controllers: [ContactController],
    providers: [MailerService],
})
export class ContactModule {}