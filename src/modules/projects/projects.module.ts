import { Module } from '@nestjs/common'; import { ProjectsController } from './projects.controller'; import { ProjectsService } from './projects.service'; import { ProjectFilesController } from './project-files.controller';
@Module({ controllers: [ProjectsController, ProjectFilesController], providers: [ProjectsService], exports: [ProjectsService] }) export class ProjectsModule {}
