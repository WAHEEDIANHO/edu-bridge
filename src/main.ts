import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import * as rateLimit  from 'express-rate-limit';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston/dist/winston.constants';
import { AppExceptionFilter } from './app-exception.filter';
import { ResponseFormatterMiddleware } from './utils/response-formatter.middleware';
import * as basicAuth from 'express-basic-auth';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
async function bootstrap() {
 const app = await NestFactory.create<NestExpressApplication>(AppModule);
 
  // Set global prefix for all API routes
  // app.setGlobalPrefix('api');
  
  // Configure static file serving
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/static',
  });
  
  app.enableCors();

  app.use('/api-docs', basicAuth({
    users: { 'admin': process.env.BASIC_AUTH_PASSWORD || 'password' },
    challenge: true,
    realm: 'API Docs',
    unauthorizedResponse: 'Unauthorized access to API documentation',
  }))

  app.use(helmet())
  // app.use(cookieParser());
  // app.use(csurf({ cookie: true }));
  // app.use(rateLimit({ windowMs: 15*60*1000, max: 100 })); // 15 minutes, 100 requests

  app.useGlobalFilters(new AppExceptionFilter(app.get(HttpAdapterHost)));
  app.use(new ResponseFormatterMiddleware().use)
  // app.useGlobalGuards()

  const config = new DocumentBuilder()
    .setTitle("Edu Bridge API")
    .setDescription("API documentation for the Edu Bridge application")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const docuement = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, docuement);

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))

  console.log('Documentation Created successfully.');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
