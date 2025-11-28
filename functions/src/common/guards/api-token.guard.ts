import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiTokenGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const header = (request.headers['authorization'] as string | undefined) || '';
        const tokenFromHeader = header.startsWith('Bearer ') ? header.slice(7) : header;
        const configuredToken = this.configService.get<string>('app.admin_api_token');

        if (!configuredToken) {
            throw new UnauthorizedException('Admin API token is not configured');
        }

        if (tokenFromHeader && tokenFromHeader === configuredToken) {
            return true;
        }

        throw new UnauthorizedException('Invalid or missing admin API token');
    }
}
