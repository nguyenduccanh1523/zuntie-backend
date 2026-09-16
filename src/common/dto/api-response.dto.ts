import { ApiProperty } from '@nestjs/swagger';

export class ApiMetaDto {
  @ApiProperty({ example: '2026-09-14T20:48:10.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/health' })
  path: string;

  @ApiProperty({ example: 1, required: false })
  page?: number;

  @ApiProperty({ example: 20, required: false })
  limit?: number;

  @ApiProperty({ example: 100, required: false })
  total?: number;

  @ApiProperty({ example: 5, required: false })
  totalPages?: number;
}

export class ApiResponseDto<T> {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Success' })
  message: string;

  data: T;

  @ApiProperty({ type: ApiMetaDto })
  meta: ApiMetaDto;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'BAD_REQUEST' })
  errorCode: string;

  @ApiProperty({ example: 'Validation failed' })
  message: string | string[];

  @ApiProperty({ example: '2026-09-14T20:48:10.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/leads' })
  path: string;
}
