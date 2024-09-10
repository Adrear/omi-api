import {Controller, Get, Post, Body, Param, Query} from '@nestjs/common';
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
    @Post('service/:serviceId/timeline')
    async getVerificationsByServiceForTimeline(
        @Param('serviceId') serviceId: string,
        @Body() body: any
    ) {
        return this.verificationsService.getVerificationsByServiceForTimeline(serviceId, body);
    }
    @Get('country/:countryId')
    async getVerificationsByCountry(@Param('countryId') countryId: string) {
        return this.verificationsService.getLastVerificationsByCountry(countryId);
    }
    @Post('country/:countryId/timeline')
    async getVerificationsByCountryForTimeline(
        @Param('countryId') countryId: string,
        @Body() body: any
    ) {
        return this.verificationsService.getVerificationsByCountryForTimeline(countryId, body);
    }
    // @Get('export/export')
    // async exportVerificationsToCSV() {
    //     return this.verificationsService.exportVerificationsToCSV('2024-09-04');
    // }
    @Get('update')
    async updateVerifications(@Query('source') source: string) {
        return await this.verificationsService.updateVerifications(source);
    }
    @Get('update-country-indexes')
    async updateCountryIndexes(@Query('day') day: string) {
        return await this.verificationsService.updateCountryIndexes(day);
    }
}