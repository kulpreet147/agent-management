import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'agent_documents' })
@Index(['agentId', 'documentId'], { unique: true })
export class AgentDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agentId!: string;

  @Column()
  documentId!: string;

  @Column()
  documentName!: string;

  @Column({ type: 'boolean', default: false })
  accepted!: boolean;

  @Column({ type: 'text', nullable: true })
  acceptanceText!: string | null;

  @Column({ type: 'text', nullable: true })
  signature!: string | null;

  @Column({ type: 'varchar', nullable: true })
  signatureType!: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @Column({ type: 'timestamp' })
  submittedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
