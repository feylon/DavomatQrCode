import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ChangePasswordBody, LoginBody } from './dto/auth';
import { ApiBearerAuth, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './JwtAuthGuard';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    login(@Body() body: LoginBody) {
        return this.authService.loginFunction(body);
    }

    @ApiBearerAuth()
    @Post('changePassword')
    changePassword(@Body() body: ChangePasswordBody, @Req() req: any) {
        return this.authService.changePassword(req.user.id, body);
    }


    @ApiBearerAuth()
    @ApiOkResponse({
        example: {
            id: "9ef194ba-8553-4ae2-b933-050122af0861",
            login: "USER01",
            middlname: null,
            firstname: "Admin",
            lastname: "Admin",
            email: "USER@gmail.com",
            company: null,
            role: "User",
            created_At: "2026-01-31T18:38:54.570Z",
            updated_At: "2026-01-31T18:38:54.570Z",
            isBlock: false
        }
    })
    @Get('profile')
    getProfile(@Req() req: any) {
        return this.authService.getProfile(req.user.id);
    }
}