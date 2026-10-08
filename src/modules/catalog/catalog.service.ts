import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLabelTypeDto } from './dto/create-label-type.dto';
import { UpdateLabelTypeDto } from './dto/update-label-type.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class CatalogService {
  private readonly publicCatalogCacheTtlMs = 5 * 60 * 1000;
  private labelTypesCache?: {
    expiresAt: number;
    data: Array<{ id: string; name: string; slug: string; description: string | null }>;
  };
  private materialsCache?: {
    expiresAt: number;
    data: Array<{ id: string; name: string; slug: string; propertiesJson: unknown }>;
  };

  constructor(private readonly prisma: PrismaService) {}

  async getPublicLabelTypes() {
    if (this.labelTypesCache && this.labelTypesCache.expiresAt > Date.now()) {
      return this.labelTypesCache.data;
    }

    const data = await this.prisma.labelType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });
    this.labelTypesCache = { data, expiresAt: Date.now() + this.publicCatalogCacheTtlMs };
    return data;
  }

  async getPublicMaterials() {
    if (this.materialsCache && this.materialsCache.expiresAt > Date.now()) {
      return this.materialsCache.data;
    }

    const data = await this.prisma.material.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        propertiesJson: true,
      },
    });
    this.materialsCache = { data, expiresAt: Date.now() + this.publicCatalogCacheTtlMs };
    return data;
  }

  async getLabelTypes(organizationId: string) {
    return this.prisma.labelType.findMany({
      where: { organizationId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createLabelType(organizationId: string, dto: CreateLabelTypeDto) {
    const data = await this.prisma.labelType.create({ data: { ...dto, organizationId } });
    this.labelTypesCache = undefined;
    return data;
  }

  async updateLabelType(organizationId: string, id: string, dto: UpdateLabelTypeDto) {
    await this.ensureLabelType(organizationId, id);
    const data = await this.prisma.labelType.update({ where: { id }, data: dto });
    this.labelTypesCache = undefined;
    return data;
  }

  async getMaterials(organizationId: string) {
    return this.prisma.material.findMany({
      where: { organizationId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createMaterial(organizationId: string, dto: CreateMaterialDto) {
    const data = await this.prisma.material.create({ data: { ...dto, organizationId } });
    this.materialsCache = undefined;
    return data;
  }

  async updateMaterial(organizationId: string, id: string, dto: UpdateMaterialDto) {
    await this.ensureMaterial(organizationId, id);
    const data = await this.prisma.material.update({ where: { id }, data: dto });
    this.materialsCache = undefined;
    return data;
  }

  private async ensureLabelType(organizationId: string, id: string) {
    const item = await this.prisma.labelType.findFirst({ where: { id, organizationId } });
    if (!item) throw new NotFoundException('Không tìm thấy loại nhãn');
  }

  private async ensureMaterial(organizationId: string, id: string) {
    const item = await this.prisma.material.findFirst({ where: { id, organizationId } });
    if (!item) throw new NotFoundException('Không tìm thấy chất liệu');
  }
}
