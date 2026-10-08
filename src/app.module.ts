import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './database/prisma.module';
import { SupabaseModule } from './integrations/supabase/supabase.module';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantGuard } from './common/guards/tenant.guard';

import { HealthModule } from './modules/health/health.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';
import { ActivityModule } from './modules/activity/activity.module';
import { LeadsModule } from './modules/leads/leads.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { CloudinaryModule } from './integrations/cloudinary/cloudinary.module';
import { EmailModule } from './integrations/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SupabaseModule,
    ActivityModule,
    HealthModule,
    CatalogModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    LeadsModule,
    CustomersModule,
    ProjectsModule,
    CloudinaryModule,
    EmailModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule {}
