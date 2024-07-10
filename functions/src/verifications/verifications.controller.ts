import { Controller, Get } from '@nestjs/common';
import { RawReadingsService } from './verifications.service';

@Controller('verifications')
export class VerificationsController {
    constructor(private readonly verificationsService: RawReadingsService) {}

    @Get()
    async getAllVerifications() {
        return this.verificationsService.findAll();
    }
}