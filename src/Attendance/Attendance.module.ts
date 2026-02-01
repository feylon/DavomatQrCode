import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Attendance } from "./entity/Attendance";
import { AttendanceController_USER } from "./User/Attendance.controller";
import { QrService } from "src/QR/qr.service";
import { Attendance_SERVICE } from "./User/Attendance.service";
import { User } from "src/User/entity/user";
import { JwtModule } from "@nestjs/jwt";
import { AttendanceController_OWNER } from "./Owner/Attendance.controller";
import { Attendance_SERVICE_OWNER } from "./Owner/Attendance.service";

@Module({
    imports : [TypeOrmModule.forFeature([Attendance, User]),
    JwtModule.register({})
],
    controllers:[AttendanceController_USER, AttendanceController_OWNER],
    providers :[QrService, Attendance_SERVICE, Attendance_SERVICE_OWNER

    ]
})
export class AttendanceModule {}