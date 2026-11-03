import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class VerifyEmailDto {
  @IsEmail({}, { message: 'Email is not valid' })
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required.' })
  confirmEmailOTP: string;
}
