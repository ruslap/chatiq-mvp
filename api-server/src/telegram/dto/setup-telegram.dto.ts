import { IsString, MinLength, IsOptional, IsEmail } from 'class-validator';

export class SetupTelegramDto {
  @IsString()
  @MinLength(20)
  siteId: string;

  @IsString()
  @MinLength(30)
  botToken: string;

  @IsOptional()
  @IsEmail()
  notificationEmail?: string;
}
