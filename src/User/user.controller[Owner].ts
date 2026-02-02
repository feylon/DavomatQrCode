import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Roles } from "src/auth/roles.decorator";
import { ROLE } from "types/global.types";
import { UserServiceOwner } from "./user.service[owner]";
import { GetOwnerUsersQueryDto } from "./entity/user.dto[owner]";

@ApiTags("Owner => Users")
@Controller("owner")
export class UserControllerOwner {
  constructor(
    private readonly userService: UserServiceOwner
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

}
