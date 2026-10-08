import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateLabelTypeDto } from './create-label-type.dto';

export class UpdateLabelTypeDto extends PartialType(CreateLabelTypeDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
