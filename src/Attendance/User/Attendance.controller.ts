import { Controller, Get, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Roles } from "src/auth/roles.decorator";
import { QrService } from "src/QR/qr.service";
import { ROLE } from "types/global.types";
import { Attendance_SERVICE } from "./Attendance.service";
import { GetUserStatsQueryDto } from "./types";

@Roles(ROLE.USER)
@ApiTags("Attendance - User")
@ApiBearerAuth()
@Controller("user/attendance")
export class AttendanceController_USER {
    constructor(
        private readonly qrService: QrService,
        private readonly attendanceService: Attendance_SERVICE
    ) { }

    @Post("enter/generated_qr")
    async generateQrCodeEnter(@Req() req: any) {
        return this.attendanceService.generateUserQrCodeEnter(req.user.id);
    }


    @Post("exit/generated_qr")
    async generateQrCodeOut(@Req() req: any) {
        return this.attendanceService.generateUserQrCodeOut(req.user.id);
    }

    @Get("my-stats")
    @ApiOperation({ summary: "Mening davomat statistikam va tarixim" })
    @ApiResponse({ status: 200, description: "Shaxsiy statistika" })
    async getMyStats(@Req() req: any, @Query() query: GetUserStatsQueryDto) {
        return this.attendanceService.getOwnStatistics(req.user.id, query);
    }
}
