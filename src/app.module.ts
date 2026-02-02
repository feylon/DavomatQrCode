import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {ConfigModule, ConfigService} from "@nestjs/config"
import { configENV } from 'config/configService';
import { userModule } from './User/user.module';
import { AttendanceModule } from './Attendance/Attendance.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/JwtAuthGuard';
import { RolesGuard } from './auth/roles.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [configENV,

  TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        synchronize: false,
        dropSchema: false,
        autoLoadEntities: true,
        // Baza sessiyasi ilova bilan bir xil vaqt mintaqasida ishlashi uchun (timestamp ustunlar tz-siz)
        extra: { options: `-c timezone=${configService.get<string>('TZ') || 'Asia/Tashkent'}` },
        // Migratsiyalar ilova ishga tushganda avtomatik bajariladi (Docker uchun qulay)
        migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
        migrationsRun: configService.get<string>('DB_MIGRATIONS_RUN', 'true') === 'true',
      })}),
 ThrottlerModule.forRoot([
      {
        ttl: 60_000,   // 60s
        limit: 600,     // 60 request / 60s (1 req/sec)
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
  private readonly logger = new Logger(AppModule.name);
  constructor(private readonly configservice  :ConfigService){}
  onModuleInit() {
    if(this.configservice.get<number>("ENV_CHECK")){
      this.logger.log("ENV yuklandi")
    }
    else {
      this.logger.error("Env yuklanmadi")
    }
  }
}
