import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class SendMgaPackageEmailDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  to: string[];

  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentDocumentKeys?: string[];
}
