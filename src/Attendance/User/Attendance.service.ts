import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QrService } from "src/QR/qr.service";
import { Attendance } from "../entity/Attendance";
import { Repository } from "typeorm";
import { User } from "src/User/entity/user";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { GO_WORK_STATUS, Payload_QR_CODE, ROLE } from "types/global.types";
import { GetUserStatsQueryDto } from "./types";

@Injectable()
export class Attendance_SERVICE {
    constructor(private readonly qrService: QrService,
        @InjectRepository(Attendance) private readonly attendanceRepository: Repository<Attendance>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly config: ConfigService,
        private readonly jwt: JwtService
    ) { }

    async generateUserQrCodeEnter(userId: string) {

        const QR_CODE_SECRET = this.config.get<string>('QR_CODE_SECRET');


        const user = await this.userRepository.findOne({
            where: {
                id: userId,
                isBlock: false,
                role: ROLE.USER,
            },
            select: {
                id: true,
                owner: {
                    id: true,
                    company: true
                },
                role: true,
            },
            relations : {
                owner : true
            }
        }); 
        if(!user){
        throw new NotFoundException("Foydalanuvchi topilmadi yoki bloklangan");
        }

        if(!user.owner){
            throw new NotFoundException("Foydalanuvchi owneri topilmadi");
        }

        const payload : Payload_QR_CODE = {
            owner_id : user.owner.id,
            user_id : user.id,
            status : GO_WORK_STATUS.GOING_TO_WORK
        }
        const token = this.jwt.sign(payload, {secret : QR_CODE_SECRET, expiresIn : '1h'});
        const base64 = await this.qrService.generateBase64(token);
        return {
            qr_code : base64,
            company : user.owner.company,
            status : GO_WORK_STATUS.GOING_TO_WORK

        }

    }



      async generateUserQrCodeOut(userId: string) {
        const user = await this.userRepository.findOne({
            where: {
                id: userId,
                isBlock: false,
                role: ROLE.USER,
            },
            select: {
                id: true,
                owner: {
                    id: true,
                    company: true
                },
                role: true,
            },
            relations : {
                owner : true
            }
        }); 
        if(!user){
        throw new NotFoundException("Foydalanuvchi topilmadi yoki bloklangan");
        }

        if(!user.owner){
            throw new NotFoundException("Foydalanuvchi owneri topilmadi");
        }

        const payload : Payload_QR_CODE = {
            owner_id : user.owner.id,
            user_id : user.id,
            status : GO_WORK_STATUS.LEFT_FROM_WORK
        }
        const QR_CODE_SECRET = this.config.get<string>('QR_CODE_SECRET');

        const token = this.jwt.sign(payload, {secret : QR_CODE_SECRET, expiresIn : '1h'});
        const base64 = await this.qrService.generateBase64(token);


        return {
            qr_code : base64,
            company : user.owner.company,
            status : GO_WORK_STATUS.LEFT_FROM_WORK

        }

    }


    async getOwnStatistics(userId: string, query: GetUserStatsQueryDto) {
        const { page = 1, limit = 10, startDate, endDate, status } = query;
        const skip = (page - 1) * limit;

        const qb = this.attendanceRepository.createQueryBuilder("attendance");

        qb.where("attendance.user_id = :userId", { userId });

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            qb.andWhere("attendance.start_time BETWEEN :start AND :end", { start, end });
        }

        if (status) {
            qb.andWhere("attendance.status = :status", { status });
        }

        const totalHoursQuery = qb.clone();
        const { sum } = await totalHoursQuery
            .select("SUM(attendance.worked_hours)", "sum")
            .getRawOne();
        
        const totalWorkedHours = sum ? parseFloat(sum) : 0;

        qb.orderBy("attendance.start_time", "DESC"); 
        qb.skip(skip).take(limit);

        
        const [data, total] = await qb.getManyAndCount();

        return {
            meta: {
                page,
                limit,
                total_records: total,
                total_pages: Math.ceil(total / limit),
                total_worked_hours: Number(totalWorkedHours.toFixed(2)) // User uchun jami ishlagan vaqti
            },
            data: data.map(item => ({
                id: item.id,
                date: item.date,
                start_time: item.start_time,
                end_time: item.end_time,
                worked_hours: item.worked_hours,
                status: item.status,
                reason: item.reason }))
        };
    }
}