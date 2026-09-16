import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { StaffRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthContext } from '../../common/interfaces/auth-context.interface';
import { LeadsService } from './leads.service';
import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { UpdateLeadNoteDto, MarkLeadLostDto } from './dto/update-lead-status.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';

@ApiTags('Leads & Public Quote Request')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Public()
  @Post('public/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Khách truy cập gửi Yêu cầu tư vấn / Báo giá từ Landing Page (Không cần Auth)' })
  async createPublicLead(@Body() dto: CreatePublicLeadDto) {
    const data = await this.leadsService.createPublicLead(dto);
    return {
      message: 'Gửi yêu cầu báo giá thành công. Zuntie sẽ liên hệ với bạn trong thời gian sớm nhất!',
      data,
    };
  }

  @Get()
  @ApiBearerAuth()
  @Roles(StaffRole.ADMIN, StaffRole.SALES)
  @ApiOperation({ summary: 'Staff Sales xem danh sách Lead (Lọc theo trạng thái & phân trang)' })
  async findAll(
    @CurrentUser() user: AuthContext,
    @Query() query: QueryLeadDto,
  ) {
    const paginated = await this.leadsService.findAll(user.organizationId, query);
    return {
      message: 'Lấy danh sách Lead thành công',
      ...paginated,
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles(StaffRole.ADMIN, StaffRole.SALES)
  @ApiOperation({ summary: 'Xem chi tiết Lead & Nhật ký lịch sử chăm sóc' })
  async findOne(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
  ) {
    const data = await this.leadsService.findOne(user.organizationId, id);
    return {
      message: 'Lấy thông tin chi tiết Lead thành công',
      data,
    };
  }

  @Post(':id/assign')
  @ApiBearerAuth()
  @Roles(StaffRole.ADMIN, StaffRole.SALES)
  @ApiOperation({ summary: 'Gán Lead cho nhân viên Sales phụ trách' })
  async assign(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() dto: AssignLeadDto,
  ) {
    const data = await this.leadsService.assign(
      user.organizationId,
      id,
      dto,
      user.userId,
    );
    return {
      message: 'Gán nhân viên phụ trách Lead thành công',
      data,
    };
  }

  @Post(':id/contact')
  @ApiBearerAuth()
  @Roles(StaffRole.ADMIN, StaffRole.SALES)
  @ApiOperation({ summary: 'Đánh dấu Lead đã liên hệ (CONTACTED)' })
  async markContacted(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateLeadNoteDto,
  ) {
    const data = await this.leadsService.markContacted(
      user.organizationId,
      id,
      dto,
      user.userId,
    );
    return {
      message: 'Cập nhật trạng thái Đã liên hệ thành công',
      data,
    };
  }

  @Post(':id/qualify')
  @ApiBearerAuth()
  @Roles(StaffRole.ADMIN, StaffRole.SALES)
  @ApiOperation({ summary: 'Đánh dấu Lead hợp lệ / Nhu cầu rõ ràng (QUALIFIED)' })
  async markQualified(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateLeadNoteDto,
  ) {
    const data = await this.leadsService.markQualified(
      user.organizationId,
      id,
      dto,
      user.userId,
    );
    return {
      message: 'Cập nhật trạng thái Qualified thành công',
      data,
    };
  }

  @Post(':id/lost')
  @ApiBearerAuth()
  @Roles(StaffRole.ADMIN, StaffRole.SALES)
  @ApiOperation({ summary: 'Đánh dấu Lead thất bại kèm lý do (LOST)' })
  async markLost(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() dto: MarkLeadLostDto,
  ) {
    const data = await this.leadsService.markLost(
      user.organizationId,
      id,
      dto,
      user.userId,
    );
    return {
      message: 'Cập nhật trạng thái Thất bại thành công',
      data,
    };
  }

  @Post(':id/convert')
  @ApiBearerAuth()
  @Roles(StaffRole.ADMIN, StaffRole.SALES)
  @ApiOperation({ summary: 'Convert Lead ➔ Customer & Label Project (DB Transaction)' })
  async convert(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Body() dto: ConvertLeadDto,
  ) {
    const data = await this.leadsService.convert(
      user.organizationId,
      id,
      dto,
      user.userId,
    );
    return {
      message: 'Convert Lead thành Khách hàng & Dự án nhãn mác thành công',
      data,
    };
  }
}
