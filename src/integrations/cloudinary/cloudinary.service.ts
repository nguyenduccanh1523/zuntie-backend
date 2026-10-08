import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(config: ConfigService) {
    cloudinary.config({ cloud_name: config.get('CLOUDINARY_CLOUD_NAME'), api_key: config.get('CLOUDINARY_API_KEY'), api_secret: config.get('CLOUDINARY_API_SECRET'), secure: true });
  }
  upload(buffer: Buffer, folder: string, fileName: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => cloudinary.uploader.upload_stream({ folder, resource_type: 'auto', public_id: fileName.replace(/[^a-zA-Z0-9_-]/g, '_'), overwrite: false }, (error, result) => error || !result ? reject(error || new Error('Upload thất bại')) : resolve(result)).end(buffer));
  }
}
