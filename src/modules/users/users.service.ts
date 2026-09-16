import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getStaffMembers(organizationId: string, query: PaginationQueryDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      ...(search && {
        profile: {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const [total, members] = await Promise.all([
      this.prisma.organizationMember.count({ where }),
      this.prisma.organizationMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
              phone: true,
              userType: true,
            },
          },
        },
      }),
    ]);

    return {
      data: members,
      total,
      page,
      limit,
    };
  }
}
