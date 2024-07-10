import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import {HttpModule} from "@nestjs/axios";

@Module({
    imports: [HttpModule],
    controllers: [ServicesController],
    providers: [ServicesService],
})
export class ServicesModule {}