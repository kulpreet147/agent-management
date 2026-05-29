import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAgentsAndAgentDocuments1748524200000 implements MigrationInterface {
  name = 'CreateAgentsAndAgentDocuments1748524200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await queryRunner.query(`
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
        "account_activation_status" integer NOT NULL DEFAULT 0,
        "invite_token_hash" varchar NULL,
        "invite_expires_at" timestamp NULL,
        "invite_used_at" timestamp NULL,
        "password_hash" varchar NULL,
        "activated_at" timestamp NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      ALTER TABLE agents
      ADD COLUMN IF NOT EXISTS "onboarding_status" integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "account_activation_status" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "invite_token_hash" varchar NULL,
      ADD COLUMN IF NOT EXISTS "invite_expires_at" timestamp NULL,
      ADD COLUMN IF NOT EXISTS "invite_used_at" timestamp NULL,
      ADD COLUMN IF NOT EXISTS "password_hash" varchar NULL,
      ADD COLUMN IF NOT EXISTS "activated_at" timestamp NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_agents_invite_token_hash"
      ON agents ("invite_token_hash");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS agent_documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "agentId" uuid NOT NULL,
        "documentId" varchar NOT NULL,
        "documentName" varchar NOT NULL,
        accepted boolean NOT NULL DEFAULT false,
        "acceptanceText" text NULL,
        signature text NULL,
        "signatureType" varchar NULL,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        "submittedAt" timestamp NOT NULL DEFAULT now(),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_agent_documents_agent"
          FOREIGN KEY ("agentId") REFERENCES agents(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_agent_documents_agent_document"
      ON agent_documents ("agentId", "documentId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_agent_documents_agent_document";`);
    await queryRunner.query(`DROP TABLE IF EXISTS agent_documents;`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_agents_invite_token_hash";`);
    await queryRunner.query(`DROP TABLE IF EXISTS agents;`);
  }
}
