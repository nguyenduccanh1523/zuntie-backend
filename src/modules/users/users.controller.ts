import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { StaffRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthContext } from '../../common/interfaces/auth-context.interface';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { UsersService } from './users.service';

@ApiTags('Users & Staff')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('staff')
  @Roles(StaffRole.ADMIN, StaffRole.SALES)
  @ApiOperation({ summary: 'Lấy danh sách nhân viên Staff trong Organization' })
  async getStaffMembers(
    @CurrentUser() user: AuthContext,
    @Query() query: PaginationQueryDto,
  ) {
    const paginated = await this.usersService.getStaffMembers(user.organizationId, query);
    return {
      message: 'Lấy danh sách nhân viên thành công',
      ...paginated,
    };
  }
}
