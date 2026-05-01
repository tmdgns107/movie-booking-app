import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MoviesModule } from './movies/movies.module';
import { ScreeningsModule } from './screenings/screenings.module';
import { ReservationsModule } from './reservations/reservations.module';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // 부팅 시점 환경변수 검증 (누락/형식 오류 시 즉시 실패)
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false, // 모든 에러를 한 번에 보고
      },
    }),
    // 전역 기본 rate limit: 분당 100회.
    // 민감 엔드포인트(로그인 / 이메일 중복 체크)는 컨트롤러에서 @Throttle로 별도 강화.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    MoviesModule,
    ScreeningsModule,
    ReservationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
