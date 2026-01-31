import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Roles } from "src/auth/roles.decorator";
import { UserService } from "./user.service";
import { ROLE } from "types/global.types";
import { UserServiceOwner } from "./user.service[owner]";
import { GetOwnerUsersQueryDto } from "./entity/user.dto[owner]";
import { QrService } from "src/QR/qr.service";

@ApiTags("Owner => Users")
@Controller("owner")
export class UserControllerOwner {
  constructor(
    private readonly userService: UserServiceOwner,
    private readonly QR : QrService
) {}
  

  @Roles(ROLE.OWNER)
  @Get("/owner/users")
  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @ApiOperation({ summary: "Test QR code generation for Owner" })
  @Get("/test")
    async testOwner() {
        const qr_code = await this.QR.generateBase64("  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU2OGUwZmNlLWQwMmUtNDU4MC1iNzkyLWQxZDVkOWRmNTQ4ZSIsInJvbGUiOiJPV05FUiIsImlhdCI6MTc2OTg5OTQzMCwiZXhwIjoxNzY5OTM1NDMwfQ.iiiImCHgD8XcwfPW3mYtHc4Dy4ZhcOPFbmz21Xo-XD0");
        return  qr_code
        
    }
}
