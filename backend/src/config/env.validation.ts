import * as Joi from 'joi';

/**
 * 부팅 시점에 환경변수의 존재/형식을 검증한다.
 * 누락/형식 오류 발견 시 즉시 부팅 실패 → 운영 중 장애 차단.
 */
export const envValidationSchema = Joi.object({
  // PostgreSQL 연결 문자열
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),

  // JWT 서명 시크릿. 너무 짧으면 brute-force 위험 → 최소 16자.
  JWT_SECRET: Joi.string().min(16).required(),

  // JWT 만료 시간 (ms 라이브러리 표기: '1h', '15m', '7d' 등)
  JWT_EXPIRES_IN: Joi.string().default('1h'),

  // 서버 포트
  PORT: Joi.number().port().default(3001),

  // Node 환경
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
});
