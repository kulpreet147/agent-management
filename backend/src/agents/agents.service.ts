import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { Agent } from './agent.entity';
import { ActivateAgentDto } from './dto/activate-agent.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { MailService } from '../common/mail/mail.service';

type AgentFiles = Record<string, Express.Multer.File[]>;
const INVITE_EXPIRY_MINUTES = 10;

@Injectable()
export class AgentsService implements OnModuleInit {
  constructor(
    @InjectRepository(Agent)
    private readonly agentsRepository: Repository<Agent>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    await this.ensureAgentsTable();
  }

  async create(createAgentDto: CreateAgentDto, files: AgentFiles) {
    this.validateRequiredFiles(createAgentDto.licenceWorkflow, files);

    const existingAgent = await this.agentsRepository.findOne({
      where: { agentId: createAgentDto.agentId },
    });

    if (existingAgent) {
      throw new ConflictException('Agent ID already exists.');
    }

    const documents = this.mapFiles(files);
    const inviteToken = randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date(
      Date.now() + INVITE_EXPIRY_MINUTES * 60 * 1000,
    );
    const agent = this.agentsRepository.create({
      ...createAgentDto,
      documents,
      status: 'invited',
      onboardingStatus: 1,
      inviteTokenHash: this.hashToken(inviteToken),
      inviteExpiresAt,
      inviteUsedAt: null,
    });

    const savedAgent = await this.agentsRepository.save(agent);
    const inviteUrl = this.buildInviteUrl(inviteToken);
    const emailSent = await this.mailService.sendAgentInvite(
      savedAgent.email,
      savedAgent.name,
      inviteUrl,
    );

    return {
      message: emailSent
        ? 'Agent profile created and onboarding email sent successfully.'
        : 'Agent profile created. Email could not be sent, so the invite link was logged on the backend.',
      emailSent,
      inviteExpiresAt,
      agent: this.toSafeAgent(savedAgent),
    };
  }

  async getInvite(token: string) {
    const agent = await this.findByInviteToken(token);
    this.assertInviteUsable(agent);

    return {
      agent: {
        name: agent.name,
        email: agent.email,
      },
      expiresAt: agent.inviteExpiresAt,
    };
  }

  async activateInvite(token: string, activateAgentDto: ActivateAgentDto) {
    const agent = await this.findByInviteToken(token);
    this.assertInviteUsable(agent);

    const passwordHash = await bcrypt.hash(activateAgentDto.password, 10);
    const activatedAt = new Date();

    await this.agentsRepository.update(agent.id, {
      passwordHash,
      activatedAt,
      inviteUsedAt: activatedAt,
      status: 'account_setup_complete',
      onboardingStatus: 2,
    });

    return {
      message: 'Account activated successfully.',
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        status: 'account_setup_complete',
      },
    };
  }

  async findAll() {
    const agents = await this.agentsRepository.find({
      order: { createdAt: 'DESC' },
    });
    return agents.map((agent) => this.toSafeAgent(agent));
  }

  async findOne(id: string) {
    const agent = await this.agentsRepository.findOneBy({ id });
    return agent ? this.toSafeAgent(agent) : null;
  }

  async updateOnboardingStatus(id: string, status: number) {
    const agent = await this.agentsRepository.findOneBy({ id });

    if (!agent) {
      throw new BadRequestException('Agent not found.');
    }

    const statusLabelByStep: Record<number, string> = {
      1: 'invited',
      2: 'account_setup_complete',
      3: 'registration_complete',
      4: 'documents_signed',
      5: 'dashboard_active',
    };

    await this.agentsRepository.update(agent.id, {
      onboardingStatus: status,
      status: statusLabelByStep[status] ?? agent.status,
    });

    const updatedAgent = await this.agentsRepository.findOneBy({ id });

    return {
      message: 'Agent onboarding status updated successfully.',
      agent: updatedAgent ? this.toSafeAgent(updatedAgent) : null,
    };
  }

  private mapFiles(files: AgentFiles) {
    return Object.entries(files || {}).reduce<Record<string, unknown>>(
      (documents, [fieldName, uploadedFiles]) => {
        const file = uploadedFiles?.[0];
        if (!file) return documents;

        documents[fieldName] = {
          originalName: file.originalname,
          fileName: file.filename,
          path: file.path,
          mimeType: file.mimetype,
          size: file.size,
        };

        return documents;
      },
      {},
    );
  }

  private validateRequiredFiles(licenceWorkflow: string, files: AgentFiles) {
    const licenceDocumentKey =
      licenceWorkflow === 'transfer' ? 'transferDocument' : 'licenceDocument';
    const requiredFileKeys = [
      licenceDocumentKey,
      'eandODocument',
      'apexDocument',
      'creditReportDocument',
    ];

    const missingFiles = requiredFileKeys.filter((key) => !files?.[key]?.[0]);

    if (missingFiles.length > 0) {
      throw new BadRequestException(
        `Missing required documents: ${missingFiles.join(', ')}.`,
      );
    }
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildInviteUrl(token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ??
      'http://127.0.0.1:5173';

    return `${frontendUrl.replace(/\/$/, '')}/agent/account-setup/${token}`;
  }

  private async findByInviteToken(token: string) {
    const tokenHash = this.hashToken(token);
    const agent = await this.agentsRepository.findOne({
      where: { inviteTokenHash: tokenHash },
    });

    if (!agent) {
      throw new BadRequestException('Invite link is invalid or expired.');
    }

    return agent;
  }

  private assertInviteUsable(agent: Agent) {
    if (agent.inviteUsedAt || agent.activatedAt) {
      throw new BadRequestException('Invite link has already been used.');
    }

    if (!agent.inviteExpiresAt || agent.inviteExpiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Invite link has expired.');
    }
  }

  private toSafeAgent(agent: Agent) {
    const {
      inviteTokenHash: _inviteTokenHash,
      passwordHash: _passwordHash,
      ...safeAgent
    } = agent;

    return safeAgent;
  }

  private async ensureAgentsTable() {
    await this.agentsRepository.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    await this.agentsRepository.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "agentId" varchar UNIQUE NOT NULL,
        name varchar NOT NULL,
        email varchar NOT NULL,
        "licenceType" varchar NOT NULL,
        "licenceWorkflow" varchar NOT NULL,
        "agentLevel" varchar NOT NULL,
        "insuranceCompany" varchar NOT NULL,
        "agentCode" varchar NOT NULL,
        eo varchar NOT NULL,
        apex varchar NOT NULL,
        "creditReport" varchar NOT NULL,
        sin varchar NOT NULL,
        mga varchar NOT NULL,
        "commissionOverride" numeric(5, 2) NOT NULL,
        documents jsonb NOT NULL DEFAULT '{}'::jsonb,
        status varchar NOT NULL DEFAULT 'active',
        "onboarding_status" integer NOT NULL DEFAULT 1,
        "invite_token_hash" varchar NULL,
        "invite_expires_at" timestamp NULL,
        "invite_used_at" timestamp NULL,
        "password_hash" varchar NULL,
        "activated_at" timestamp NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await this.agentsRepository.query(`
      ALTER TABLE agents
      ADD COLUMN IF NOT EXISTS "invite_token_hash" varchar NULL,
      ADD COLUMN IF NOT EXISTS "onboarding_status" integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "invite_expires_at" timestamp NULL,
      ADD COLUMN IF NOT EXISTS "invite_used_at" timestamp NULL,
      ADD COLUMN IF NOT EXISTS "password_hash" varchar NULL,
      ADD COLUMN IF NOT EXISTS "activated_at" timestamp NULL;
    `);

    await this.agentsRepository.query(`
      CREATE INDEX IF NOT EXISTS "idx_agents_invite_token_hash"
      ON agents ("invite_token_hash");
    `);
  }
}
