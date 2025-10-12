import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { env } from './common/env';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('PipeCore API')
    .setDescription(
      'Integration Connector for Uber Direct, Rappi, Twilio, and more. ' +
      'This API provides a unified interface for multiple delivery and communication services.',
    )
    .setVersion('1.0')
    .addTag('uber', 'Uber Direct delivery integration endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter custom Uber Direct access token (optional)',
        in: 'header',
      },
      'uber-token',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-uber-customer-id',
        in: 'header',
        description: 'Custom Uber Direct Customer ID (optional)',
      },
      'uber-customer-id',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'PipeCore API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = env.port;
  await app.listen(port);

  logger.log(`🚀 PipeCore is running on: http://localhost:${port}`);
  logger.log(`📦 Uber Direct integration is ready at POST /uber/create-delivery`);
  logger.log(`📚 API Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
