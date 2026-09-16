import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            members: true,
            leads: true,
            customers: true,
            projects: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization ID ${organizationId} không tồn tại`);
    }

    return org;
  }
}
