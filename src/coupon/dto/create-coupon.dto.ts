import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCouponDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  code: string;

  @IsInt()
  @Min(1)
  @Max(100)
  discountPercentage: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  expiryDate: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
