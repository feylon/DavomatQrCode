import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Roles } from "src/auth/roles.decorator";
import { ROLE } from "types/global.types";
import { UserServiceOwner } from "./user.service[owner]";
import { CreateEmployeeByOwnerDto, GetOwnerUsersQueryDto, ResetPasswordDto, UpdateEmployeeByOwnerDto } from "./entity/user.dto[owner]";

@Roles(ROLE.OWNER)
@ApiBearerAuth()
@ApiTags("Owner => Users")
@Controller("owner/users")
export class UserControllerOwner {
  constructor(
    private readonly userService: UserServiceOwner
) {}


  @Get()
  @ApiOperation({ summary: "Owner o'z userlarini oladi (search + pagination)" })
  @ApiResponse({
    status: 200,
    description: "Owner userlari",
    example: {
      data: [
        {
          id: "uuid",
          login: "user123",
          firstname: "Ali",
          lastname: "Valiyev",
          middlname: "Otabekovich",
          email: "user@mail.com",
          role: "USER",
          isBlock: false,
          created_At: "2026-02-01T12:00:00.000Z",
          updated_At: "2026-02-01T12:00:00.000Z",
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    },
  })
  getMyUsers(@Req() req: any, @Query() query: GetOwnerUsersQueryDto) {
    return this.userService.getUsersByOwner(req.user.id, query);
  }


  @Get(":id")
  @ApiParam({ name: "id", description: "Xodim ID" })
  @ApiOperation({ summary: "Xodimni ID orqali olish" })
  @ApiResponse({ status: 404, description: "Xodim topilmadi" })
  getEmployee(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.userService.getEmployeeById(req.user.id, id);
  }


  @Post()
  @ApiOperation({ summary: "Yangi xodim qo'shish (o'z kompaniyasiga)" })
  @ApiBody({ type: CreateEmployeeByOwnerDto })
  @ApiResponse({ status: 201, description: "Xodim yaratildi" })
  @ApiResponse({ status: 400, description: "login/email mavjud" })
  createEmployee(@Req() req: any, @Body() body: CreateEmployeeByOwnerDto) {
    return this.userService.createEmployee(req.user.id, body);
  }


  @Patch(":id")
  @ApiParam({ name: "id", description: "Xodim ID" })
  @ApiOperation({ summary: "Xodim ma'lumotlarini tahrirlash / bloklash" })
  @ApiBody({ type: UpdateEmployeeByOwnerDto })
  updateEmployee(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: UpdateEmployeeByOwnerDto) {
    return this.userService.updateEmployee(req.user.id, id, body);
  }


  @Patch(":id/password")
  @ApiParam({ name: "id", description: "Xodim ID" })
  @ApiOperation({ summary: "Xodim parolini tiklash" })
  @ApiBody({ type: ResetPasswordDto })
  resetPassword(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: ResetPasswordDto) {
    return this.userService.resetEmployeePassword(req.user.id, id, body);
  }
}
