import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness health check endpoint' })
  getHealth() {
    return {
      status: 'ok',
      service: 'zuntie-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('db')
  @ApiOperation({ summary: 'Database connectivity health check' })
  async getDbHealth() {
    try {
      const result = await this.prisma.$queryRaw`SELECT 1 as connected;`;
      return {
        status: 'ok',
        database: 'connected',
        queryResult: result,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        status: 'error',
        database: 'disconnected',
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      };
    }
  }
}
