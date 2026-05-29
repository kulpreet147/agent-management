import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'agents' })
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  agentId!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  licenceType!: string;

  @Column()
  licenceWorkflow!: string;

  @Column()
  agentLevel!: string;

  @Column()
  insuranceCompany!: string;

  @Column()
  agentCode!: string;

  @Column()
  eo!: string;

  @Column()
  apex!: string;

  @Column()
  creditReport!: string;

  @Column()
  sin!: string;

  @Column()
  mga!: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  commissionOverride!: string;

  @Column({ type: 'jsonb', default: {} })
  documents!: Record<string, unknown>;

  @Column({ default: 'active' })
  status!: string;

  @Column({ name: 'onboarding_status', type: 'int', default: 1 })
  onboardingStatus!: number;

  @Column({ name: 'account_activation_status', type: 'int', default: 0 })
  accountActivationStatus!: number;

  @Column({ name: 'invite_token_hash', type: 'varchar', nullable: true })
  inviteTokenHash!: string | null;

  @Column({ name: 'invite_expires_at', type: 'timestamp', nullable: true })
  inviteExpiresAt!: Date | null;

  @Column({ name: 'invite_used_at', type: 'timestamp', nullable: true })
  inviteUsedAt!: Date | null;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'activated_at', type: 'timestamp', nullable: true })
  activatedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
