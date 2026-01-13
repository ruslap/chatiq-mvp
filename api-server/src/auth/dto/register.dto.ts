import { IsEmail, IsString, MinLength, IsOptional, MaxLength } from "class-validator";

export class RegisterDto {
	@IsEmail()
	email: string;

	@IsString()
	@MinLength(8, { message: "Password must be at least 8 characters long" })
	@MaxLength(100)
	password: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	name?: string;
}
