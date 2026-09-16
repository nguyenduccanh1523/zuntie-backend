import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StaffRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthContext } from '../interfaces/auth-context.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<StaffRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthContext = request.user;

    if (!user || !user.staffRole) {
      throw new ForbiddenException('Access denied: Staff membership role required');
    }

    const hasRole = requiredRoles.includes(user.staffRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Required role [${requiredRoles.join(', ')}], found [${user.staffRole}]`,
      );
    }

    return true;
  }
}
