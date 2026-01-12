import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAutoReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  trigger: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  delay?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAutoReplyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  trigger?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  delay?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
