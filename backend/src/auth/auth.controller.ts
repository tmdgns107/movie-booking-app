import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import {
  CheckEmailQueryDto,
  CheckEmailResponseDto,
} from './dto/check-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { CurrentUserType } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 이메일 입력 즉시 호출되는 엔드포인트.
  // account enumeration 위험 완화를 위해 분당 30회로 제한.
  @Get('check-email')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: '이메일 사용 가능 여부 확인' })
  @ApiResponse({ status: 200, type: CheckEmailResponseDto })
  @ApiResponse({ status: 429, description: '요청 한도 초과' })
  checkEmail(@Query() query: CheckEmailQueryDto) {
    return this.authService.checkEmailAvailability(query.email);
  }

  @Post('signup')
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 409, description: '이미 가입된 이메일' })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  // 로그인은 brute-force 공격의 주 표적 → 분당 10회로 추가 강화.
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 429, description: '요청 한도 초과' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 로그인 사용자 조회' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  me(@CurrentUser() user: CurrentUserType) {
    return user;
  }
}
