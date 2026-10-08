import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface VerifiedTokenUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !serviceRoleKey) {
      this.logger.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in env');
    } else {
      this.client = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async verifyToken(token: string): Promise<VerifiedTokenUser> {
    if (!this.client) {
      throw new Error('Supabase client is not initialized');
    }

    // getClaims xác thực chữ ký JWT an toàn. Với dự án dùng khóa bất đối xứng,
    // Supabase chỉ tải JWKS một lần rồi dùng cache cục bộ thay vì gọi Auth cho mọi API.
    const { data, error } = await this.client.auth.getClaims(token);
    const claims = data?.claims;
    if (error || !claims?.sub) {
      throw error || new Error('Phiên đăng nhập không hợp lệ');
    }
    return {
      id: claims.sub,
      email: claims.email || '',
      user_metadata: (claims.user_metadata || {}) as Record<string, unknown>,
    };
  }
}
