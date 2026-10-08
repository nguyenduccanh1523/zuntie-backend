import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { EmailService } from '../../integrations/email/email.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService, private readonly activity: ActivityService, private readonly emailService: EmailService) {}

  async findAll(organizationId: string, search?: string) {
    return this.prisma.customer.findMany({
      where: { organizationId, deletedAt: null, ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { companyName: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : {}) },
      include: { _count: { select: { projects: true, portalUsers: true } } }, orderBy: { updatedAt: 'desc' }, take: 100,
    });
  }

  async findOne(organizationId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, organizationId, deletedAt: null }, include: { contacts: { orderBy: { isPrimary: 'desc' } }, portalUsers: { include: { profile: { select: { id: true, fullName: true, email: true } } } }, projects: { where: { deletedAt: null }, orderBy: { updatedAt: 'desc' } } } });
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng');
    return customer;
  }

  async create(organizationId: string, actorUserId: string, body: { name: string; companyName?: string; email?: string; phone?: string; notes?: string }) {
    const customer = await this.prisma.customer.create({ data: { organizationId, ...body } });
    await this.activity.log({ organizationId, actorUserId, entityType: 'CUSTOMER', entityId: customer.id, action: 'CREATED' });
    return customer;
  }

  async update(organizationId: string, id: string, body: Record<string, unknown>) {
    await this.findOne(organizationId, id);
    return this.prisma.customer.update({ where: { id }, data: body });
  }

  async invite(organizationId: string, customerId: string, actorUserId: string, email: string) {
    const customer = await this.findOne(organizationId, customerId);
    const profile = await this.prisma.profile.findUnique({ where: { email } });
    if (!profile) throw new NotFoundException('Email này chưa có tài khoản. Khách hàng cần đăng nhập Google hoặc được tạo tài khoản trước.');
    const portalUser = await this.prisma.customerUser.upsert({ where: { customerId_userId: { customerId, userId: profile.id } }, update: { status: 'ACTIVE' }, create: { customerId, userId: profile.id, role: 'OWNER', status: 'ACTIVE' } });
    await this.emailService.sendPortalInvite(email, customer.companyName || customer.name);
    await this.activity.log({ organizationId, actorUserId, entityType: 'CUSTOMER', entityId: customer.id, action: 'CUSTOMER_INVITED', metadata: { email } });
    return portalUser;
  }
}
