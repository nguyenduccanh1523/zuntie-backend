import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConvertLeadDto {
  @ApiProperty({ example: 'Công ty TNHH Mật Ong ABC', description: 'Tên tài khoản Khách hàng' })
  @IsNotEmpty({ message: 'Tên tài khoản Khách hàng không được để trống' })
  @IsString()
  customerName: string;

  @ApiPropertyOptional({ example: 'Công ty TNHH Mật Ong ABC', description: 'Tên công ty' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ example: 'Dự án Nhãn cuộn Chai Mật Ong 500ml', description: 'Tên Dự án nhãn mác sẽ tạo' })
  @IsNotEmpty({ message: 'Tên Dự án không được để trống' })
  @IsString()
  projectName: string;

  @ApiPropertyOptional({ example: 'Khách yêu cầu mẫu thiết kế nhãn sang trọng tông màu vàng đen', description: 'Ghi chú ban đầu của dự án' })
  @IsOptional()
  @IsString()
  notes?: string;
}
