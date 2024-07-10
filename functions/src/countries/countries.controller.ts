import { Controller, Get, Post, Body } from '@nestjs/common';
import { CountriesService } from './countries.service';

@Controller('countries')
export class CountriesController {
    constructor(private readonly servicesService: CountriesService) {}

    @Get()
    async getAllCountries() {
        return this.servicesService.getAllCountries();
    }

    @Post('add')
    async addServices(@Body() body: { services: any[] }) {
        await this.servicesService.addCountries(body.services);
        return { message: 'Services added successfully' };
    }

    @Get('update')
    async updateCountries() {
        return this.servicesService.updateCountries();
    }
}