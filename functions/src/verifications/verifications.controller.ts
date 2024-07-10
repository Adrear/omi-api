import { Controller, Get } from '@nestjs/common';
import { VerificationsService } from './verifications.service';

@Controller('verifications')
export class VerificationsController {
    constructor(private readonly verificationsService: VerificationsService) {}

    @Get()
    async getAllVerifications() {
        return this.verificationsService.findAll();
    }

    @Get('update')
    async updateVerifications(): Promise<void> {
        await this.verificationsService.updateVerifications();
    }
}