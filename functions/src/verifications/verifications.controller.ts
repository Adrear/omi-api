import {Controller, Get, Query} from '@nestjs/common';
import { VerificationsService } from './verifications.service';

@Controller('verifications')
export class VerificationsController {
    constructor(private readonly verificationsService: VerificationsService) {}

    @Get()
    async getAllVerifications(@Query('source') source: string) {
        return this.verificationsService.getAllVerifications(source);
    }

    @Get('update')
    async updateVerifications(@Query('source') source: string) {
        return await this.verificationsService.updateVerifications(source);
    }
}