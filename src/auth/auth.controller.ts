import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ChangePasswordBody, LoginBody, RefreshTokenBody } from './dto/auth';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    @HttpCode(200)
    @Post('login')
    @ApiOperation({ summary: "Tizimga kirish (access + refresh token)" })
    login(@Body() body: LoginBody) {
        return this.authService.loginFunction(body);
    }

    @Public()
    @HttpCode(200)
    @Post('refresh')
    @ApiOperation({ summary: "Refresh token orqali yangi tokenlar olish" })
    refresh(@Body() body: RefreshTokenBody) {
        return this.authService.refreshTokens(body.refreshToken);
    }

    @ApiBearerAuth()
    @HttpCode(200)
    @Post('changePassword')
    @ApiOperation({ summary: "Parolni o'zgartirish" })
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