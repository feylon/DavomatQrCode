import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, ValidateNested } from "class-validator";
import { AttendanceStatus, GO_WORK_STATUS } from "types/global.types";


export class QrCodeDto {
  @ApiProperty({ example: "uuid-owner-id" })
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  owner_id: string;

  @ApiProperty({ example: "uuid-user-id" })
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({ enum: GO_WORK_STATUS })
  @IsEnum(GO_WORK_STATUS)
  status: GO_WORK_STATUS;
}

export class GoWorkDto {
  @ApiProperty({ type: QrCodeDto })
  @ValidateNested()
  @Type(() => QrCodeDto)
  qr_code: QrCodeDto;

  @ApiProperty({ example: "My Company" })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({ enum: GO_WORK_STATUS })
  @IsEnum(GO_WORK_STATUS)
  status: GO_WORK_STATUS;
}




export class MarkAbsenceDto {
  @ApiProperty({ example: "user-uuid-here", description: "Xodim IDsi" })
  @IsUUID()
  user_id: string;

  @ApiProperty({ 
    enum: AttendanceStatus, 
    example: AttendanceStatus.EXCUSED, 
    description: "Holati: EXCUSED (Sababli), ABSENT (Sababsiz), ON_LEAVE (Ta'til)" 
  })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({ example: "Mazasi yo'q edi", description: "Kelmaslik sababi", required: false })
  @IsString()
  @IsOptional() // ABSENT bo'lsa sabab yozmasligi ham mumkin
  reason?: string;
}


export class GetAttendanceStatsQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Sahifa raqami" })
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

  @ApiPropertyOptional({ description: "Boshlanish sanasi (YYYY-MM-DD)", example: "2023-10-01" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: "Tugash sanasi (YYYY-MM-DD)", example: "2023-10-31" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ description: "Ism yoki familiya bo'yicha qidiruv" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    enum: AttendanceStatus, 
    description: "Faqat shu statusdagilarni olish (ixtiyoriy)" 
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}