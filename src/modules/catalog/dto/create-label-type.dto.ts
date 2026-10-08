import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateLabelTypeDto {
  @ApiProperty({ example: 'Nhãn dệt' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'nhan-det' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Đường dẫn chỉ dùng chữ thường, số và dấu gạch ngang' })
  slug: string;

  @ApiPropertyOptional({ example: 'Nhãn dệt mềm, bền màu cho thời trang.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
