import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StaffRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthContext } from '../../common/interfaces/auth-context.interface';
import { CatalogService } from './catalog.service';
import { CreateLabelTypeDto } from './dto/create-label-type.dto';
import { UpdateLabelTypeDto } from './dto/update-label-type.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@ApiTags('Public Catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Get('public/catalog/label-types')
  @ApiOperation({ summary: 'Lấy danh sách các loại nhãn công khai cho Website' })
  async getLabelTypes() {
    const data = await this.catalogService.getPublicLabelTypes();
    return {
      message: 'Lấy danh sách loại nhãn thành công',
      data,
    };
  }

  @Public()
  @Get('public/catalog/materials')
  @ApiOperation({ summary: 'Lấy danh sách chất liệu nhãn công khai cho Website' })
  async getMaterials() {
    const data = await this.catalogService.getPublicMaterials();
    return {
      message: 'Lấy danh sách chất liệu thành công',
      data,
    };
  }

  @Get('catalog/label-types')
  @Roles(StaffRole.ADMIN)
  @ApiOperation({ summary: 'Admin xem toàn bộ loại nhãn, gồm cả mục đang ẩn' })
  async getAdminLabelTypes(@CurrentUser() user: AuthContext) {
    return {
      message: 'Lấy danh sách loại nhãn thành công',
      data: await this.catalogService.getLabelTypes(user.organizationId),
    };
  }

  @Post('catalog/label-types')
  @Roles(StaffRole.ADMIN)
  @ApiOperation({ summary: 'Admin tạo loại nhãn' })
  async createLabelType(@CurrentUser() user: AuthContext, @Body() dto: CreateLabelTypeDto) {
    return {
      message: 'Đã tạo loại nhãn',
      data: await this.catalogService.createLabelType(user.organizationId, dto),
    };
  }

  @Patch('catalog/label-types/:id')
  @Roles(StaffRole.ADMIN)
  @ApiOperation({ summary: 'Admin cập nhật hoặc ẩn/hiện loại nhãn' })
  async updateLabelType(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() dto: UpdateLabelTypeDto) {
    return {
      message: 'Đã cập nhật loại nhãn',
      data: await this.catalogService.updateLabelType(user.organizationId, id, dto),
    };
  }

  @Get('catalog/materials')
  @Roles(StaffRole.ADMIN)
  @ApiOperation({ summary: 'Admin xem toàn bộ chất liệu, gồm cả mục đang ẩn' })
  async getAdminMaterials(@CurrentUser() user: AuthContext) {
    return {
      message: 'Lấy danh sách chất liệu thành công',
      data: await this.catalogService.getMaterials(user.organizationId),
    };
  }

  @Post('catalog/materials')
  @Roles(StaffRole.ADMIN)
  @ApiOperation({ summary: 'Admin tạo chất liệu' })
  async createMaterial(@CurrentUser() user: AuthContext, @Body() dto: CreateMaterialDto) {
    return {
      message: 'Đã tạo chất liệu',
      data: await this.catalogService.createMaterial(user.organizationId, dto),
    };
  }

  @Patch('catalog/materials/:id')
  @Roles(StaffRole.ADMIN)
  @ApiOperation({ summary: 'Admin cập nhật hoặc ẩn/hiện chất liệu' })
  async updateMaterial(@CurrentUser() user: AuthContext, @Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return {
      message: 'Đã cập nhật chất liệu',
      data: await this.catalogService.updateMaterial(user.organizationId, id, dto),
    };
  }
}
