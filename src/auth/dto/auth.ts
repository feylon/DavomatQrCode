import { ApiProperty } from "@nestjs/swagger";
import { IsJWT, IsString, MinLength } from "class-validator";

export class LoginBody {
  @ApiProperty({
    example: "admin01",
    description: "Foydalanuvchi login nomi"
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: "admin0101",
    description: "Foydalanuvchi paroli"
  })
  @IsString()
  @MinLength(6)
  password: string;
}


export class ChangePasswordBody {
  @ApiProperty({
    example: "oldPassword123",
    description: "Foydalanuvchining eski paroli"
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    example: "newPassword123",
    description: "Foydalanuvchining yangi paroli"
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}


export class RefreshTokenBody {
  @ApiProperty({ description: "Login paytida olingan refresh token" })
  @IsJWT()
  refreshToken: string;
}
