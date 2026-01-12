import { IsString, IsEmail, IsUUID } from 'class-validator';

export class InviteOperatorDto {
  @IsString()
  @IsUUID()
  siteId: string;

  @IsEmail()
  email: string;
}
