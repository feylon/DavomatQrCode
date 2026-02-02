import { Body, Controller, Get, UploadedFile, Post, Query, Req, UseInterceptors, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConflictResponse, ApiConsumes, ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { Request } from "express";
import { Roles } from "src/auth/roles.decorator";
import { ROLE } from "types/global.types";
import { GetAttendanceStatsQueryDto, MarkAbsenceDto, QrCodeDto } from "./type";
import { Attendance_SERVICE_OWNER } from "./Attendance.service";
import { Attendance } from "../entity/Attendance";
import { FileInterceptor } from "@nestjs/platform-express";

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
    @ApiOperation({ summary: "Ishga kelish (QR Rasm orqali)" })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary', description: 'QR kod rasmi' },
            },
        },
    })
    @ApiResponse({ status: 201, description: "Davomat yaratildi", type: Attendance })
    @ApiConflictResponse({ description: "Bugun allaqachon ishga kelgan" })
    @UseInterceptors(FileInterceptor('file'))
    async enter(@Req() req: AuthRequest, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException("Rasm yuklanmagan");
        const ownerId = req.user.id;
        return this.attendanceService.processQrAndHandleEnter(ownerId, file);
    }
    

@Post("leave")
    @ApiOperation({ summary: "Ishdan ketish (QR Rasm orqali)" })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary', description: 'QR kod rasmi' },
            },
        },
    })
    @ApiResponse({ status: 200, description: "Davomat yakunlandi", type: Attendance })
    @UseInterceptors(FileInterceptor('file'))
    async leave(@Req() req: AuthRequest, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException("Rasm yuklanmagan");
        const ownerId = req.user.id;
        return this.attendanceService.processQrAndHandleLeave(ownerId, file);
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



