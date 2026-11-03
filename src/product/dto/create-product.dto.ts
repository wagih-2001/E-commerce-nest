import { Transform } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  @Length(2, 100, {
    message: 'Product name must be between 2 and 100 characters',
  })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Product description is required' })
  @Length(10, 500, {
    message: 'Product description must be between 10 and 500 characters',
  })
  @Transform(({ value }) => value?.trim())
  description: string;

  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'Product price must be a number' })
  @Min(0, { message: 'Product price cannot be negative' })
  price: number;

  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'Product stock must be a number' })
  @Min(0, { message: 'Product stock cannot be negative' })
  stock: number;

  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'Product discount must be a number' })
  @Min(0, { message: 'Discount cannot be less than 0' })
  @Max(100, { message: 'Discount cannot be greater than 100' })
  discount: number;

  @IsMongoId({ message: 'Invalid category id' })
  @IsNotEmpty({ message: 'Category is required' })
  category: string;

  @IsMongoId({ message: 'Invalid brand id' })
  @IsNotEmpty({ message: 'Brand is required' })
  brand: string;
}
