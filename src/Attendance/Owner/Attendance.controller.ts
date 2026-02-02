import { Body, Controller, Get, UploadedFile, Post, Query, Req, UseInterceptors, BadRequestException, HttpCode, Delete, Param, ParseUUIDPipe, Res, ParseFilePipe, MaxFileSizeValidator } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConflictResponse, ApiConsumes, ApiForbiddenResponse, ApiOperation, ApiParam, ApiProduces, ApiResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { Request } from "express";
import type { Response } from "express";
import { Roles } from "src/auth/roles.decorator";
import { ROLE } from "types/global.types";
import { GetAttendanceStatsQueryDto, MarkAbsenceDto, ScanTokenDto } from "./type";
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

    @Post("scan")
    @HttpCode(200)
    @ApiOperation({ summary: "Kamera orqali o'qilgan QR token (kelish/ketish avtomatik aniqlanadi)" })
    @ApiBody({ type: ScanTokenDto })
    async scan(@Req() req: AuthRequest, @Body() body: ScanTokenDto) {
        return this.attendanceService.processScannedToken(req.user.id, body.token);
    }

    @Post("scan-image")
    @HttpCode(200)
    @ApiOperation({ summary: "QR rasm yuklash (kelish/ketish avtomatik aniqlanadi)" })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary', description: 'QR kod rasmi' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async scanImage(
        @Req() req: AuthRequest,
        @UploadedFile(new ParseFilePipe({
            fileIsRequired: true,
            validators: [
                new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024, message: "Rasm hajmi 5MB dan oshmasligi kerak" }),
            ],
        })) file: Express.Multer.File,
    ) {
        return this.attendanceService.processQrImageAuto(req.user.id, file);
    }

    @Get("today")
    @ApiOperation({ summary: "Bugungi umumiy holat (har bir xodim bo'yicha)" })
    async today(@Req() req: AuthRequest) {
        return this.attendanceService.getTodayOverview(req.user.id);
    }

    @Get("export")
    @ApiOperation({ summary: "Davomatni CSV faylga eksport qilish (statistika filtrlari bilan)" })
    @ApiProduces("text/csv")
    async export(@Req() req: AuthRequest, @Query() query: GetAttendanceStatsQueryDto, @Res() res: Response) {
        const csv = await this.attendanceService.exportAttendanceCsv(req.user.id, query);
        const name = `davomat-${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
        res.send(csv);
    }

    @Delete("absence/:id")
    @ApiParam({ name: "id", description: "Davomat yozuvi ID" })
    @ApiOperation({ summary: "Bugun belgilangan sababli/sababsiz yozuvni bekor qilish" })
    async cancelAbsence(@Req() req: AuthRequest, @Param("id", new ParseUUIDPipe()) id: string) {
        return this.attendanceService.cancelAbsence(req.user.id, id);
    }

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



