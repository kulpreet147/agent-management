import { IsString, Matches, MinLength } from 'class-validator';

export class ActivateAgentDto {
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Password must include one uppercase letter.' })
  @Matches(/\d/, { message: 'Password must include one number.' })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'Password must include one special character.',
  })
  password: string;
}
