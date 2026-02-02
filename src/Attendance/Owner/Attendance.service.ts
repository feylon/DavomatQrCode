import { Injectable, NotFoundException, ConflictException, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/User/entity/user";
import { Repository, Between, IsNull, Brackets } from "typeorm";
import { Attendance } from "../entity/Attendance";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { GetAttendanceStatsQueryDto, MarkAbsenceDto, QrCodeDto } from "./type";
import { AttendanceStatus, GO_WORK_STATUS, Payload_QR_CODE, ROLE } from "types/global.types";
import { decodeQRFromBuffer } from "config/decodeQRFromBuffer";
import { dayBounds, periodBounds } from "src/common/utils/date-range";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
    [AttendanceStatus.PRESENT]: "Ishda",
    [AttendanceStatus.ABSENT]: "Sababsiz kelmagan",
    [AttendanceStatus.EXCUSED]: "Sababli",
    [AttendanceStatus.ON_LEAVE]: "Ta'tilda",
};

@Injectable()
export class Attendance_SERVICE_OWNER {
    constructor(
        @InjectRepository(Attendance) private readonly attendanceRepository: Repository<Attendance>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly config: ConfigService,
        private readonly jwtService: JwtService
    ) { }

    async generateQrCodeEnter(userId: string, body: QrCodeDto) {
        const { owner_id, status, user_id } = body;

        const user = await this.userRepository.findOne({
            where: { id: user_id, isBlock: false, role: ROLE.USER }
        });
        if (!user) throw new NotFoundException("User mavjud emas");

        if (owner_id !== userId) {
            throw new NotFoundException("Egalik mos emas");
        }

        if (status != GO_WORK_STATUS.GOING_TO_WORK) {
            throw new BadRequestException("Bu QR kod ishga kelish uchun emas");
        }

        const { start, end } = dayBounds();

        const existingAttendance = await this.attendanceRepository.findOne({
            where: {
                user: { id: user_id },
                start_time: Between(start, end),
            }
        });

        if (existingAttendance) {
            if (existingAttendance.status !== AttendanceStatus.PRESENT) {
                throw new ConflictException(`Xodim bugun "${STATUS_LABELS[existingAttendance.status]}" deb belgilangan`);
            }
            throw new ConflictException("Foydalanuvchi bugun allaqachon ishga kelgan!");
        }

        const now = new Date();
        const attendance = this.attendanceRepository.create({
            user: user,
            status: AttendanceStatus.PRESENT,
            start_time: now,
            date: now,
            worked_hours: 0
        });

        const saved = await this.attendanceRepository.save(attendance);
        return this.toResponse(saved, user, GO_WORK_STATUS.GOING_TO_WORK);
    }


    async generateQrCodeLeave(userId: string, body: QrCodeDto) {
        const { owner_id, status, user_id } = body;

        const user = await this.userRepository.findOne({
            where: { id: user_id, isBlock: false, role: ROLE.USER },
        });
        if (!user) throw new NotFoundException("User mavjud emas");

        if (owner_id !== userId) {
            throw new NotFoundException("Egalik mos emas");
        }

        if (status !== GO_WORK_STATUS.LEFT_FROM_WORK) {
            throw new BadRequestException("Bu QR kod ishdan ketish uchun emas");
        }

        const { start, end } = dayBounds();

        const attendance = await this.attendanceRepository.findOne({
            where: {
                user: { id: user_id },
                start_time: Between(start, end),
            },
        });

        if (!attendance) {
            throw new NotFoundException("Foydalanuvchi bugun ishga kelmagan!");
        }

        if (attendance.status !== AttendanceStatus.PRESENT) {
            throw new ConflictException(`Xodim bugun "${STATUS_LABELS[attendance.status]}" deb belgilangan`);
        }

        if (attendance.end_time) {
            throw new ConflictException("Foydalanuvchi bugun allaqachon ishdan ketgan!");
        }

        const now = new Date();
        const diffMs = now.getTime() - new Date(attendance.start_time).getTime();

        if (diffMs < 0) {
            throw new ConflictException("Vaqt xatosi: ketish vaqti kelishdan oldin bo‘lolmaydi");
        }

        attendance.end_time = now;
        attendance.worked_hours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

        const saved = await this.attendanceRepository.save(attendance);
        return this.toResponse(saved, user, GO_WORK_STATUS.LEFT_FROM_WORK);
    }


    async getEmployeesCurrentlyAtWork(ownerId: string) {
        const { start, end } = dayBounds();

        return this.attendanceRepository.find({
            where: {
                start_time: Between(start, end),
                end_time: IsNull(),
                status: AttendanceStatus.PRESENT,
                user: {
                    owner: {
                        id: ownerId
                    }
                }
            },
            relations: ["user"],
            select: {
                id: true,
                start_time: true,
                status: true,
                user: {
                    id: true,
                    firstname: true,
                    lastname: true,
                    login: true,
                }
            },
            order: { start_time: "ASC" },
        });
    }


    // Bugungi holat: har bir xodim va uning bugungi davomati
    async getTodayOverview(ownerId: string) {
        const { start, end } = dayBounds();

        const employees = await this.userRepository.find({
            where: { owner: { id: ownerId }, role: ROLE.USER, isBlock: false },
            select: ["id", "firstname", "lastname", "middlname", "login"],
            order: { lastname: "ASC", firstname: "ASC" },
        });

        const records = await this.attendanceRepository.find({
            where: {
                start_time: Between(start, end),
                user: { owner: { id: ownerId } },
            },
            relations: ["user"],
            select: { id: true, start_time: true, end_time: true, worked_hours: true, status: true, reason: true, user: { id: true } },
        });
        const byUser = new Map(records.map((r) => [r.user.id, r]));

        const summary = {
            total_employees: employees.length,
            at_work: 0,
            left: 0,
            absent: 0,
            excused: 0,
            on_leave: 0,
            not_marked: 0,
        };

        const list = employees.map((emp) => {
            const rec = byUser.get(emp.id);
            let state: string = "NOT_MARKED";
            if (!rec) summary.not_marked++;
            else if (rec.status === AttendanceStatus.PRESENT) {
                if (rec.end_time) { state = "LEFT"; summary.left++; }
                else { state = "AT_WORK"; summary.at_work++; }
            } else {
                state = rec.status;
                if (rec.status === AttendanceStatus.ABSENT) summary.absent++;
                if (rec.status === AttendanceStatus.EXCUSED) summary.excused++;
                if (rec.status === AttendanceStatus.ON_LEAVE) summary.on_leave++;
            }
            return {
                user: emp,
                state,
                attendance: rec
                    ? { id: rec.id, start_time: rec.start_time, end_time: rec.end_time, worked_hours: rec.worked_hours, status: rec.status, reason: rec.reason }
                    : null,
            };
        });

        return { date: start, summary, employees: list };
    }


    async markUserAbsence(ownerId: string, body: MarkAbsenceDto) {
        const { user_id, status, reason } = body;

        if (status === AttendanceStatus.PRESENT) {
            throw new ConflictException("Bu endpoint orqali xodimni 'PRESENT' (Ishda) deb belgilay olmaysiz. QR kod ishlating.");
        }

        const user = await this.userRepository.findOne({
            where: { id: user_id, role: ROLE.USER },
            relations: ["owner"]
        });

        if (!user) throw new NotFoundException("Xodim topilmadi");

        if (!user.owner || user.owner.id !== ownerId) {
            throw new NotFoundException("Siz faqat o'z xodimlaringizni boshqara olasiz");
        }

        const { start, end } = dayBounds();

        const existingAttendance = await this.attendanceRepository.findOne({
            where: {
                user: { id: user_id },
                start_time: Between(start, end),
            }
        });

        if (existingAttendance) {
            throw new ConflictException(`Bu xodim uchun bugun allaqachon status belgilangan: ${STATUS_LABELS[existingAttendance.status]}`);
        }

        const now = new Date();
        const attendance = this.attendanceRepository.create({
            user: user,
            status: status,
            reason: reason,
            start_time: now,
            end_time: now,
            worked_hours: 0,
            date: now
        });

        const saved = await this.attendanceRepository.save(attendance);
        return this.toResponse(saved, user);
    }


    // Faqat bugun belgilangan sababli/sababsiz yozuvni bekor qilish
    async cancelAbsence(ownerId: string, attendanceId: string) {
        const record = await this.attendanceRepository.findOne({
            where: { id: attendanceId, user: { owner: { id: ownerId } } },
            relations: ["user"],
        });
        if (!record) throw new NotFoundException("Yozuv topilmadi");
        if (record.status === AttendanceStatus.PRESENT) {
            throw new BadRequestException("QR orqali qayd etilgan davomatni bekor qilib bo'lmaydi");
        }
        const { start, end } = dayBounds();
        if (record.start_time < start || record.start_time > end) {
            throw new BadRequestException("Faqat bugungi yozuvni bekor qilish mumkin");
        }
        await this.attendanceRepository.delete({ id: record.id });
        return { message: "Yozuv bekor qilindi" };
    }


    private buildStatsQuery(ownerId: string, query: GetAttendanceStatsQueryDto) {
        const { search, startDate, endDate, status, userId } = query;

        const qb = this.attendanceRepository.createQueryBuilder("attendance");
        qb.leftJoinAndSelect("attendance.user", "user");
        qb.leftJoin("user.owner", "owner");
        qb.where("owner.id = :ownerId", { ownerId });

        if (startDate || endDate) {
            const { start, end } = periodBounds(startDate ?? new Date(0), endDate ?? new Date());
            qb.andWhere("attendance.start_time BETWEEN :start AND :end", { start, end });
        }

        if (status) {
            qb.andWhere("attendance.status = :status", { status });
        }

        if (userId) {
            qb.andWhere("user.id = :userId", { userId });
        }

        if (search) {
            qb.andWhere(new Brackets((sqb) => {
                sqb.where("user.firstname ILIKE :search", { search: `%${search}%` })
                    .orWhere("user.lastname ILIKE :search", { search: `%${search}%` })
                    .orWhere("user.middlname ILIKE :search", { search: `%${search}%` })
                    .orWhere("user.login ILIKE :search", { search: `%${search}%` });
            }));
        }
        return qb;
    }


    async getAttendanceStatistics(ownerId: string, query: GetAttendanceStatsQueryDto) {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const qb = this.buildStatsQuery(ownerId, query);

        const { sum } = await qb.clone()
            .select("SUM(attendance.worked_hours)", "sum")
            .getRawOne();

        const statusRows: { status: AttendanceStatus; count: string }[] = await qb.clone()
            .select("attendance.status", "status")
            .addSelect("COUNT(*)", "count")
            .groupBy("attendance.status")
            .getRawMany();

        const by_status = Object.values(AttendanceStatus).reduce((acc, s) => {
            acc[s] = Number(statusRows.find((r) => r.status === s)?.count ?? 0);
            return acc;
        }, {} as Record<AttendanceStatus, number>);

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
                total_worked_hours_in_period: Number(totalWorkedHours.toFixed(2)),
                by_status,
            },
            data: data.map(item => ({
                id: item.id,
                date: item.date,
                start_time: item.start_time,
                end_time: item.end_time,
                worked_hours: item.worked_hours,
                status: item.status,
                reason: item.reason,
                user: {
                    id: item.user.id,
                    firstname: item.user.firstname,
                    lastname: item.user.lastname,
                    middlname: item.user.middlname,
                    email: item.user.email
                }
            }))
        };
    }


    // Filtrlangan davomatni CSV ko'rinishida (Excel uchun BOM bilan)
    async exportAttendanceCsv(ownerId: string, query: GetAttendanceStatsQueryDto) {
        const rows = await this.buildStatsQuery(ownerId, query)
            .orderBy("attendance.start_time", "DESC")
            .take(10_000)
            .getMany();

        const esc = (v: unknown) => {
            const s = v === null || v === undefined ? "" : String(v);
            return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const fmt = (d?: Date | null) => (d ? new Date(d).toLocaleString("uz-UZ", { hour12: false }) : "");

        const header = ["Familiya", "Ism", "Login", "Sana", "Kelgan vaqti", "Ketgan vaqti", "Ishlagan soat", "Holat", "Sabab"];
        const lines = rows.map((r) => [
            r.user.lastname,
            r.user.firstname,
            r.user.login,
            new Date(r.date).toLocaleDateString("uz-UZ"),
            r.status === AttendanceStatus.PRESENT ? fmt(r.start_time) : "",
            r.status === AttendanceStatus.PRESENT ? fmt(r.end_time) : "",
            r.worked_hours,
            STATUS_LABELS[r.status],
            r.reason,
        ].map(esc).join(","));

        return "﻿" + [header.join(","), ...lines].join("\n");
    }


    private toResponse(item: Attendance, user: User, action?: GO_WORK_STATUS) {
        return {
            id: item.id,
            action,
            date: item.date,
            start_time: item.start_time,
            end_time: item.end_time,
            worked_hours: item.worked_hours,
            status: item.status,
            reason: item.reason,
            user: {
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                login: user.login,
            },
        };
    }


    private verifyQrToken(qrToken: string): Payload_QR_CODE {
        const secret = this.config.get<string>('QR_CODE_SECRET');
        try {
            return this.jwtService.verify<Payload_QR_CODE>(qrToken.trim(), { secret });
        } catch {
            throw new UnauthorizedException("QR kod yaroqsiz yoki muddati o'tgan");
        }
    }

    private async extractPayloadFromImage(file: Express.Multer.File): Promise<Payload_QR_CODE> {
        let qrToken: string;
        try {
            qrToken = await decodeQRFromBuffer(file.buffer);
        } catch (e) {
            throw new BadRequestException(e instanceof Error ? e.message : "QR kodni o'qib bo'lmadi");
        }
        return this.verifyQrToken(qrToken);
    }

    private toDto(payload: Payload_QR_CODE): QrCodeDto {
        return {
            owner_id: payload.owner_id,
            user_id: payload.user_id,
            status: payload.status
        };
    }

    async processQrAndHandleEnter(ownerId: string, file: Express.Multer.File) {
        const payload = await this.extractPayloadFromImage(file);
        return this.generateQrCodeEnter(ownerId, this.toDto(payload));
    }


    async processQrAndHandleLeave(ownerId: string, file: Express.Multer.File) {
        const payload = await this.extractPayloadFromImage(file);
        return this.generateQrCodeLeave(ownerId, this.toDto(payload));
    }


    // Kamera orqali skanerlangan QR matni (token) — kelish/ketish avtomatik aniqlanadi
    async processScannedToken(ownerId: string, token: string) {
        const payload = this.verifyQrToken(token);
        if (payload.status === GO_WORK_STATUS.GOING_TO_WORK) {
            return this.generateQrCodeEnter(ownerId, this.toDto(payload));
        }
        if (payload.status === GO_WORK_STATUS.LEFT_FROM_WORK) {
            return this.generateQrCodeLeave(ownerId, this.toDto(payload));
        }
        throw new BadRequestException("QR kod statusi noma'lum");
    }


    // Rasm orqali — kelish/ketish avtomatik aniqlanadi
    async processQrImageAuto(ownerId: string, file: Express.Multer.File) {
        let qrToken: string;
        try {
            qrToken = await decodeQRFromBuffer(file.buffer);
        } catch (e) {
            throw new BadRequestException(e instanceof Error ? e.message : "QR kodni o'qib bo'lmadi");
        }
        return this.processScannedToken(ownerId, qrToken);
    }
}
