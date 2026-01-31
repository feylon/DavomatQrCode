import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Attendance } from "./entity/Attendance";

@Module({
    imports : [TypeOrmModule.forFeature([Attendance])]
})
export class AttendanceModule {}