import { UserType } from './../../../types/user.js';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsEnum
} from 'class-validator';
import { UserMessages } from './user.messages.js';

export class CreateUserDto {
  @IsString()
  @MinLength(1, { message: UserMessages.name.minLength })
  @MaxLength(15, { message: UserMessages.name.maxLength })
  public name!: string;

  @IsEmail({},{ message: UserMessages.email.invalidFormat })
  public email!: string;

  @IsString()
  @MinLength(6, { message: UserMessages.password.minLength })
  @MaxLength(12, { message: UserMessages.password.maxLength })
  public password!: string;

  @IsString()
  @IsEnum(UserType, { message: UserMessages.type.invalid })
  public type!: UserType;
}
