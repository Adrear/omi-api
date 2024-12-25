import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ContactController } from './contact.controller';
import { MailerService } from './mailer.service';

@Module({
    imports: [HttpModule],
    controllers: [ContactController],
    providers: [MailerService],
})
export class ContactModule {}