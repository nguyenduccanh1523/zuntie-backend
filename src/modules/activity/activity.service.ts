import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface LogActivityDto {
  organizationId: string;
  actorUserId?: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: any;
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(dto: LogActivityDto) {
    try {
      return await this.prisma.activityLog.create({
        data: {
          organizationId: dto.organizationId,
          actorUserId: dto.actorUserId,
          entityType: dto.entityType,
          entityId: dto.entityId,
          action: dto.action,
          metadata: dto.metadata,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to record activity log: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async findByEntity(organizationId: string, entityType: string, entityId: string) {
    return this.prisma.activityLog.findMany({
      where: { organizationId, entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        actorUser: {
          select: { id: true, fullName: true, avatarUrl: true, email: true },
        },
      },
    });
  }
}
