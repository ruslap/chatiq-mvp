import { IsString, IsEnum, MaxLength, MinLength } from "class-validator";

export class ExecuteAutoReplyDto {
	@IsString()
	@MinLength(1)
	@MaxLength(5000)
	message: string;

	@IsEnum(["admin", "visitor"])
	from: "admin" | "visitor";
}
