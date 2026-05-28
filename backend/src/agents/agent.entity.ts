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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
