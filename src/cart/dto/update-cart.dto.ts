import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdateCartDto {
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsNotEmpty({ message: 'Quantity is required' })
  quantity: number;
}
