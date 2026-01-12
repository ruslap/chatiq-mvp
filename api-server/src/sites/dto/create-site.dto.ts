import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateSiteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @IsOptional()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/, {
    message: 'Domain must be a valid domain name',
  })
  domain: string;
}
