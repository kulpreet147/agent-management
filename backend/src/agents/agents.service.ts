import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';

type AgentFiles = Record<string, Express.Multer.File[]>;

@Injectable()
export class AgentsService implements OnModuleInit {
  constructor(
    @InjectRepository(Agent)
    private readonly agentsRepository: Repository<Agent>,
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
    const agent = this.agentsRepository.create({
      ...createAgentDto,
      documents,
      status: 'active',
    });

    const savedAgent = await this.agentsRepository.save(agent);

    return {
      message: 'Agent profile created successfully.',
      agent: savedAgent,
    };
  }

  async findAll() {
    return this.agentsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return this.agentsRepository.findOneBy({ id });
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
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);
  }
}
