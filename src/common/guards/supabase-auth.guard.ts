import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { PrismaService } from '../../database/prisma.service';
import { AuthContext } from '../interfaces/auth-context.interface';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    let token: string | undefined;

    // 1. Check HTTP-only Cookies first
    if (request.cookies) {
      token = request.cookies['access_token'] || request.cookies['sb_access_token'];
    }

    // 2. Fallback to Authorization Bearer header
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new UnauthorizedException(
        'Missing authentication token in HTTP-only Cookie or Authorization Header',
      );
    }

    try {
      const user = await this.supabaseService.verifyToken(token);

      // Fetch profile & membership from Prisma
      let profile = await this.prisma.profile.findUnique({
        where: { id: user.id },
        include: {
          organizationMembers: {
            take: 1,
            include: { organization: true },
          },
          customerUsers: {
            take: 1,
            include: { customer: true },
          },
        },
      });

      // Fallback: If profile doesn't exist yet, auto-provision
      if (!profile) {
        const rootOrg = await this.prisma.organization.findFirst({
          where: { slug: 'zuntie' },
        });

        profile = await this.prisma.profile.create({
          data: {
            id: user.id,
            email: user.email || '',
            fullName: user.user_metadata?.full_name || user.email || 'User',
            avatarUrl: user.user_metadata?.avatar_url,
            userType: 'STAFF',
            ...(rootOrg && {
              organizationMembers: {
                create: {
                  organizationId: rootOrg.id,
                  role: 'ADMIN',
                },
              },
            }),
          },
          include: {
            organizationMembers: {
              take: 1,
              include: { organization: true },
            },
            customerUsers: {
              take: 1,
              include: { customer: true },
            },
          },
        });
      }

      const firstMember = profile.organizationMembers[0];
      const firstCustomerUser = profile.customerUsers[0];

      const authContext: AuthContext = {
        userId: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        userType: profile.userType,
        organizationId:
          firstMember?.organizationId ||
          firstCustomerUser?.customer.organizationId ||
          '',
        staffRole: firstMember?.role,
        customerId: firstCustomerUser?.customerId,
        customerRole: firstCustomerUser?.role,
      };

      (request as any).user = authContext;
      return true;
    } catch (err) {
      throw new UnauthorizedException(
        err instanceof Error
          ? err.message
          : 'Invalid token signature or expired session',
      );
    }
  }
}
