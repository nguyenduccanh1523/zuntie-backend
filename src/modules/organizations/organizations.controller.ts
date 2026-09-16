import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { StaffRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthContext } from '../../common/interfaces/auth-context.interface';
import { OrganizationsService } from './organizations.service';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('current')
  @Roles(StaffRole.ADMIN, StaffRole.SALES)
  @ApiOperation({ summary: 'Lấy thông tin Organization hiện tại của Staff' })
  async getCurrentOrg(@CurrentUser() user: AuthContext) {
    const data = await this.organizationsService.findById(user.organizationId);
    return {
      message: 'Lấy thông tin Organization thành công',
      data,
    };
  }
}
