import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CheckEmailQueryDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class CheckEmailResponseDto {
  @ApiProperty({
    example: true,
    description: 'true: 가입 가능, false: 이미 사용 중인 이메일',
  })
  available: boolean;
}
