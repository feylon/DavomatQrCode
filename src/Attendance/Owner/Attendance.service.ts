import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from "@nestjs/common"; // ConflictException qo'shildi
import { InjectRepository } from "@nestjs/typeorm";
import { QrService } from "src/QR/qr.service";
import { User } from "src/User/entity/user";
import { Repository, Between, IsNull, Brackets } from "typeorm"; // Between qo'shildi
import { Attendance } from "../entity/Attendance";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { GetAttendanceStatsQueryDto, MarkAbsenceDto, QrCodeDto } from "./type";
import { AttendanceStatus, GO_WORK_STATUS, Payload_QR_CODE, ROLE } from "types/global.types";
import { decodeQRFromBuffer } from "config/decodeQRFromBuffer";

@Injectable()
export class Attendance_SERVICE_OWNER {
    constructor(
        private readonly qrService: QrService,
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

        // 3. Statusni tekshirish
        if (status != GO_WORK_STATUS.GOING_TO_WORK) {
            throw new NotFoundException("Status noto'g'ri kiritilgan");
        }



        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const existingAttendance = await this.attendanceRepository.findOne({
            where: {
                user: { id: user_id },
                start_time: Between(todayStart, todayEnd),
            }
        });

        if (existingAttendance) {
            throw new ConflictException("Foydalanuvchi bugun allaqachon ishga kelgan!");
        }

        const attendance = this.attendanceRepository.create({
            user: user,
            status: AttendanceStatus.PRESENT,
            start_time: new Date(),
            date: new Date(),
            worked_hours: 0
        });

        const saved_attendance = await this.attendanceRepository.save(attendance);

        return saved_attendance;
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
            throw new NotFoundException("Status noto'g'ri kiritilgan");
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const attendance = await this.attendanceRepository.findOne({
            where: {
                user: { id: user_id },
                start_time: Between(todayStart, todayEnd),
            },
        });

        if (!attendance) {
            throw new NotFoundException("Foydalanuvchi bugun ishga kelmagan!");
        }

        if (attendance.end_time) {
            throw new ConflictException("Foydalanuvchi bugun allaqachon ishdan ketgan!");
        }

        const now = new Date();
        const diffMs = now.getTime() - new Date(attendance.start_time).getTime();

        if (diffMs < 0) {
            throw new ConflictException("Vaqt xatosi: ketish vaqti kelishdan oldin bo‘lolmaydi");
        }

        const workedHours = diffMs / (1000 * 60 * 60);

        attendance.end_time = now;
        attendance.worked_hours = Number(workedHours.toFixed(2));
        attendance.status = AttendanceStatus.PRESENT;

        return await this.attendanceRepository.save(attendance);
    }


    async getEmployeesCurrentlyAtWork(ownerId: string) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const employees = await this.attendanceRepository.find({
            where: {
                start_time: Between(todayStart, todayEnd),

                end_time: IsNull(),

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
            }
        });

        return employees;
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

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const existingAttendance = await this.attendanceRepository.findOne({
            where: {
                user: { id: user_id },
                start_time: Between(todayStart, todayEnd),
            }
        });

        if (existingAttendance) {
            throw new ConflictException(`Bu xodim uchun bugun allaqachon status belgilangan: ${existingAttendance.status}`);
        }

        const attendance = this.attendanceRepository.create({
            user: user,
            status: status,
            reason: reason,
            start_time: new Date(),
            end_time: new Date(),
            worked_hours: 0,
            date: new Date()
        });

        return await this.attendanceRepository.save(attendance);
    }



    async getAttendanceStatistics(ownerId: string, query: GetAttendanceStatsQueryDto) {
        const { page = 1, limit = 10, search, startDate, endDate, status } = query;
        const skip = (page - 1) * limit;

        const qb = this.attendanceRepository.createQueryBuilder("attendance");

        qb.leftJoinAndSelect("attendance.user", "user");
        qb.leftJoin("user.owner", "owner");

        qb.where("owner.id = :ownerId", { ownerId });

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

        if (search) {
            qb.andWhere(new Brackets((sqb) => {
                sqb.where("user.firstname ILIKE :search", { search: `%${search}%` })
                    .orWhere("user.lastname ILIKE :search", { search: `%${search}%` })
                    .orWhere("user.middlname ILIKE :search", { search: `%${search}%` })
                    .orWhere("user.login ILIKE :search", { search: `%${search}%` });
            }));
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
                total_worked_hours_in_period: Number(totalWorkedHours.toFixed(2))
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

    private async extractPayloadFromImage(file: Express.Multer.File): Promise<Payload_QR_CODE> {
        const qrToken = await decodeQRFromBuffer(file.buffer);
        const secret = this.config.get<string>('QR_CODE_SECRET');

        try {
            return this.jwtService.verify(qrToken, { secret });
        } catch (error) {
            throw new UnauthorizedException("QR kod yaroqsiz yoki muddati o'tgan");
        }
    }

    async processQrAndHandleEnter(ownerId: string, file: Express.Multer.File) {
        const payload = await this.extractPayloadFromImage(file);

        return this.generateQrCodeEnter(ownerId, {
            owner_id: payload.owner_id,
            user_id: payload.user_id,
            status: payload.status
        });
    }


    async processQrAndHandleLeave(ownerId: string, file: Express.Multer.File) {
        const payload = await this.extractPayloadFromImage(file);

        return this.generateQrCodeLeave(ownerId, {
            owner_id: payload.owner_id,
            user_id: payload.user_id,
            status: payload.status
        });
    }
}