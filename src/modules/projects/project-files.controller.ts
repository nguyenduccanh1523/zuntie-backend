import { BadRequestException, Controller, Get, Param, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileType } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthContext } from '../../common/interfaces/auth-context.interface';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryService } from '../../integrations/cloudinary/cloudinary.service';
import { ProjectsService } from './projects.service';
type UploadedProjectFile = { buffer: Buffer; originalname: string; mimetype: string; size: number };

@Controller('projects/:projectId/files')
export class ProjectFilesController {
  constructor(private readonly projects: ProjectsService, private readonly prisma: PrismaService, private readonly cloudinary: CloudinaryService) {}
  @Get() async list(@CurrentUser() user: AuthContext, @Param('projectId') projectId: string) { const project = await this.projects.one(user, projectId); return { message: 'Lấy tệp dự án thành công', data: await this.prisma.projectFile.findMany({ where: { projectId: project.id }, orderBy: { createdAt: 'desc' } }) }; }
  @Post() @UseInterceptors(FilesInterceptor('files', 5, { limits: { fileSize: 10 * 1024 * 1024 } })) async upload(@CurrentUser() user: AuthContext, @Param('projectId') projectId: string, @UploadedFiles() files: UploadedProjectFile[]) { const project = await this.projects.one(user, projectId); if (!files?.length) throw new BadRequestException('Vui lòng chọn ít nhất một tệp, tối đa 10 MB mỗi tệp'); const data = await Promise.all(files.map(async file => { const result = await this.cloudinary.upload(file.buffer, `zuntie/projects/${project.id}`, file.originalname); return this.prisma.projectFile.create({ data: { organizationId: project.organizationId, projectId: project.id, storagePath: result.secure_url, fileName: file.originalname, fileType: FileType.OTHER, mimeType: file.mimetype, sizeBytes: BigInt(file.size), uploadedByUserId: user.userId } }); })); return { message: 'Đã tải tệp lên', data }; }
}
