import { Transform } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Length,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty({ message: 'Brand name is required' })
  @Length(2, 20, {
    message: 'Brand name must be between 2 and 20 characters',
  })
  @Transform(({ value }) => value?.trim())
  name: string;
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  })
  @IsArray({ message: 'Categories must be an array' })
  @ArrayNotEmpty({ message: 'At least one category is required' })
  @IsMongoId({
    each: true,
    message: 'Invalid category id',
  })
  categories: string[];
}
