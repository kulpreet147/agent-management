import { IsIn, IsInt } from 'class-validator';

export class UpdateAccountActivationStatusDto {
  @IsInt()
  @IsIn([0, 1, 2])
  status: number;
}
