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
      'This API provides a unified interface for multiple delivery and communication services.\n\n' +
      '**Nota:** Las descripciones detalladas de cada campo (tipo, formato, validaciones, ejemplos) ' +
      'se muestran en la pestaña "Schema" de cada endpoint. Expande el Schema para ver la documentación completa.',
    )
    .setVersion('1.0')
    .addTag('uber', 'Uber Direct delivery integration endpoints')
    .addTag('Internal API - Tenants', 'Endpoints internos para gestión de tenants')
    .addTag('Internal API - Monitoring', 'Endpoints internos para monitoreo del sistema')
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
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        name: 'Authorization',
        description: 'Enter SERVICE_ROLE_SECRET for internal API endpoints. Required for /internal/* endpoints.',
        in: 'header',
      },
      'service-role-secret',
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

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Error starting application', error);
  process.exit(1);
});
