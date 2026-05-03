import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { NotContainsEmail } from '../../common/validators/not-contains-email.validator';
import { NoSequentialDigits } from '../../common/validators/no-sequential-digits.validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'NewPw!99',
    description: '8자 이상, 특수문자 1개 이상, 연속 숫자 미포함, 이메일 문자열 미포함',
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @Matches(/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~';]/, {
    message: '비밀번호는 특수문자를 1개 이상 포함해야 합니다.',
  })
  @NoSequentialDigits()
  @NotContainsEmail('email')
  newPassword: string;
}
