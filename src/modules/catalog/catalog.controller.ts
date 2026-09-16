import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CatalogService } from './catalog.service';

@ApiTags('Public Catalog')
@Controller('public/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Get('label-types')
  @ApiOperation({ summary: 'Lấy danh sách các loại nhãn công khai cho Website' })
  async getLabelTypes() {
    const data = await this.catalogService.getPublicLabelTypes();
    return {
      message: 'Lấy danh sách loại nhãn thành công',
      data,
    };
  }

  @Public()
  @Get('materials')
  @ApiOperation({ summary: 'Lấy danh sách chất liệu nhãn công khai cho Website' })
  async getMaterials() {
    const data = await this.catalogService.getPublicMaterials();
    return {
      message: 'Lấy danh sách chất liệu thành công',
      data,
    };
  }
}
