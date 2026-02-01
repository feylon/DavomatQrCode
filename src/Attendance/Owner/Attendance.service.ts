import { Injectable, NotFoundException, ConflictException } from "@nestjs/common"; // ConflictException qo'shildi
import { InjectRepository } from "@nestjs/typeorm";
import { QrService } from "src/QR/qr.service";
import { User } from "src/User/entity/user";
import { Repository, Between, IsNull, Brackets } from "typeorm"; // Between qo'shildi
import { Attendance } from "../entity/Attendance";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { GetAttendanceStatsQueryDto, MarkAbsenceDto, QrCodeDto } from "./type";
import { AttendanceStatus, GO_WORK_STATUS, ROLE } from "types/global.types";

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

        // 1. Userni tekshirish
        const user = await this.userRepository.findOne({ 
            where: { id: user_id, isBlock: false, role: ROLE.USER } 
        });
        if (!user) throw new NotFoundException("User mavjud emas");

        // 2. Egalikni tekshirish
        if (owner_id !== userId) {
            throw new NotFoundException("Egalik mos emas");
        }

        // 3. Statusni tekshirish
        if (status != GO_WORK_STATUS.GOING_TO_WORK) {
            throw new NotFoundException("Status noto'g'ri kiritilgan");
        }

        // ==================================================
        // YANGI QO'SHILGAN MANTIQ (KUNLIK TEKSHIRUV)
        // ==================================================
        
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0); // Bugun soat 00:00:00

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999); // Bugun soat 23:59:59

        const existingAttendance = await this.attendanceRepository.findOne({
            where: {
                user: { id: user_id },
                // start_time yoki date maydoni bo'yicha tekshiramiz
                start_time: Between(todayStart, todayEnd), 
            }
        });

        if (existingAttendance) {
            throw new ConflictException("Foydalanuvchi bugun allaqachon ishga kelgan!");
        }

        // ==================================================

        // 4. Yangi davomat yaratish
        const attendance = this.attendanceRepository.create({
            user: user,
            status: AttendanceStatus.PRESENT,
            start_time: new Date(),
            date: new Date(), // Agar entityda date ham timestamp bo'lsa
            worked_hours: 0
        });

        const saved_attendance = await this.attendanceRepository.save(attendance);

        return saved_attendance;
    }


    async generateQrCodeLeave(userId: string, body: QrCodeDto) {
    const { owner_id, status, user_id } = body;

    // 1. Userni tekshirish
    const user = await this.userRepository.findOne({
      where: { id: user_id, isBlock: false, role: ROLE.USER },
    });
    if (!user) throw new NotFoundException("User mavjud emas");

    // 2. Egalikni tekshirish
    if (owner_id !== userId) {
      throw new NotFoundException("Egalik mos emas");
    }

    // 3. Statusni tekshirish
    if (status !== GO_WORK_STATUS.LEFT_FROM_WORK) {
      throw new NotFoundException("Status noto'g'ri kiritilgan");
    }

    // 4. Bugungi davomatni topish (kelgan bo'lishi shart)
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

    // 5. Ikki marta ketib qolmasligi
    if (attendance.end_time) {
      throw new ConflictException("Foydalanuvchi bugun allaqachon ishdan ketgan!");
    }

    // 6. Ketish vaqtini yozish + worked_hours hisoblash
    const now = new Date();
    const diffMs = now.getTime() - new Date(attendance.start_time).getTime();

    if (diffMs < 0) {
      throw new ConflictException("Vaqt xatosi: ketish vaqti kelishdan oldin bo‘lolmaydi");
    }

    const workedHours = diffMs / (1000 * 60 * 60);

    attendance.end_time = now;
    attendance.worked_hours = Number(workedHours.toFixed(2));
    attendance.status = AttendanceStatus.PRESENT; // xohlasangiz alohida status (ON_LEAVE) qilasiz

    return await this.attendanceRepository.save(attendance);
  }


async getEmployeesCurrentlyAtWork(ownerId: string) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const employees = await this.attendanceRepository.find({
            where: {
                // 1. Bugungi kun bo'yicha
                start_time: Between(todayStart, todayEnd),
                
                // 2. Hali ketmaganlar (end_time yo'q)
                end_time: IsNull(),
                
                // 3. Faqat shu Ownerga tegishli userlar
                user: {
                    owner: {
                        id: ownerId
                    }
                }
            },
            relations: ["user"], // User ma'lumotlarini ham qo'shib olamiz
            select: {
                id: true,
                start_time: true,
                status: true,
                user: {
                    id: true,
                    firstname: true,
                    lastname: true,
                    login: true,
                    // password va boshqa maxfiy narsalarni olmaymiz
                }
            }
        });

        return employees;
    }




    async markUserAbsence(ownerId: string, body: MarkAbsenceDto) {
        const { user_id, status, reason } = body;

        // 1. Statusni tekshirish (PRESENT ni qo'lda yozib qo'ymasliklari uchun)
        if (status === AttendanceStatus.PRESENT) {
            throw new ConflictException("Bu endpoint orqali xodimni 'PRESENT' (Ishda) deb belgilay olmaysiz. QR kod ishlating.");
        }

        // 2. Userni tekshirish
        const user = await this.userRepository.findOne({
            where: { id: user_id, role: ROLE.USER },
            relations: ["owner"]
        });

        if (!user) throw new NotFoundException("Xodim topilmadi");

        // Owner tekshiruvi
        if (!user.owner || user.owner.id !== ownerId) {
            throw new NotFoundException("Siz faqat o'z xodimlaringizni boshqara olasiz");
        }

        // 3. Bugungi kun oralig'ini olish
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // 4. Bugun uchun yozuv borligini tekshirish
        const existingAttendance = await this.attendanceRepository.findOne({
            where: {
                user: { id: user_id },
                start_time: Between(todayStart, todayEnd),
            }
        });

        if (existingAttendance) {
            throw new ConflictException(`Bu xodim uchun bugun allaqachon status belgilangan: ${existingAttendance.status}`);
        }

        // 5. Yangi davomat yozish (EXCUSED, ABSENT yoki ON_LEAVE)
        const attendance = this.attendanceRepository.create({
            user: user,
            status: status,      // EXCUSED
            reason: reason,      // "Kasal bo'lib qoldi"
            start_time: new Date(), 
            end_time: new Date(), // Darhol yopamiz, chunki u ishlamaydi
            worked_hours: 0,
            date: new Date()
        });

        return await this.attendanceRepository.save(attendance);
    }
  


       async getAttendanceStatistics(ownerId: string, query: GetAttendanceStatsQueryDto) {
        const { page = 1, limit = 10, search, startDate, endDate, status } = query;
        const skip = (page - 1) * limit;

        // QueryBuilder yaratamiz
        const qb = this.attendanceRepository.createQueryBuilder("attendance");

        // User jadvalini ulaymiz (JOIN)
        qb.leftJoinAndSelect("attendance.user", "user");
        qb.leftJoin("user.owner", "owner"); // Ownerni tekshirish uchun

        // 1. Faqat shu Ownerga tegishli userlarni olish
        qb.where("owner.id = :ownerId", { ownerId });

        // 2. Sana bo'yicha filtrlash (Agar berilgan bo'lsa)
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            qb.andWhere("attendance.start_time BETWEEN :start AND :end", { start, end });
        }

        // 3. Status bo'yicha filtrlash
        if (status) {
            qb.andWhere("attendance.status = :status", { status });
        }

        // 4. Qidiruv (Ism, Familiya, Otasini ismi)
        if (search) {
            qb.andWhere(new Brackets((sqb) => {
                sqb.where("user.firstname ILIKE :search", { search: `%${search}%` })
                   .orWhere("user.lastname ILIKE :search", { search: `%${search}%` })
                   .orWhere("user.middlname ILIKE :search", { search: `%${search}%` })
                   .orWhere("user.login ILIKE :search", { search: `%${search}%` });
            }));
        }

        // =========================================================
        // O'ZGARISH SHU YERDA:
        // ORDER BY ni qo'shishdan OLDIN Summani hisoblaymiz.
        // =========================================================

        const totalHoursQuery = qb.clone(); 
        // Clone qilingan queryda ORDER BY yo'qligiga ishonch hosil qilish uchun:
        // (Aslida bu yerda hali orderBy qo'shilmagan, shuning uchun shunchaki clone ishlaydi)
        
        const { sum } = await totalHoursQuery
            .select("SUM(attendance.worked_hours)", "sum")
            .getRawOne();
        
        const totalWorkedHours = sum ? parseFloat(sum) : 0;

        // =========================================================
        // ENDI ASOSIY LIST UCHUN ORDER VA PAGINATION QO'SHAMIZ
        // =========================================================

        // 5. Tartiblash (Eng yangisi tepada)
        qb.orderBy("attendance.start_time", "DESC");

        // 6. Pagination
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
}