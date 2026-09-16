import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePublicLeadDto {
  @ApiProperty({ example: 'Nguyễn Văn Nam', description: 'Tên người liên hệ' })
  @IsNotEmpty({ message: 'Tên người liên hệ không được để trống' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Công ty Nhãn mác ABC', description: 'Tên công ty / thương hiệu' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'nam.nguyen@abc.com', description: 'Email liên hệ' })
  @IsOptional()
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email?: string;

  @ApiPropertyOptional({ example: '0908889999', description: 'Số điện thoại' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Tôi cần báo giá 10,000 nhãn cuộn decal nhựa dán chai mật ong', description: 'Lời nhắn nhu cầu' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ example: 'Website Form', description: 'Nguồn lead (Form CTA, Live Chat, Direct)' })
  @IsOptional()
  @IsString()
  source?: string = 'Website Form';

  @ApiPropertyOptional({ example: 'google', description: 'UTM Source' })
  @IsOptional()
  @IsString()
  utmSource?: string;

  @ApiPropertyOptional({ example: 'cpc', description: 'UTM Medium' })
  @IsOptional()
  @IsString()
  utmMedium?: string;

  @ApiPropertyOptional({ example: 'campaign_label_2026', description: 'UTM Campaign' })
  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @ApiPropertyOptional({ example: '/bao-gia-nhan-cuon', description: 'Trang landing page khách truy cập' })
  @IsOptional()
  @IsString()
  landingPage?: string;

  @ApiPropertyOptional({ example: 'https://google.com', description: 'Nguồn giới thiệu' })
  @IsOptional()
  @IsString()
  referrer?: string;
}
