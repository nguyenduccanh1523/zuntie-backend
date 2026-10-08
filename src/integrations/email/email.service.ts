import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
@Injectable() export class EmailService { private readonly logger=new Logger(EmailService.name); private readonly resend: Resend; private readonly from: string;
 constructor(config:ConfigService){const key=config.get<string>('RESEND_API_KEY');this.from=config.get<string>('MAIL_FROM')||'';if(!key||!this.from) throw new ServiceUnavailableException('Thiếu RESEND_API_KEY hoặc MAIL_FROM');this.resend=new Resend(key)}
 async sendPortalInvite(to:string, customerName:string){const url=`${process.env.FRONTEND_URL||'http://localhost:3000'}/login`;const {error}=await this.resend.emails.send({from:this.from,to,subject:'Bạn được mời vào Cổng khách hàng Zuntie',html:`<h2>Chào ${customerName},</h2><p>Bạn đã được cấp quyền theo dõi dự án nhãn mác trên Zuntie.</p><p><a href="${url}">Đăng nhập để xem dự án</a></p>`});if(error){this.logger.error(error.message);throw new ServiceUnavailableException('Không thể gửi email mời. Hãy kiểm tra MAIL_FROM đã được xác minh trên Resend.')}} }
