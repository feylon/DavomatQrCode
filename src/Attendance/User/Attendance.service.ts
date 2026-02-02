import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QrService } from "src/QR/qr.service";
import { Attendance } from "../entity/Attendance";
import { Between, Repository } from "typeorm";
import { User } from "src/User/entity/user";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AttendanceStatus, GO_WORK_STATUS, Payload_QR_CODE, ROLE } from "types/global.types";
import { GetUserStatsQueryDto } from "./types";
import { dayBounds, periodBounds } from "src/common/utils/date-range";

@Injectable()
export class Attendance_SERVICE {
    constructor(private readonly qrService: QrService,
        @InjectRepository(Attendance) private readonly attendanceRepository: Repository<Attendance>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly config: ConfigService,
        private readonly jwt: JwtService
    ) { }

    // QR kodning amal qilish muddati (soniya), standart: 5 daqiqa
    private get qrTtl(): number {
        return Number(this.config.get<string>('QR_CODE_TTL')) || 300;
    }

    private async generateQr(userId: string, status: GO_WORK_STATUS) {
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
            status
        }
        const ttl = this.qrTtl;
        const token = this.jwt.sign(payload, {secret : this.config.get<string>('QR_CODE_SECRET'), expiresIn : ttl});
        const base64 = await this.qrService.generateBase64(token);

        return {
            qr_code : base64,
            company : user.owner.company,
            status,
            expires_in : ttl,
            expires_at : new Date(Date.now() + ttl * 1000)
        }
    }

    async generateUserQrCodeEnter(userId: string) {
        return this.generateQr(userId, GO_WORK_STATUS.GOING_TO_WORK);
    }

    async generateUserQrCodeOut(userId: string) {
        return this.generateQr(userId, GO_WORK_STATUS.LEFT_FROM_WORK);
    }


    // Bugungi holat va joriy oy bo'yicha qisqa xulosa
    async getToday(userId: string) {
        const { start, end } = dayBounds();
        const today = await this.attendanceRepository.findOne({
            where: { user: { id: userId }, start_time: Between(start, end) },
        });

        let state: string = "NOT_MARKED";
        if (today) {
            if (today.status === AttendanceStatus.PRESENT) state = today.end_time ? "LEFT" : "AT_WORK";
            else state = today.status;
        }

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const month = periodBounds(monthStart, now);

        const rows: { status: AttendanceStatus; count: string; hours: string | null }[] = await this.attendanceRepository
            .createQueryBuilder("a")
            .select("a.status", "status")
            .addSelect("COUNT(*)", "count")
            .addSelect("SUM(a.worked_hours)", "hours")
            .where("a.user_id = :userId", { userId })
            .andWhere("a.start_time BETWEEN :start AND :end", month)
            .groupBy("a.status")
            .getRawMany();

        const count = (s: AttendanceStatus) => Number(rows.find((r) => r.status === s)?.count ?? 0);
        const hours = rows.reduce((acc, r) => acc + Number(r.hours ?? 0), 0);

        return {
            state,
            today: today
                ? { id: today.id, start_time: today.start_time, end_time: today.end_time, worked_hours: today.worked_hours, status: today.status, reason: today.reason }
                : null,
            month: {
                present_days: count(AttendanceStatus.PRESENT),
                absent_days: count(AttendanceStatus.ABSENT),
                excused_days: count(AttendanceStatus.EXCUSED),
                leave_days: count(AttendanceStatus.ON_LEAVE),
                worked_hours: Number(hours.toFixed(2)),
            },
        };
    }


    async getOwnStatistics(userId: string, query: GetUserStatsQueryDto) {
        const { page = 1, limit = 10, startDate, endDate, status } = query;
        const skip = (page - 1) * limit;

        const qb = this.attendanceRepository.createQueryBuilder("attendance");

        qb.where("attendance.user_id = :userId", { userId });

        if (startDate || endDate) {
            const { start, end } = periodBounds(startDate ?? new Date(0), endDate ?? new Date());
            qb.andWhere("attendance.start_time BETWEEN :start AND :end", { start, end });
        }

        if (status) {
            qb.andWhere("attendance.status = :status", { status });
        }

        const { sum } = await qb.clone()
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
