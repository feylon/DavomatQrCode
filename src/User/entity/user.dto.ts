import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
    IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from "class-validator";

export class AddOwnerAdminDto {
  @ApiProperty({ example: `admin${Math.trunc(Math.random() * 1000)}` })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ example: "admin01" })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: `Ismi${Math.trunc(Math.random() * 1000)}` })
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({ example: `Familiya${Math.trunc(Math.random() * 1000)}` })
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty({ example: `Otasini ismi${Math.trunc(Math.random() * 1000)}` })
  @IsString()
  @IsNotEmpty()
  middlname: string;

  @ApiProperty({ example: `admin${Math.trunc(Math.random() * 1000)}@mail.com` })
  @IsEmail()
  email: string;

  @ApiProperty({ example: `Company${Math.trunc(Math.random() * 1000)}` })
  @IsString()
  @IsNotEmpty()
  company: string;
}




export class GetOwnersQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Sahifa raqami (1 dan boshlanadi)" })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: "Har sahifada nechta" })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: "ali",
    description: "firstname/lastname/middlname bo‘yicha qidiruv (ILIKE)",
  })
  @IsOptional()
  @IsString()
  search?: string;
}


// Patch


export class UpdateOwnerAdminDto {
  @ApiPropertyOptional({ example: "admin123" })
  @IsOptional()
  @IsString()
  login?: string;



  @ApiPropertyOptional({ example: "Ismi" })
  @IsOptional()
  @IsString()
  firstname?: string;

  @ApiPropertyOptional({ example: "Familiya" })
  @IsOptional()
  @IsString()
  lastname?: string;

  @ApiPropertyOptional({ example: "Otasini ismi" })
  @IsOptional()
  @IsString()
  middlname?: string;

  @ApiPropertyOptional({ example: "admin@mail.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "OpenAI LLC" })
  @IsOptional()
  @IsString()
  company?: string;

   @ApiPropertyOptional({
    example: true,
    description: "Userni bloklash yoki ochish",
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  isBlock?: boolean;
}


// Add user 

export class CreateUserByAdminDto {
  @ApiProperty({ example: "3c2a1d3f-7b2a-4b7f-9df0-2c3d8b9a1111", description: "OWNER id" })
  @IsUUID()
  ownerId: string;

  @ApiProperty({ example: `user${Math.trunc(Math.random() * 1000)}` })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ example: "admin01"})
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

  @ApiProperty({ example: "Otabekovich", required: false })
  @IsOptional()
  @IsString()
  middlname?: string;

  @ApiProperty({ example: `user${Math.trunc(Math.random() * 1000)}@mail.com` })
  @IsEmail()
  email: string;
}

// UpdateUser user

export class UpdateUserAdminDto {
  @ApiPropertyOptional({ example: "user123" })
  @IsOptional()
  @IsString()
  login?: string;

  @ApiPropertyOptional({ example: "Ali" })
  @IsOptional()
  @IsString()
  firstname?: string;

  @ApiPropertyOptional({ example: "Valiyev" })
  @IsOptional()
  @IsString()
  lastname?: string;

  @ApiPropertyOptional({ example: "Otabekovich" })
  @IsOptional()
  @IsString()
  middlname?: string;

  @ApiPropertyOptional({ example: "user123@mail.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: "3c2a1d3f-7b2a-4b7f-9df0-2c3d8b9a1111",
    description: "Userni boshqa ownerga biriktirish (ixtiyoriy)",
  })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ example: true, description: "Bloklash/ochish" })
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  isBlock?: boolean;
}


// User uchun get search
export class GetUsersQueryDto {
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
  limit?: number = 10;

  @ApiPropertyOptional({
    example: "ali",
    description: "firstname/lastname/middlname bo‘yicha ILIKE qidiruv",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: "3c2a1d3f-7b2a-4b7f-9df0-2c3d8b9a1111",
    description: "Owner ID bo‘yicha filter",
  })
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
