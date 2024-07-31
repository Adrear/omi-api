import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { CountriesService } from './countries.service';

@Controller('countries')
export class CountriesController {
    constructor(private readonly countriesService: CountriesService) {}

    @Get()
    async getAllCountries(@Query() query: { lastVisible: string, itemsPerPage: string }) {
        const { lastVisible, itemsPerPage } = query;
        const itemsPerPageNumber = parseInt(itemsPerPage, 10);
        return this.countriesService.getAllCountries({ lastVisible, itemsPerPage: itemsPerPageNumber });
    }

    @Post('add')
    async addServices(@Body() body: { services: any[], source: string }) {
        await this.countriesService.addCountries(body.services, body.source);
        return { message: 'Services added successfully' };
    }

    @Get('update')
    async updateCountries(@Query('source') source: string) {
        return this.countriesService.updateCountries(source);
    }
}