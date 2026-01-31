import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Roles } from "src/auth/roles.decorator";
import { AddOwnerAdminDto, CreateUserByAdminDto, GetOwnersQueryDto, GetUsersQueryDto, UpdateOwnerAdminDto, UpdateUserAdminDto } from "./entity/user.dto";
import { UserService } from "./user.service";
import { ROLE } from "types/global.types";

@ApiTags("Admin => Owner")
@Controller("")
export class UserController {

    constructor(private readonly adminService: UserService) { }

    @Roles(ROLE.ADMIN)
    @Post("/admin/owners")
    @ApiOperation({ summary: "Owner yaratish (Admin)" })
    @ApiBody({ type: AddOwnerAdminDto })
    @ApiBearerAuth()
    @ApiResponse({
        status: 201, description: "Owner yaratildi", example: {
            "id": "7ac2925f-558d-4fa7-8cd2-2a4b44e81d09",
            "login": "admin011",
            "middlname": "Otasini ismi",
            "firstname": "Ismi",
            "lastname": "Familiya",
            "email": "admin1@mail.com",
            "company": "OpenAI LLC",
            "role": "OWNER",
            "created_At": "2026-01-31T20:42:19.911Z",
            "updated_At": "2026-01-31T20:42:19.911Z",
            "isBlock": false
        }
    })
    @ApiResponse({ status: 400, description: "Validation xato" })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden (role yo‘q)" })
    createOwner(@Body() body: AddOwnerAdminDto) {
        return this.adminService.createOwner(body);
    }



    @Roles(ROLE.ADMIN)
    @Get("/admin/owners")
    @ApiBearerAuth()
    @ApiOperation({ summary: "Ownerlar ro'yxati (pagination + search)" })
    @ApiResponse({
        status: 200,
        description: "Ownerlar",
        example: {
            data: [
                {
                    id: "7ac2925f-558d-4fa7-8cd2-2a4b44e81d09",
                    login: "admin011",
                    middlname: "Otasini ismi",
                    firstname: "Ismi",
                    lastname: "Familiya",
                    email: "admin1@mail.com",
                    company: "OpenAI LLC",
                    role: "OWNER",
                    created_At: "2026-01-31T20:42:19.911Z",
                    updated_At: "2026-01-31T20:42:19.911Z",
                    isBlock: false,
                },
            ],
            meta: {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            },
        },
    })
    getOwners(@Query() query: GetOwnersQueryDto) {
        return this.adminService.getOwners(query);
    }



    @Roles(ROLE.ADMIN)
    @Patch("/admin/owners/:id")
    @ApiBearerAuth()
    @ApiParam({ name: "id", description: "Owner ID", example: "7ac2925f-558d-4fa7-8cd2-2a4b44e81d09" })
    @ApiOperation({ summary: "Owner edit qilish (Admin)" })
    @ApiBody({ type: UpdateOwnerAdminDto })
    @ApiResponse({ status: 200, description: "Owner yangilandi" })
    @ApiResponse({ status: 404, description: "Owner topilmadi" })
    @ApiResponse({ status: 400, description: "login/email mavjud" })
    updateOwner(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: UpdateOwnerAdminDto, @Req() req: any) {
      console.log("Request user:", req.user);
      return this.adminService.updateOwner(id, body);
    }

    @Get("/admin/owners/:id")
    @Roles(ROLE.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Owner ID orqali olish" })
    @ApiResponse({ status: 200, description: "Owner topildi" })
    @ApiResponse({ status: 404, description: "Owner topilmadi" })
    @ApiParam({ name: "id", description: "Owner ID", example: "7ac2925f-558d-4fa7-8cd2-2a4b44e81d09", type : "string" })

    getOwnerById(@Param("id", new ParseUUIDPipe()) id: string, @Req() req: any) {
      console.log("Request user:", req.user);
        return this.adminService.getOwnerById(id);
    }


    // User qo'shish VA OWNERGA BIRIKTIRISH
    
  @Roles(ROLE.ADMIN)
  @Post("/admin/users")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin USER yaratadi va ownerga biriktiradi" })
  @ApiBody({ type: CreateUserByAdminDto })
  @ApiResponse({ status: 201, description: "User yaratildi" })
  createUserByAdmin(@Body() body: CreateUserByAdminDto) {
    return this.adminService.createUserByAdmin(body);
  }


//   Userni Update qilish

  @Roles(ROLE.ADMIN)
  @Patch("/admin/users/:id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "User update (passwordsiz)" })
  @ApiBody({ type: UpdateUserAdminDto })
  @ApiResponse({ status: 200, description: "User yangilandi" })
  @ApiResponse({ status: 404, description: "User/Owner topilmadi" })
  @ApiResponse({ status: 400, description: "login/email mavjud yoki owner bloklangan" })
  updateUser(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: UpdateUserAdminDto) {
    return this.adminService.updateUserAdmin(id, body);
  }


//   Userni qidirish
 @Roles(ROLE.ADMIN)
  @Get("/admin/users")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Userlar (ownerId filter + ILIKE search + pagination)" })
  @ApiResponse({
    status: 200,
    description: "Userlar ro'yxati",
    example: {
      data: [
        {
          id: "uuid",
          login: "user123",
          firstname: "Ali",
          lastname: "Valiyev",
          middlname: "Otabekovich",
          email: "user123@mail.com",
          role: "USER",
          isBlock: false,
          created_At: "2026-02-01T12:00:00.000Z",
          updated_At: "2026-02-01T12:00:00.000Z",
          owner: { id: "owner-uuid" },
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    },
  })
  getUsers(@Query() query: GetUsersQueryDto) {
    return this.adminService.getUsers(query);
  }



@Roles(ROLE.ADMIN)
@Get("/admin/users/:id")
@ApiBearerAuth()
@ApiOperation({ summary: "Userni ID orqali olish" })
@ApiResponse({ status: 200, description: "User topildi" })
@ApiResponse({ status: 404, description: "User topilmadi" })
getUserById(@Param("id", new ParseUUIDPipe()) id: string) {
  return this.adminService.getUserById(id);
}
}