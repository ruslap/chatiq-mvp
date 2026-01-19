import { IsString, IsUUID, MinLength } from 'class-validator';

export class SetupTelegramDto {
  @IsUUID()
  siteId: string;

  @IsString()
  @MinLength(30)
  botToken: string;
}
