import { IsInt, Max, Min } from 'class-validator';

export class UpdateAgentOnboardingStatusDto {
  @IsInt()
  @Min(1)
  @Max(6)
  status: number;
}
