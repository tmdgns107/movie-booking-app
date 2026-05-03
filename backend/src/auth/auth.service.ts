import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';

// bcrypt cost factor. 10 = 해시 1회당 약 100ms 소요.
// brute-force 방어와 응답 속도 간 일반적 절충값.
const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return { available: !existing };
  }

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashed, name: dto.name },
      select: { id: true, email: true, name: true },
    });

    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // 이메일 미존재 / 비밀번호 불일치 → 동일 메시지로 응답.
    // 가입 이메일 추측 방지 목적 (account enumeration 방어).
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    return this.issueToken({ id: user.id, email: user.email, name: user.name });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // 이메일 존재 여부를 노출하지 않기 위해 없는 경우도 동일 응답.
    // 실서비스라면 이메일 발송 로직이 이 자리에 위치.
    if (!user) {
      throw new NotFoundException('가입되지 않은 이메일입니다.');
    }

    const hashed = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { password: hashed },
    });

    return { message: '비밀번호가 재설정되었습니다.' };
  }

  private issueToken(user: { id: number; email: string; name: string }) {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwt.sign(payload);
    return { accessToken, user };
  }
}
