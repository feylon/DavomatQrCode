import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConflictResponse, ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { Request } from "express";
import { Roles } from "src/auth/roles.decorator";
import { ROLE } from "types/global.types";
import { GetAttendanceStatsQueryDto, MarkAbsenceDto, QrCodeDto } from "./type";
import { Attendance_SERVICE_OWNER } from "./Attendance.service";
import { Attendance } from "../entity/Attendance";

type AuthRequest = Request & {
    user: {
        id: string;
        role: ROLE;
        username?: string;
    };
};

@Roles(ROLE.OWNER)
@ApiTags("Attendance - Owner")
@ApiBearerAuth()
@Controller("owner/attendance")
export class AttendanceController_OWNER {
    constructor(private readonly attendanceService: Attendance_SERVICE_OWNER) { }

    @Post("enter")
    @ApiOperation({ summary: "Ishga kelish (Enter)" })
    @ApiBody({ type: QrCodeDto })
    @ApiResponse({ status: 201, description: "Davomat yaratildi", type: Attendance })
    @ApiConflictResponse({ description: "Bugun allaqachon ishga kelgan" })
    @ApiUnauthorizedResponse({ description: "Token yo‘q yoki noto‘g‘ri" })
    @ApiForbiddenResponse({ description: "Ruxsat yo‘q (ROLE.OWNER kerak)" })
    async enter(@Req() req: AuthRequest, @Body() body: QrCodeDto) {
        const ownerId = req.user.id;
        return this.attendanceService.generateQrCodeEnter(ownerId, body);
    }

    @Post("leave")
    @ApiOperation({ summary: "Ishdan ketish (Leave)" })
    @ApiBody({ type: QrCodeDto })
    @ApiResponse({ status: 200, description: "Davomat yakunlandi", type: Attendance })
    @ApiConflictResponse({ description: "Bugun allaqachon ishdan ketgan yoki vaqt xatosi" })
    @ApiUnauthorizedResponse({ description: "Token yo‘q yoki noto‘g‘ri" })
    @ApiForbiddenResponse({ description: "Ruxsat yo‘q (ROLE.OWNER kerak)" })
    async leave(@Req() req: AuthRequest, @Body() body: QrCodeDto) {
        const ownerId = req.user.id;
        return this.attendanceService.generateQrCodeLeave(ownerId, body);
    }


    @Get("at-work")
    @ApiOperation({ summary: "Hozir ish joyida bo'lgan xodimlar ro'yxati" })
    @ApiResponse({ status: 200, description: "Ishdagi xodimlar", type: [Attendance] })
    @ApiUnauthorizedResponse({ description: "Token yo‘q yoki noto‘g‘ri" })
    @ApiForbiddenResponse({ description: "Ruxsat yo‘q" })
    async getAtWork(@Req() req: AuthRequest) {
        const ownerId = req.user.id;
        return this.attendanceService.getEmployeesCurrentlyAtWork(ownerId);
    }



    @Post("mark-absence")
    @ApiOperation({ summary: "Xodimni sababli/sababsiz kelmagan deb belgilash" })
    @ApiBody({ type: MarkAbsenceDto })
    @ApiResponse({ status: 201, description: "Status muvaffaqiyatli o'zgartirildi" })
    @ApiConflictResponse({ description: "Bugun uchun allaqachon yozuv mavjud" })
    async markAbsence(@Req() req: AuthRequest, @Body() body: MarkAbsenceDto) {
        const ownerId = req.user.id;
        return this.attendanceService.markUserAbsence(ownerId, body);
    }



    @Get("stats")
    @ApiOperation({ summary: "Davomat statistikasi va tarixi (Filterlar bilan)" })
    @ApiResponse({ status: 200, description: "Statistik ma'lumotlar" })
    async getStats(@Req() req: AuthRequest, @Query() query: GetAttendanceStatsQueryDto) {
        const ownerId = req.user.id;
        return this.attendanceService.getAttendanceStatistics(ownerId, query);
    }
}
