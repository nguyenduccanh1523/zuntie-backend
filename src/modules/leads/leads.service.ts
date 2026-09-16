import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { UpdateLeadNoteDto, MarkLeadLostDto } from './dto/update-lead-status.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { LeadStatus } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  /**
   * Public Visitor submits inquiry / quote request from Landing Page
   */
  async createPublicLead(dto: CreatePublicLeadDto) {
    // Find Zuntie Root Organization
    const rootOrg = await this.prisma.organization.findFirst({
      where: { slug: 'zuntie' },
    });

    if (!rootOrg) {
      throw new BadRequestException('Chưa khởi tạo Organization Zuntie mặc định');
    }

    const lead = await this.prisma.lead.create({
      data: {
        organizationId: rootOrg.id,
        name: dto.name,
        companyName: dto.companyName,
        email: dto.email,
        phone: dto.phone,
        message: dto.message,
        source: dto.source || 'Website Form',
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        utmCampaign: dto.utmCampaign,
        landingPage: dto.landingPage,
        referrer: dto.referrer,
        status: LeadStatus.NEW,
      },
    });

    // Record activity
    await this.activityService.log({
      organizationId: rootOrg.id,
      entityType: 'LEAD',
      entityId: lead.id,
      action: 'SUBMITTED',
      metadata: {
        source: dto.source,
        messageSnippet: dto.message?.slice(0, 100),
      },
    });

    return lead;
  }

  /**
   * Sales Staff queries leads with filters & pagination
   */
  async findAll(organizationId: string, query: QueryLeadDto) {
    const { page = 1, limit = 20, search, status, assignedUserId } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      ...(status && { status }),
      ...(assignedUserId && { assignedUserId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedUser: {
            select: { id: true, fullName: true, avatarUrl: true, email: true },
          },
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Find single lead detail + timeline activities
   */
  async findOne(organizationId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId },
      include: {
        assignedUser: {
          select: { id: true, fullName: true, avatarUrl: true, email: true },
        },
        convertedCustomer: {
          select: { id: true, name: true, companyName: true },
        },
        convertedProject: {
          select: { id: true, name: true, status: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            actorUser: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead ID ${id} không tồn tại`);
    }

    return lead;
  }

  /**
   * Assign Lead to Sales staff
   */
  async assign(organizationId: string, id: string, dto: AssignLeadDto, actorUserId: string) {
    const lead = await this.findOne(organizationId, id);

    const staffProfile = await this.prisma.profile.findUnique({
      where: { id: dto.assignedUserId },
    });

    if (!staffProfile) {
      throw new NotFoundException('Nhân viên được gán không tồn tại');
    }

    const updated = await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        assignedUserId: dto.assignedUserId,
      },
    });

    await this.activityService.log({
      organizationId,
      actorUserId,
      entityType: 'LEAD',
      entityId: lead.id,
      action: 'ASSIGNED',
      metadata: {
        assignedUserId: dto.assignedUserId,
        assignedUserName: staffProfile.fullName,
      },
    });

    return updated;
  }

  /**
   * Mark Lead as Contacted
   */
  async markContacted(organizationId: string, id: string, dto: UpdateLeadNoteDto, actorUserId: string) {
    const lead = await this.findOne(organizationId, id);

    const updated = await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: LeadStatus.CONTACTED,
      },
    });

    await this.activityService.log({
      organizationId,
      actorUserId,
      entityType: 'LEAD',
      entityId: lead.id,
      action: 'CONTACTED',
      metadata: { note: dto.note },
    });

    return updated;
  }

  /**
   * Mark Lead as Qualified
   */
  async markQualified(organizationId: string, id: string, dto: UpdateLeadNoteDto, actorUserId: string) {
    const lead = await this.findOne(organizationId, id);

    const updated = await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: LeadStatus.QUALIFIED,
      },
    });

    await this.activityService.log({
      organizationId,
      actorUserId,
      entityType: 'LEAD',
      entityId: lead.id,
      action: 'QUALIFIED',
      metadata: { note: dto.note },
    });

    return updated;
  }

  /**
   * Mark Lead as Lost
   */
  async markLost(organizationId: string, id: string, dto: MarkLeadLostDto, actorUserId: string) {
    const lead = await this.findOne(organizationId, id);

    const updated = await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: LeadStatus.LOST,
      },
    });

    await this.activityService.log({
      organizationId,
      actorUserId,
      entityType: 'LEAD',
      entityId: lead.id,
      action: 'LOST',
      metadata: { reason: dto.reason },
    });

    return updated;
  }

  /**
   * Convert Lead ➔ Customer ➔ Project in a single Database Transaction
   */
  async convert(organizationId: string, id: string, dto: ConvertLeadDto, actorUserId: string) {
    const lead = await this.findOne(organizationId, id);

    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Lead này đã được Convert trước đó');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Customer
      const customer = await tx.customer.create({
        data: {
          organizationId,
          name: dto.customerName,
          companyName: dto.companyName || lead.companyName,
          email: lead.email,
          phone: lead.phone,
          notes: dto.notes || lead.message,
          contacts: {
            create: {
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              isPrimary: true,
            },
          },
        },
      });

      // 2. Create Label Project
      const project = await tx.project.create({
        data: {
          organizationId,
          customerId: customer.id,
          ownerUserId: actorUserId,
          name: dto.projectName,
          status: 'DRAFT',
          requirement: {
            create: {
              extraData: {
                initialNote: dto.notes || lead.message,
              },
            },
          },
        },
      });

      // 3. Update Lead status to CONVERTED and link IDs
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: LeadStatus.CONVERTED,
          convertedCustomerId: customer.id,
          convertedProjectId: project.id,
        },
      });

      // 4. Record Activity Log
      await tx.activityLog.create({
        data: {
          organizationId,
          actorUserId,
          entityType: 'LEAD',
          entityId: lead.id,
          action: 'CONVERTED',
          metadata: {
            customerId: customer.id,
            customerName: customer.name,
            projectId: project.id,
            projectName: project.name,
          },
        },
      });

      return {
        lead: updatedLead,
        customer,
        project,
      };
    });
  }
}
