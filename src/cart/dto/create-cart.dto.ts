import { IsInt, IsMongoId, IsNotEmpty, Min } from 'class-validator';

export class CreateCartDto {
  @IsMongoId({ message: 'Invalid product id' })
  @IsNotEmpty({ message: 'Product id is required' })
  productId: string;

  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsNotEmpty({ message: 'Quantity is required' })
  quantity: number;
}
