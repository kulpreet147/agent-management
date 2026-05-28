import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentDocument } from './agent-document.entity';
import { Agent } from './agent.entity';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { MailModule } from '../common/mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([Agent, AgentDocument]), MailModule],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}
