import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthContext } from '../../common/interfaces/auth-context.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập người dùng (Tự động lưu access_token & refresh_token vào HTTP-only Cookies)' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    return this.authService.login(dto, res);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản người dùng mới (Lưu HTTP-only Cookies)' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: any,
  ) {
    return this.authService.register(dto, res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gia hạn phiên đăng nhập bằng HTTP-only Refresh Token' })
  async refreshToken(
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    return this.authService.refreshToken(req, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất tài khoản (Xóa HTTP-only Cookies)' })
  async logout(@Res({ passthrough: true }) res: any) {
    return this.authService.logout(res);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin Profile & Permissions của User đang đăng nhập' })
  async getMe(@CurrentUser() user: AuthContext) {
    const data = await this.authService.getMe(user);
    return {
      message: 'Lấy thông tin tài khoản thành công',
      data,
    };
  }
}
