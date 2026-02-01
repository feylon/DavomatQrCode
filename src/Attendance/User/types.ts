import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsDate, IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { AttendanceStatus } from "types/global.types";

export class GetUserStatsQueryDto {
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

  @ApiPropertyOptional({ 
    enum: AttendanceStatus, 
    description: "Status bo'yicha filter (ixtiyoriy)" 
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}