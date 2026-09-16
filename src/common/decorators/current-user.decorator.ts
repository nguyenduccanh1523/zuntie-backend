import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthContext } from '../interfaces/auth-context.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthContext = request.user;
    return data ? user?.[data] : user;
  },
);