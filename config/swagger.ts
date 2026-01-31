import { DocumentBuilder } from "@nestjs/swagger";


export  const configSwagger = new DocumentBuilder()
    .setTitle("API")
    .setDescription("Backend API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
