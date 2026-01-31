import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from "cookie-parser";
import { SwaggerModule } from '@nestjs/swagger';
import { configSwagger } from 'config/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist : true,
    transform : true,
    forbidNonWhitelisted : true
  }));
  app.setGlobalPrefix('api');

  const document = SwaggerModule.createDocument(app, configSwagger);

  SwaggerModule.setup("api-docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });



  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
