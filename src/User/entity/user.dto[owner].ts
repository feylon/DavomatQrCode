import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export class GetOwnerUsersQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Sahifa (1 dan boshlanadi)" })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: "Limit (har sahifada nechta)" })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: "ali",
    description: "firstname/lastname/middlname/login bo‘yicha ILIKE qidiruv",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ["active", "blocked"], description: "Holati bo'yicha filter" })
  @IsOptional()
  @IsIn(["active", "blocked"])
  state?: "active" | "blocked";
}

export class CreateEmployeeByOwnerDto {
  @ApiProperty({ example: "ali.valiyev" })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ example: "secret123" })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: "Ali" })
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({ example: "Valiyev" })
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiPropertyOptional({ example: "Otabekovich" })
  @IsOptional()
  @IsString()
  middlname?: string;

  @ApiProperty({ example: "ali@mail.com" })
  @IsEmail()
  email: string;
}

export class UpdateEmployeeByOwnerDto {
  @ApiPropertyOptional({ example: "ali.valiyev" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  login?: string;

  @ApiPropertyOptional({ example: "Ali" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstname?: string;

  @ApiPropertyOptional({ example: "Valiyev" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastname?: string;

  @ApiPropertyOptional({ example: "Otabekovich" })
  @IsOptional()
  @IsString()
  middlname?: string;

  @ApiPropertyOptional({ example: "ali@mail.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: false, description: "Bloklash/ochish" })
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  isBlock?: boolean;
}

export class ResetPasswordDto {
  @ApiProperty({ example: "newSecret123", description: "Yangi parol" })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
