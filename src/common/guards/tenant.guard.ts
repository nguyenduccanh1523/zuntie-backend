import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthContext } from '../interfaces/auth-context.interface';
import { SKIP_TENANT_KEY } from '../decorators/skip-tenant.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const skipTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (skipTenant) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthContext = request.user;

    if (!user || !user.organizationId) {
      throw new ForbiddenException(
        'Tenant context missing: Request does not belong to a valid Organization',
      );
    }

    return true;
  }
}
