import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsString,
  Matches,
} from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  agentId: string;

  @IsString()
  @IsNotEmpty()
  licenceType: string;

  @IsString()
  @IsIn(['new', 'transfer'])
  licenceWorkflow: string;

  @IsString()
  @IsNotEmpty()
  agentLevel: string;

  @IsString()
  @IsNotEmpty()
  insuranceCompany: string;

  @IsString()
  @IsNotEmpty()
  agentCode: string;

  @IsString()
  @IsNotEmpty()
  eo: string;

  @IsString()
  @IsNotEmpty()
  apex: string;

  @IsString()
  @IsNotEmpty()
  creditReport: string;

  @IsString()
  @Matches(/^\d{9}$/, { message: 'SIN must contain 9 digits.' })
  sin: string;

  @IsString()
  @IsNotEmpty()
  mga: string;

  @IsNumberString()
  commissionOverride: string;
}
