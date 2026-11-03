import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { GenderEnum, RoleEnum } from '../../common/enums/user.enum.js';

export class CreateAuthDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 20, {
    message: 'First name must be between 2 and 20 characters',
  })
  firstName : string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 20, {
    message: 'Last name must be between 2 and 20 characters',
  })
  lastName: string;

  @IsEmail(
    {},
    {
      message: 'Email is not valid',
    },
  )
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @Length(6, 20, {
    message: 'Password must be between 6 and 20 characters',
  })
  password: string;

  @IsEnum(GenderEnum, {
    message: 'Gender is not valid',
  })
  @IsOptional()
  gender: string;

  @IsEnum(RoleEnum, {
    message: 'Role is not valid',
  })
  @IsOptional()
  role: string;
}
