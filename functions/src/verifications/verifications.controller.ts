import {Controller, Get, Param, Query} from '@nestjs/common';
import { VerificationsService } from './verifications.service';

@Controller('verifications')
export class VerificationsController {
    constructor(private readonly verificationsService: VerificationsService) {}

    @Get()
    async getAllVerifications(@Query() query: { source?: string, date?: string }) {
        return this.verificationsService.getAllVerifications(query);
    }
    @Get('service/:serviceId')
    async getVerificationsByService(@Param('serviceId') serviceId: string) {
        return this.verificationsService.getLastVerificationsByService(serviceId);
    }
    @Get('country/:countryId')
    async getVerificationsByCountry(@Param('countryId') countryId: string) {
        return this.verificationsService.getLastVerificationsByCountry(countryId);
    }
    @Get('update')
    async updateVerifications(@Query('source') source: string) {
        return await this.verificationsService.updateVerifications(source);
    }
}