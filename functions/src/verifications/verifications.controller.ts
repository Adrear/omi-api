import {Controller, Get, Post, Body, Param, Query, UseGuards} from '@nestjs/common';
import { VerificationsService } from './verifications.service';
import { ApiTokenGuard } from '../common/guards/api-token.guard';

@Controller('verifications')
export class VerificationsController {
    constructor(private readonly verificationsService: VerificationsService) {}

    @Get()
    async getAllVerifications(@Query() query: { source?: string, date?: string }) {
        return this.verificationsService.getAllVerifications(query);
    }
    @Post('service/:serviceId/timeline')
    async getVerificationsByServiceForTimeline(
        @Param('serviceId') serviceId: string,
        @Body() body: any
    ) {
        return this.verificationsService.getVerificationsByServiceForTimeline(serviceId, body);
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
    @UseGuards(ApiTokenGuard)
    @Get('update')
    async updateVerifications(@Query('source') source: string) {
        return await this.verificationsService.updateVerifications(source);
    }

    @UseGuards(ApiTokenGuard)
    @Get('create-verifications-by-country')
    async createVerificationsByCountriesForMonth() {
        const months = ['2025-10', '2025-11'];
        for (const month of months) {
            await this.verificationsService.createVerificationsByCountriesForMonth(month);
        }
        return { message: 'There created new collection' };
    }

    // @Get('create-verifications-by-services')
    // async createVerificationsByServicesForMonth() {
    //     const months = ['2024-12', '2025-01', '2025-02', '2024-09'];
    //     for (const month of months) {
    //         await this.verificationsService.createVerificationsForAllServices(month);
    //     }
    //     return { message: 'There created new collection' };
    // }

    @UseGuards(ApiTokenGuard)
    @Get('export-verifications-by-services')
    async exportVerificationsByServicesForMonth() {
        const months = ['2025-06'];
        for (const month of months) {
            await this.verificationsService.exportVerificationsForAllServicesToCSV(month);
        }
        return { message: 'There created new collection' };
    }

    // @Get('update-country-indexes')
    // async updateCountryIndexes(@Query('day') day: string) {
    //     return await this.verificationsService.updateCountryIndexes(day);
    // }
}
