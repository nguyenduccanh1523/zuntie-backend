import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateMaterialDto {
  @ApiProperty({ example: 'Vải satin' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'vai-satin' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Đường dẫn chỉ dùng chữ thường, số và dấu gạch ngang' })
  slug: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
