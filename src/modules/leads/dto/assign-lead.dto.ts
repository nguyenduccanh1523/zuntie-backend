import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignLeadDto {
  @ApiProperty({ example: '8641a34b-61a5-4e3f-81fe-da8bde15a87e', description: 'ID của nhân viên Sales phụ trách' })
  @IsNotEmpty({ message: 'assignedUserId không được để trống' })
  @IsUUID('4', { message: 'assignedUserId phải là định dạng UUID' })
  assignedUserId: string;
}
