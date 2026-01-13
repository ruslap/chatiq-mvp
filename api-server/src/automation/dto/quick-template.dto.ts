import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength, MinLength, Matches } from "class-validator";

export class CreateQuickTemplateDto {
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	title: string;

	@IsString()
	@MinLength(1)
	@MaxLength(5000)
	message: string;

	@IsOptional()
	@IsString()
	@MaxLength(20)
	@Matches(/^\/[a-z0-9_-]+$/, {
		message: "Shortcut must start with / and contain only lowercase letters, numbers, underscores, or hyphens",
	})
	shortcut?: string;

	@IsOptional()
	@IsString()
	@MaxLength(50)
	category?: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}

export class UpdateQuickTemplateDto {
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	title?: string;

	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(5000)
	message?: string;

	@IsOptional()
	@IsString()
	@MaxLength(20)
	@Matches(/^\/[a-z0-9_-]+$/, {
		message: "Shortcut must start with / and contain only lowercase letters, numbers, underscores, or hyphens",
	})
	shortcut?: string;

	@IsOptional()
	@IsString()
	@MaxLength(50)
	category?: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	order?: number;
}
