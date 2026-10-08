import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthContext } from '../../common/interfaces/auth-context.interface';
import { ProjectsService } from './projects.service';
import { Roles } from '../../common/decorators/roles.decorator';
@Controller('projects') export class ProjectsController { constructor(private readonly projects: ProjectsService) {}
 @Get() async list(@CurrentUser() u: AuthContext) { return { message: 'Lấy danh sách dự án thành công', data: await this.projects.list(u) }; }
 @Post() @Roles(StaffRole.ADMIN, StaffRole.SALES) async create(@CurrentUser() u: AuthContext, @Body() b: any) { return { message: 'Đã tạo dự án', data: await this.projects.create(u, b) }; }
 @Get(':id') async one(@CurrentUser() u: AuthContext, @Param('id') id: string) { return { message: 'Lấy thông tin dự án thành công', data: await this.projects.one(u, id) }; }
 @Put(':id/requirement') async requirement(@CurrentUser() u: AuthContext, @Param('id') id: string, @Body() b: any) { return { message: 'Đã lưu yêu cầu', data: await this.projects.saveRequirement(u, id, b) }; }
 @Get(':id/activity') async activity(@CurrentUser() u: AuthContext, @Param('id') id: string) { return { message: 'Lấy lịch sử dự án thành công', data: await this.projects.getActivity(u, id) }; }
}
