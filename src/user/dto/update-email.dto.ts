import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateEmailDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
}
