import { Module } from '@nestjs/common';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';
import {HttpModule} from "@nestjs/axios";

@Module({
    imports: [HttpModule],
    controllers: [CountriesController],
    providers: [CountriesService],
})
export class CountriesModule {}