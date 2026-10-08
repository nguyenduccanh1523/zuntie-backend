import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectStatus, UserType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { AuthContext } from '../../common/interfaces/auth-context.interface';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService, private readonly activityService: ActivityService) {}
  private whereFor(user: AuthContext) { return user.userType === UserType.CUSTOMER ? { customerId: user.customerId || '__none__' } : { organizationId: user.organizationId }; }
  async list(user: AuthContext) { return this.prisma.project.findMany({ where: { ...this.whereFor(user), deletedAt: null }, include: { customer: { select: { id: true, name: true, companyName: true } }, ownerUser: { select: { fullName: true } }, requirement: true, _count: { select: { files: true } } }, orderBy: { updatedAt: 'desc' }, take: 100 }); }
  async one(user: AuthContext, id: string) { const project = await this.prisma.project.findFirst({ where: { id, ...this.whereFor(user), deletedAt: null }, include: { customer: true, ownerUser: { select: { fullName: true, email: true } }, requirement: { include: { labelType: true, material: true } }, files: { orderBy: { createdAt: 'desc' }, include: { uploadedByUser: { select: { fullName: true } } } } } }); if (!project) throw new NotFoundException('Không tìm thấy dự án hoặc bạn không có quyền truy cập'); return project; }
  async create(user: AuthContext, body: { customerId: string; name: string; status?: ProjectStatus }) { if (user.userType === UserType.CUSTOMER) throw new ForbiddenException('Khách hàng không thể tự tạo dự án'); const customer = await this.prisma.customer.findFirst({ where: { id: body.customerId, organizationId: user.organizationId, deletedAt: null } }); if (!customer) throw new NotFoundException('Không tìm thấy khách hàng'); const project = await this.prisma.project.create({ data: { organizationId: user.organizationId, customerId: body.customerId, ownerUserId: user.userId, name: body.name, status: body.status || ProjectStatus.DRAFT } }); await this.activityService.log({ organizationId: user.organizationId, actorUserId: user.userId, entityType: 'PROJECT', entityId: project.id, action: 'CREATED' }); return project; }
  async saveRequirement(user: AuthContext, id: string, body: Record<string, unknown>) { const project = await this.one(user, id); const requirement = await this.prisma.projectRequirement.upsert({ where: { projectId: id }, update: body, create: { projectId: id, ...body } }); await this.prisma.project.update({ where: { id }, data: { status: project.status === ProjectStatus.DRAFT ? ProjectStatus.REQUIREMENT_RECEIVED : project.status } }); await this.activityService.log({ organizationId: project.organizationId, actorUserId: user.userId, entityType: 'PROJECT', entityId: id, action: 'REQUIREMENT_SAVED' }); return requirement; }
  async getActivity(user: AuthContext, id: string) { const project = await this.one(user, id); return this.activityService.findByEntity(project.organizationId, 'PROJECT', id); }
}
