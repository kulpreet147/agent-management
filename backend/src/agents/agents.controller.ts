import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AgentsService } from './agents.service';
import { ActivateAgentDto } from './dto/activate-agent.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentOnboardingStatusDto } from './dto/update-agent-onboarding-status.dto';

const uploadDir = join(process.cwd(), 'uploads', 'agents');
const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];

if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'licenceDocument', maxCount: 1 },
        { name: 'transferDocument', maxCount: 1 },
        { name: 'eandODocument', maxCount: 1 },
        { name: 'apexDocument', maxCount: 1 },
        { name: 'creditReportDocument', maxCount: 1 },
        { name: 'otherSupporting', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: uploadDir,
          filename: (_req, file, callback) => {
            const uniqueName = `${Date.now()}-${Math.round(
              Math.random() * 1e9,
            )}${extname(file.originalname)}`;
            callback(null, uniqueName);
          },
        }),
        limits: {
          fileSize: 10 * 1024 * 1024,
        },
        fileFilter: (_req, file, callback) => {
          const extension = extname(file.originalname).toLowerCase();
          callback(null, allowedExtensions.includes(extension));
        },
      },
    ),
  )
  create(
    @Body() createAgentDto: CreateAgentDto,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ) {
    return this.agentsService.create(createAgentDto, files);
  }

  @Get('invites/:token')
  getInvite(@Param('token') token: string) {
    return this.agentsService.getInvite(token);
  }

  @Post('invites/:token/activate')
  activateInvite(
    @Param('token') token: string,
    @Body() activateAgentDto: ActivateAgentDto,
  ) {
    return this.agentsService.activateInvite(token, activateAgentDto);
  }

  @Patch(':id/onboarding-status')
  updateOnboardingStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateAgentOnboardingStatusDto,
  ) {
    return this.agentsService.updateOnboardingStatus(id, updateDto.status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const agent = await this.agentsService.findOne(id);
    if (!agent) {
      throw new NotFoundException('Agent not found.');
    }
    return agent;
  }

  @Get()
  findAll() {
    return this.agentsService.findAll();
  }
}
