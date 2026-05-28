import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class SaveAgentSignedDocumentDto {
  @IsString()
  @IsNotEmpty()
  documentId: string;

  @IsString()
  @IsNotEmpty()
  documentName: string;

  @IsBoolean()
  accepted: boolean;

  @IsOptional()
  @IsString()
  acceptanceText?: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  signatureType?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
