import { Module } from '@nestjs/common';
import { VerificationsController } from './verifications.controller';
import { VerificationsService } from './verifications.service';
import {HttpModule} from "@nestjs/axios";

@Module({
    imports: [HttpModule],
    controllers: [VerificationsController],
    providers: [VerificationsService],
})
export class VerificationsModule {}