import { ConfigModule } from "@nestjs/config";

export const configENV  = ConfigModule.forRoot({
    envFilePath :".env",
    isGlobal : true,

  })