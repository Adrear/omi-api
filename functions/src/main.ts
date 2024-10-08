import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Configuration } from './config/configuration.interface';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get<ConfigService<Configuration>>(ConfigService);
    const port = configService.get('app').port;
    await app.listen(port);
}
bootstrap();