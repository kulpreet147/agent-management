import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewAgentDocumentDto {
  @IsString()
  @IsIn(['uploaded', 'signed'])
  documentType: 'uploaded' | 'signed';

  @IsString()
  documentId: string;

  @IsString()
  @IsIn(['approved', 'revision_requested', 'rejected'])
  action: 'approved' | 'revision_requested' | 'rejected';

  @IsOptional()
  @IsString()
  comment?: string;
}
