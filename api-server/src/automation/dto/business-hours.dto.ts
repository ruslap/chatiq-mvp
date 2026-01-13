import { IsString, IsOptional, IsBoolean, ValidateNested, MaxLength, Matches } from "class-validator";
import { Type } from "class-transformer";

export class DayScheduleDto {
	@IsString()
	@Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
		message: "Start time must be in HH:MM format",
	})
	start: string;

	@IsString()
	@Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
		message: "End time must be in HH:MM format",
	})
	end: string;

	@IsBoolean()
	isOpen: boolean;
}

export class UpdateBusinessHoursDto {
	@IsOptional()
	@IsString()
	@MaxLength(50)
	timezone?: string;

	@IsOptional()
	@IsBoolean()
	isEnabled?: boolean;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	offlineMessage?: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => DayScheduleDto)
	monday?: DayScheduleDto;

	@IsOptional()
	@ValidateNested()
	@Type(() => DayScheduleDto)
	tuesday?: DayScheduleDto;

	@IsOptional()
	@ValidateNested()
	@Type(() => DayScheduleDto)
	wednesday?: DayScheduleDto;

	@IsOptional()
	@ValidateNested()
	@Type(() => DayScheduleDto)
	thursday?: DayScheduleDto;

	@IsOptional()
	@ValidateNested()
	@Type(() => DayScheduleDto)
	friday?: DayScheduleDto;

	@IsOptional()
	@ValidateNested()
	@Type(() => DayScheduleDto)
	saturday?: DayScheduleDto;

	@IsOptional()
	@ValidateNested()
	@Type(() => DayScheduleDto)
	sunday?: DayScheduleDto;
}
