import { Transform } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot be greater than 5' })
  @IsNotEmpty({ message: 'Rating is required' })
  rating: number;

  @IsString({ message: 'Comment must be a string' })
  @IsNotEmpty({ message: 'Comment is required' })
  comment: string;

  @IsMongoId({ message: 'Invalid product id' })
  @IsNotEmpty({ message: 'Product id is required' })
  productId: string;
}
