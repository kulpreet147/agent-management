import { IsInt, Max, Min } from 'class-validator';

export class UpdateAgentOnboardingStatusDto {
  @IsInt()
  @Min(1)
  @Max(5)
  status: number;
}
