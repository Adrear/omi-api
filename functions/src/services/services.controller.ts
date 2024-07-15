import {Controller, Get, Post, Body, Query} from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) {}

    @Get()
    async getAllServices() {
        return this.servicesService.getAllServices();
    }

    @Post('add')
    async addServices(@Body() body: { services: any[], source: string }) {
        await this.servicesService.addServices(body.services, body.source);
        return { message: 'Services added successfully' };
    }

    @Get('update')
    async updateCountries(@Query('source') source: string) {
        return this.servicesService.updateServices(source);
    }
}