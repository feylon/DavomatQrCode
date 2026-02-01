import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {ConfigModule, ConfigService} from "@nestjs/config"
import { TypeOrmConfig } from 'config/database.typeorm';
import { configENV } from 'config/configService';
import { userModule } from './User/user.module';
import { AttendanceModule } from './Attendance/Attendance.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/JwtAuthGuard';
import { RolesGuard } from './auth/roles.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [configENV,

  TypeOrmConfig,
 ThrottlerModule.forRoot([
      {
        ttl: 60_000,   // 60s
        limit: 60,     // 60 request / 60s (1 req/sec)
      },
    ]),


  // Modulllar 
  userModule,
  AttendanceModule,
  AuthModule
],
  controllers: [AppController],
  providers: [AppService,
      {
      provide: APP_GUARD,
      
      useClass: JwtAuthGuard,
    },
      { provide: APP_GUARD, useClass: RolesGuard },
      {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },    

  ],
})
export class AppModule implements OnModuleInit{
  constructor(private readonly configservice  :ConfigService){}
  onModuleInit() {
    if(this.configservice.get<number>("ENV_CHECK")){
      console.log("ENV yuklandi")
    }
    else {
      console.error("Env yuklanmadi")
    }
  }
}
