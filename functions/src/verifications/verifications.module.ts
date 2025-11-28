import { Module } from '@nestjs/common';
import { VerificationsController } from './verifications.controller';
import { VerificationsService } from './verifications.service';
import { SmshubService } from './byService/smshub.service';
import { FiveSimService } from './byService/5sim.service';
import { SmsActivateService } from './byService/sms-activate.service';
import { SmspvaService } from './byService/smspva.service';
import {HttpModule} from "@nestjs/axios";
import { ApiTokenGuard } from "../common/guards/api-token.guard";

@Module({
    imports: [HttpModule],
    controllers: [VerificationsController],
    providers: [VerificationsService, SmshubService, FiveSimService, SmsActivateService, SmspvaService, ApiTokenGuard],
})
export class VerificationsModule {}
