import { IsString, IsOptional, IsNotEmpty } from "class-validator";

export class CreateLeadDto {
	@IsString()
	@IsNotEmpty()
	siteId: string;

	@IsString()
	@IsNotEmpty()
	name: string;

	@IsString()
	@IsOptional()
	email?: string;

	@IsString()
	@IsOptional()
	phone?: string;

	@IsString()
	@IsOptional()
	message?: string;
}
