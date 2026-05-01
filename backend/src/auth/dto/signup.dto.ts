import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { NotContainsEmail } from '../../common/validators/not-contains-email.validator';
import { NoSequentialDigits } from '../../common/validators/no-sequential-digits.validator';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePw!42',
    minLength: 8,
    description:
      '8자 이상, 특수문자 1개 이상 포함, 연속된 숫자(123/987 등) 미포함, 이메일 문자열 미포함',
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @Matches(/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~';]/, {
    message: '비밀번호는 특수문자를 1개 이상 포함해야 합니다.',
  })
  @NoSequentialDigits()
  @NotContainsEmail('email')
  password: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  @MinLength(2)
  name: string;
}
