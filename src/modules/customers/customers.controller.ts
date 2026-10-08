import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthContext } from '../../common/interfaces/auth-context.interface';
import { CustomersService } from './customers.service';

@Controller('customers')
@Roles(StaffRole.ADMIN, StaffRole.SALES)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}
  @Get() async all(@CurrentUser() user: AuthContext, @Query('search') search?: string) { return { message: 'Lấy danh sách khách hàng thành công', data: await this.customers.findAll(user.organizationId, search) }; }
  @Post() async create(@CurrentUser() user: AuthContext, @Body() body: { name: string; companyName?: string; email?: string; phone?: string; notes?: string }) { return { message: 'Đã tạo khách hàng', data: await this.customers.create(user.organizationId, user.userId, body) }; }
  @Get(':id') async one(@CurrentUser() user: AuthContext, @Param('id') id: string) { return { message: 'Lấy thông tin khách hàng thành công', data: await this.customers.findOne(user.organizationId, id) }; }
  @Patch(':id') async update(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() body: Record<string, unknown>) { return { message: 'Đã cập nhật khách hàng', data: await this.customers.update(user.organizationId, id, body) }; }
  @Post(':id/invite') async invite(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body('email') email: string) { return { message: 'Đã cấp quyền cổng khách hàng', data: await this.customers.invite(user.organizationId, id, user.userId, email) }; }
}
