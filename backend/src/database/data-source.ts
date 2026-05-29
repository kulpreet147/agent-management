import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import { User } from '../users/user.entity';
import { Agent } from '../agents/agent.entity';
import { AgentDocument } from '../agents/agent-document.entity';

loadEnv();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'agentflow',
  entities: [User, Agent, AgentDocument],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
