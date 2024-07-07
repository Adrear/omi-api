import { Module } from '@nestjs/common';
import { VerificationsController } from './verifications.controller';
import { RawReadingsService } from './verifications.service';

@Module({
    controllers: [VerificationsController],
    providers: [RawReadingsService],
})
export class VerificationsModule {}