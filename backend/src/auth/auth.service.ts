import { UnauthorizedException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { AgentDocument } from '../agents/agent-document.entity';
import { Agent } from '../agents/agent.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(Agent)
  async login(loginDto: LoginDto) {
    if (loginDto.loginAs === 'agent') {
      return this.loginAgent(loginDto);
    }

    const user = await this.usersService.findByEmail(loginDto.email);
    const passwordMatches = user
      ? await bcrypt.compare(loginDto.password, user.passwordHash)
      : false;

      throw new UnauthorizedException('Invalid email or password.');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  private async loginAgent(loginDto: LoginDto) {
    const agent = await this.agentsRepository.findOne({
      where: { email: loginDto.email.toLowerCase() },
    });
    const passwordMatches = agent?.passwordHash
      ? await bcrypt.compare(loginDto.password, agent.passwordHash)
      : false;

    if (!agent || !passwordMatches || !agent.activatedAt) {
      throw new UnauthorizedException('Invalid agent email or password.');
    }

    const accessToken = this.jwtService.sign({
      sub: agent.id,
      email: agent.email,
      role: 'agent',
    });
    const signedDocuments = await this.findAgentSignedDocuments(agent.id);

    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: 'agent',
        onboardingStatus: agent.onboardingStatus,
        signedDocuments,
      },
    };
  }

  private async findAgentSignedDocuments(agentId: string) {
    const documents = await this.agentDocumentsRepository.find({
      where: { agentId },
      order: { createdAt: 'ASC' },
    });

    return documents.reduce<Record<string, unknown>>((acc, document) => {
      acc[document.documentId] = {
        id: document.id,
        documentId: document.documentId,
        documentName: document.documentName,
        accepted: document.accepted,
        acceptanceText: document.acceptanceText,
        signature: document.signature,
        signatureType: document.signatureType,
        metadata: document.metadata,
        submittedAt: document.submittedAt,
      };
      return acc;
    }, {});
  }
}
