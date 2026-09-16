import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { LeadStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryLeadDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: LeadStatus, description: 'Lọc theo trạng thái Lead' })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ example: '8641a34b-61a5-4e3f-81fe-da8bde15a87e', description: 'Lọc theo nhân viên Sales phụ trách' })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;
}
