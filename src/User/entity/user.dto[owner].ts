import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

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
  limit?: number = 10;

  @ApiPropertyOptional({
    example: "ali",
    description: "firstname/lastname/middlname bo‘yicha ILIKE qidiruv",
  })
  @IsOptional()
  @IsString()
  search?: string;
}
