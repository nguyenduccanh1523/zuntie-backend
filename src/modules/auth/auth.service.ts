import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { AuthContext } from '../../common/interfaces/auth-context.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  /**
   * Helper to set HTTP-only cookies for JWT Access Token & Refresh Token
   */
  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    expiresIn: number = 604800,
  ) {
    const isProd = process.env.NODE_ENV === 'production';

    // Access Token Cookie (Short/Medium lived)
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: expiresIn * 1000,
      path: '/',
    });

    // Refresh Token Cookie (Long lived, e.g. 30 days)
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  /**
   * Helper to clear auth cookies
   */
  private clearAuthCookies(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as any,
      path: '/',
    };
    res.clearCookie('access_token', cookieOpts);
    res.clearCookie('refresh_token', cookieOpts);
  }

  async login(dto: LoginDto, res: Response) {
    const supabase = this.supabaseService.getClient();

    let result;
    try {
      result = await supabase.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });
    } catch {
      this.throwSupabaseUnavailable();
    }
    const { data, error } = result!;

    if (error && this.isSupabaseConnectionError(error)) this.throwSupabaseUnavailable();
    if (error || !data.session) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const { user, session } = data;

    // Set HTTP-only Cookies
    this.setAuthCookies(
      res,
      session.access_token,
      session.refresh_token,
      session.expires_in || 604800,
    );

    // Fetch or create profile in Prisma
    let profile = await this.prisma.profile.findUnique({
      where: { id: user.id },
      include: {
        organizationMembers: {
          take: 1,
          include: { organization: true },
        },
      },
    });

    if (!profile) {
      const rootOrg = await this.prisma.organization.findFirst({
        where: { slug: 'zuntie' },
      });

      profile = await this.prisma.profile.create({
        data: {
          id: user.id,
          email: user.email || dto.email,
          fullName: user.user_metadata?.full_name || dto.email,
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
        },
      });
    }

    return {
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: profile.id,
          fullName: profile.fullName,
          email: profile.email,
          userType: profile.userType,
          organizationId: profile.organizationMembers[0]?.organizationId || null,
          staffRole: profile.organizationMembers[0]?.role || null,
        },
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      },
    };
  }

  async getGoogleLoginUrl(returnUrl?: string) {
    const callback = process.env.GOOGLE_OAUTH_REDIRECT_URL || `${process.env.APP_BASE_URL || 'http://localhost:1911'}/api/v1/auth/google/callback`;
    const safeReturnUrl = this.getSafeReturnUrl(returnUrl);
    const redirectTo = `${callback}?returnUrl=${encodeURIComponent(safeReturnUrl)}`;
    let result;
    try {
      result = await this.supabaseService.getClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
    } catch {
      this.throwSupabaseUnavailable();
    }
    const { data, error } = result!;
    if (error && this.isSupabaseConnectionError(error)) this.throwSupabaseUnavailable();
    if (error || !data.url) throw new BadRequestException('Không thể khởi tạo đăng nhập Google. Vui lòng kiểm tra cấu hình Google trong Supabase.');
    return data.url;
  }

  async completeGoogleLogin(code: string | undefined, returnUrl: string | undefined, res: Response) {
    if (!code) throw new BadRequestException('Thiếu mã xác thực Google');
    const { data, error } = await this.supabaseService.getClient().auth.exchangeCodeForSession(code);
    if (error || !data.session || !data.user) throw new UnauthorizedException('Không thể xác thực tài khoản Google. Vui lòng thử lại.');
    await this.ensureCustomerProfile(data.user.id, data.user.email || '', data.user.user_metadata?.full_name);
    this.setAuthCookies(res, data.session.access_token, data.session.refresh_token, data.session.expires_in || 604800);
    return this.getSafeReturnUrl(returnUrl);
  }

  private throwSupabaseUnavailable(): never {
    throw new ServiceUnavailableException({
      errorCode: 'SUPABASE_AUTH_UNREACHABLE',
      message: 'Không thể kết nối Supabase Auth. Hãy kiểm tra SUPABASE_URL trong .env, trạng thái dự án Supabase và kết nối DNS/mạng.',
    });
  }

  private isSupabaseConnectionError(error: { message?: string; status?: number }) {
    return error.status === 0 || error.message?.toLowerCase().includes('fetch failed');
  }

  private getSafeReturnUrl(returnUrl?: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!returnUrl) return `${frontendUrl}/portal`;
    try {
      const parsed = new URL(returnUrl);
      return parsed.origin === frontendUrl ? returnUrl : `${frontendUrl}/portal`;
    } catch {
      return `${frontendUrl}/portal`;
    }
  }

  private async ensureCustomerProfile(userId: string, email: string, fullName?: string) {
    const profile = await this.prisma.profile.upsert({
      where: { id: userId },
      update: { email, fullName: fullName || email, userType: 'CUSTOMER' },
      create: { id: userId, email, fullName: fullName || email, userType: 'CUSTOMER' },
    });
    const customer = await this.prisma.customer.findFirst({ where: { email } });
    if (customer) {
      await this.prisma.customerUser.upsert({
        where: { customerId_userId: { customerId: customer.id, userId: profile.id } },
        update: { status: 'ACTIVE' },
        create: { customerId: customer.id, userId: profile.id, role: 'OWNER', status: 'ACTIVE' },
      });
    }
    return profile;
  }

  async register(dto: RegisterDto, res: Response) {
    const supabase = this.supabaseService.getClient();

    const existingProfile = await this.prisma.profile.findUnique({
      where: { email: dto.email },
    });

    if (existingProfile) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống');
    }

    const { data, error } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          full_name: dto.fullName,
        },
      },
    });

    if (error || !data.user) {
      throw new BadRequestException(
        error?.message || 'Đăng ký tài khoản thất bại',
      );
    }

    const user = data.user;
    const session = data.session;

    const rootOrg = await this.prisma.organization.findFirst({
      where: { slug: 'zuntie' },
    });

    const profile = await this.prisma.profile.create({
      data: {
        id: user.id,
        email: dto.email,
        fullName: dto.fullName,
        phone: dto.phone,
        userType: 'STAFF',
        ...(rootOrg && {
          organizationMembers: {
            create: {
              organizationId: rootOrg.id,
              role: 'SALES',
            },
          },
        }),
      },
      include: {
        organizationMembers: {
          take: 1,
          include: { organization: true },
        },
      },
    });

    if (session) {
      this.setAuthCookies(
        res,
        session.access_token,
        session.refresh_token,
        session.expires_in || 604800,
      );
    }

    return {
      message: 'Đăng ký tài khoản thành công',
      data: {
        user: {
          id: profile.id,
          fullName: profile.fullName,
          email: profile.email,
          userType: profile.userType,
          organizationId: profile.organizationMembers[0]?.organizationId || null,
          staffRole: profile.organizationMembers[0]?.role || null,
        },
        accessToken: session?.access_token || null,
        refreshToken: session?.refresh_token || null,
      },
    };
  }

  async refreshToken(req: Request, res: Response) {
    const supabase = this.supabaseService.getClient();

    let refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken && req.body?.refreshToken) {
      refreshToken = req.body.refreshToken;
    }

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token không tồn tại');
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException(
        error?.message || 'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    const { session } = data;
    this.setAuthCookies(
      res,
      session.access_token,
      session.refresh_token,
      session.expires_in || 604800,
    );

    return {
      message: 'Gia hạn phiên đăng nhập thành công',
      data: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      },
    };
  }

  async logout(res: Response) {
    this.clearAuthCookies(res);
    return {
      message: 'Đăng xuất thành công',
    };
  }

  async getMe(authContext: AuthContext) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: authContext.userId },
      include: {
        organizationMembers: {
          include: {
            organization: {
              select: { id: true, name: true, slug: true, status: true },
            },
          },
        },
        customerUsers: {
          include: {
            customer: {
              select: { id: true, name: true, companyName: true },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile không tồn tại trong hệ thống');
    }

    return {
      profile: {
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        phone: profile.phone,
        userType: profile.userType,
        createdAt: profile.createdAt,
      },
      authContext,
      memberships: profile.organizationMembers,
      customerAccess: profile.customerUsers,
    };
  }
}
