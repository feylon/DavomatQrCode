import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from "cookie-parser";
import { SwaggerModule } from '@nestjs/swagger';
import { configSwagger } from 'config/swagger';
import helmet from 'helmet';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true
  }));
  app.setGlobalPrefix('api');
  app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'Davomat System');
    next();
  });
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length ? origins : true,
    credentials: true,
  });

  app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      imgSrc: [`'self'`, 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
      scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      manifestSrc: [`'self'`, 'apollo-server-landing-page.cdn.apollographql.com'],
      frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
    },
  },
}));

  const document = SwaggerModule.createDocument(app, configSwagger);

  SwaggerModule.setup("api-docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });



  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Server ishga tushdi: http://localhost:${port}/api  (Swagger: /api-docs)`, 'Bootstrap');
}
bootstrap();
