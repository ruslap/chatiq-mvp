import { IsString, MaxLength, MinLength } from 'class-validator';

export class RenameVisitorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  visitorName: string;
}
