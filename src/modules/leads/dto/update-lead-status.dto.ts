import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateLeadNoteDto {
  @ApiPropertyOptional({ example: 'Đã gọi điện tư vấn loại nhãn dán chai lọ nhựa 500ml', description: 'Ghi chú chăm sóc' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class MarkLeadLostDto {
  @ApiPropertyOptional({ example: 'Khách đổi ý sang mua tem in sẵn chợ, giá chưa cạnh tranh', description: 'Lý do thất bại' })
  @IsOptional()
  @IsString()
  reason?: string;
}
