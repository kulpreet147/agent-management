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
import { SaveAgentSignedDocumentDto } from './dto/save-agent-signed-document.dto';
import { ReviewAgentDocumentDto } from './dto/review-agent-document.dto';
import { SendMgaPackageEmailDto } from './dto/send-mga-package-email.dto';
import { UpdateAccountActivationStatusDto } from './dto/update-account-activation-status.dto';
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

  @Post(':id/resend-invite')
  resendInvite(@Param('id') id: string) {
    return this.agentsService.resendInvite(id);
  }

  @Patch(':id/onboarding-status')
  updateOnboardingStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateAgentOnboardingStatusDto,
  ) {
    return this.agentsService.updateOnboardingStatus(id, updateDto.status);
  }

  @Patch(':id/signed-documents')
  saveSignedDocument(
    @Param('id') id: string,
    @Body() saveDto: SaveAgentSignedDocumentDto,
  ) {
    return this.agentsService.saveSignedDocument(id, saveDto);
  }

  @Patch(':id/account-activation-status')
  updateAccountActivationStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateAccountActivationStatusDto,
  ) {
    return this.agentsService.updateAccountActivationStatus(id, updateDto.status);
  }

  @Get(':id/signed-documents')
  getSignedDocuments(@Param('id') id: string) {
    return this.agentsService.findSignedDocumentsByAgentId(id);
  }

  @Patch(':id/document-review')
  reviewDocument(
    @Param('id') id: string,
    @Body() reviewDto: ReviewAgentDocumentDto,
  ) {
    return this.agentsService.reviewDocument(id, reviewDto);
  }

  @Post(':id/send-mga-package-email')
  sendMgaPackageEmail(
    @Param('id') id: string,
    @Body() payload: SendMgaPackageEmailDto,
  ) {
    return this.agentsService.sendMgaPackageEmail(id, payload);
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
