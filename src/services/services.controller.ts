import { Controller, Get, Post, Body } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) {}

    @Get()
    async getAllServices() {
        return this.servicesService.getAllServices();
    }

    @Post('add')
    async addServices(@Body() body: { services: any[] }) {
        await this.servicesService.addServices(body.services);
        return { message: 'Services added successfully' };
    }
}