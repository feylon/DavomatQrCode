import { Controller, Get, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Roles } from "src/auth/roles.decorator";
import { ROLE } from "types/global.types";
import { Attendance_SERVICE } from "./Attendance.service";
import { GetUserStatsQueryDto } from "./types";

@Roles(ROLE.USER)
@ApiTags("Attendance - User")
@ApiBearerAuth()
@Controller("user/attendance")
export class AttendanceController_USER {
    constructor(
        private readonly attendanceService: Attendance_SERVICE
    ) { }

    @Post("enter/generated_qr")
    @ApiOperation({ summary: "Ishga kelish uchun QR kod yaratish" })
    async generateQrCodeEnter(@Req() req: any) {
        return this.attendanceService.generateUserQrCodeEnter(req.user.id);
    }


    @Post("exit/generated_qr")
    @ApiOperation({ summary: "Ishdan ketish uchun QR kod yaratish" })
    async generateQrCodeOut(@Req() req: any) {
        return this.attendanceService.generateUserQrCodeOut(req.user.id);
    }

    @Get("today")
    @ApiOperation({ summary: "Bugungi holatim va joriy oy xulosasi" })
    async getToday(@Req() req: any) {
        return this.attendanceService.getToday(req.user.id);
    }

    @Get("my-stats")
    @ApiOperation({ summary: "Mening davomat statistikam va tarixim" })
    @ApiResponse({ status: 200, description: "Shaxsiy statistika" })
    async getMyStats(@Req() req: any, @Query() query: GetUserStatsQueryDto) {
        return this.attendanceService.getOwnStatistics(req.user.id, query);
    }
}
