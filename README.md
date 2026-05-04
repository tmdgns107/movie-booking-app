# Movie Booking App

간단한 영화 티켓 예매 시스템.

회원가입/로그인, 영화·상영 정보 조회, 좌석 선택 및 예매, 예매 내역 조회 기능을 제공

---

## 기술 스택

### Backend
- **Runtime**: Node.js 22.22.2
- **Framework**: NestJS 11
- **Language**: TypeScript
- **ORM**: Prisma 6
- **DB**: PostgreSQL 16 (Docker)
- **인증**: JWT (Access Token, TTL 1시간) + Passport
- **암호화**: bcrypt (saltRounds 10)
- **검증**: class-validator + class-transformer
- **Rate Limiting**: @nestjs/throttler
- **보안 헤더**: helmet
- **환경변수 검증**: Joi
- **API 문서**: Swagger (@nestjs/swagger)

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **서버 상태 관리**: TanStack Query (React Query v5)
- **인증 저장**: localStorage (JWT Access Token)

### Infra
- **Docker Compose**: PostgreSQL 컨테이너 단일 관리

---

## 실행 방법

### 사전 요구사항
- Node.js 22.22.2 (또는 22.x LTS)
- Docker / Docker Compose
- npm

---

### 방법 A — 쉘 스크립트로 한 번에 실행 (권장)

#### 최초 실행 (DB 초기화 + 시드 데이터 + 서버 기동)

**① 환경변수 설정** (최초 1회)

**백엔드** — `backend/.env.example`을 복사하여 `backend/.env`를 생성한다.

```bash
cp backend/.env.example backend/.env
```

필요 시 `backend/.env` 내용을 수정한다.

```
DATABASE_URL="postgresql://admin:admin@localhost:5432/movie_booking?schema=public"
JWT_SECRET="your-secret-key-min-16chars"
JWT_EXPIRES_IN="1h"
PORT=3001
```

> `.env` 파일이 없으면 `setup.sh`가 자동으로 `.env.example`을 복사하지만,
> `JWT_SECRET` 등 민감한 값은 직접 확인하고 변경하는 것을 권장합니다.

**프론트엔드** — `frontend/.env.example`을 복사하여 `frontend/.env`를 생성한다.

```bash
cp frontend/.env.example frontend/.env
```

백엔드를 기본 포트(3001)로 실행한다면 수정 없이 그대로 사용 가능하다.

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**② 스크립트 실행**

```bash
./scripts/setup.sh
```

내부 처리 순서:
1. Docker로 PostgreSQL 컨테이너 기동
2. DB 준비 대기
3. 백엔드 의존성 설치 (`npm install`)
4. DB 마이그레이션 (`prisma migrate deploy`)
5. Prisma Client 생성 (`prisma generate`)
6. 시드 데이터 주입 (영화 4편, 상영관 2개, 좌석 80석, 상영 48건)
7. 프론트엔드 의존성 설치 (`npm install`)
8. 백엔드 + 프론트엔드 서버 동시 기동

#### 이후 재실행 (DB는 이미 구성된 상태)

```bash
./scripts/start.sh
```

내부 처리 순서:
1. Docker 컨테이너 기동
2. DB 준비 대기
3. 백엔드 + 프론트엔드 서버 동시 기동

> `Ctrl+C` 로 종료 시 두 서버와 DB 컨테이너가 함께 정지됩니다.

---

### 방법 B — 수동 단계별 실행

#### 1. 환경변수 설정

**백엔드** — `backend/.env.example` 참고하여 `backend/.env` 작성.

```
DATABASE_URL="postgresql://admin:admin@localhost:5432/movie_booking?schema=public"
JWT_SECRET="your-secret-key-min-16chars"
JWT_EXPIRES_IN="1h"
PORT=3001
```

**프론트엔드** — `frontend/.env.example` 참고하여 `frontend/.env` 작성.

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

#### 2. PostgreSQL 컨테이너 기동

```bash
docker compose up -d
```

#### 3. 백엔드 의존성 설치 + DB 초기화

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
npx ts-node prisma/seed.ts
```

#### 4. 프론트엔드 의존성 설치

```bash
cd frontend
npm install
```

#### 5. 서버 실행 (터미널 두 개)

```bash
# 터미널 1 — 백엔드
cd backend && npm run start:dev

# 터미널 2 — 프론트엔드
cd frontend && npm run dev
```

---

### (선택) e2e 테스트 실행

```bash
cd backend
npm run test:e2e
```

좌석 동시 예매 시 1건만 성공하는지 등 동시성 처리 로직을 검증합니다.

---

### 기동 후 접속 주소

| 서비스 | 주소 |
|--------|------|
| 프론트엔드 | http://localhost:3000 |
| 백엔드 API | http://localhost:3001/api |
| Swagger UI | http://localhost:3001/api-docs |

---

### 종료 / 정리

```bash
docker compose down       # DB 컨테이너 정지
docker compose down -v    # DB 데이터까지 완전 삭제
```

---

## 프로젝트 구조

```
movie-booking-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # DB 스키마 (Prisma)
│   │   ├── migrations/            # 마이그레이션 히스토리
│   │   └── seed.ts                # 시드 데이터 스크립트
│   ├── src/
│   │   ├── main.ts                # 부트스트랩 + Swagger 설정
│   │   ├── app.module.ts
│   │   ├── prisma/                # PrismaService (전역 모듈)
│   │   ├── auth/                  # 회원가입/로그인/JWT
│   │   │   ├── dto/
│   │   │   ├── guards/            # JwtAuthGuard
│   │   │   ├── strategies/        # JwtStrategy
│   │   │   └── decorators/        # @CurrentUser
│   │   ├── movies/                # 영화 목록/상세 조회
│   │   ├── screenings/            # 상영 정보 + 좌석 점유 현황 조회
│   │   ├── reservations/          # 예매/내역/취소 (동시성 처리 핵심)
│   │   └── common/
│   │       └── validators/        # 커스텀 validator
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── layout.tsx             # 루트 레이아웃 (QueryProvider + Header)
│   │   ├── page.tsx               # 영화 목록 (홈)
│   │   ├── login/page.tsx         # 로그인
│   │   ├── signup/page.tsx        # 회원가입
│   │   ├── movies/[id]/page.tsx   # 영화 상세 + 상영 일정 선택
│   │   ├── screenings/[id]/page.tsx # 좌석 선택 + 예매
│   │   └── reservations/page.tsx  # 내 예매 내역
│   ├── components/
│   │   ├── Header.tsx             # 공통 헤더 (로그인/로그아웃)
│   │   └── QueryProvider.tsx      # TanStack Query 클라이언트 Provider
│   ├── lib/
│   │   ├── api.ts                 # 백엔드 API 클라이언트 (fetch 래퍼)
│   │   └── auth.ts                # JWT 토큰 localStorage 관리
│   └── types/index.ts             # 공통 타입 정의
├── docker-compose.yml             # PostgreSQL 컨테이너 정의
└── README.md
```

---

## 설계 의도

### 기술 선택 근거

- **NestJS**: 데코레이터 기반 모듈 구조, DI, Swagger 자동화 지원으로 백엔드 표준 구조 빠른 확보 가능. 과제 규모 대비 보일러플레이트 부담은 있으나, 실서비스 수준 완성도 평가 기준에 부합.
- **Prisma**: 스키마 단일 파일 관리 및 타입 자동 생성으로 데이터 모델 의도가 한눈에 드러남. 마이그레이션 히스토리 추적 용이.
- **PostgreSQL**: unique 제약 + 트랜잭션 동시성 제어를 안정적으로 지원. 과제 핵심인 좌석 동시 예매 처리에 적합.
- **JWT (Stateless)**: 세션 저장소 불필요로 인프라 단순화. 과제 단일 인스턴스 환경에서 충분.

### DB 스키마

총 7개 테이블.

| 테이블 | 역할 |
|--------|------|
| `User` | 사용자 (이메일 unique, 비밀번호 해시) |
| `Movie` | 영화 정보 |
| `Theater` | 상영관 (행/열 정보) |
| `Seat` | 좌석 (Theater 종속, `unique(theaterId, row, col)`) |
| `Screening` | 상영 (영화 + 상영관 + 시작/종료 시간 + 가격) |
| `Reservation` | 예매 헤더 (사용자, 상영, 상태, 총 금액) |
| `ReservationSeat` | 예매-좌석 매핑 + **동시성 제어 핵심** |

#### 핵심: ReservationSeat의 unique 제약

```prisma
model ReservationSeat {
  ...
  @@unique([screeningId, seatId])
}
```

`(screeningId, seatId)` 조합에 unique 제약 부여 → 동일 상영의 동일 좌석에 대한 동시 예매 요청이 발생해도 DB 레벨에서 단 1건만 성공 보장.

좌석 자체는 상영관(Theater) 단위로 관리하고, 점유 여부는 ReservationSeat의 존재 여부로 판단. 상영마다 좌석 데이터를 복제하지 않아 데이터 중복 최소화.

### 동시성 처리 전략

좌석 예매는 가장 race condition이 발생하기 쉬운 지점.

**채택 방식**: DB unique 제약 + 트랜잭션

```
[검증 단계]
  1. 상영 존재 / 시작 전 여부
  2. 좌석들이 해당 상영관 소속인지
  3. 가격 계산
[좌석 점유 단계]
  4. Reservation row 생성
  5. ReservationSeat 일괄 생성 → unique 위반 시 P2002 → ConflictException
```

검증과 점유 사이에 다른 요청이 끼어드는 것을 막기 위해 `prisma.$transaction()`으로 전체 묶음 처리. P2002 발생 시 트랜잭션 자동 롤백되어 일부만 예매되는 부분 실패 상황도 방지.

**대안과 비교**:
- **비관적 락 (`SELECT ... FOR UPDATE`)**: 좌석마다 락 획득 필요. 락 경합으로 throughput 저하 가능.
- **분산 락 (Redis)**: 인프라 복잡도 증가. 단일 인스턴스 환경에서는 과한 설계.
- **선택한 방식**: DB 고유 제약은 가장 단순하면서도 정확. 이미 DB가 지원하는 기능을 활용한 zero-cost 동시성 제어.

---

## 고려한 사항

### 1. 동시 예매 처리

- 단일 요청 내 좌석 중복 사전 차단 (DB unique는 동일 트랜잭션 내 중복까지는 검출 불가).
- Prisma `$transaction()`으로 검증 ~ 점유까지 원자적 처리.
- P2002(unique 위반) 캐치 후 `409 Conflict` 응답.
- 예매 취소 시 ReservationSeat 행 자체를 `deleteMany`로 삭제. status만 변경하면 unique 제약상 좌석이 영구 점유되므로 즉시 재예매 불가.

### 2. 비밀번호 보안

- bcrypt 해싱 (saltRounds 10).
- 비밀번호 정책:
  - 최소 8자
  - 특수문자 1개 이상 포함 (`@Matches` 정규식)
  - 3자 이상 연속된 숫자 미포함 (오름차순/내림차순 모두, 커스텀 validator `@NoSequentialDigits`)
  - 이메일 local part 미포함 (커스텀 validator `@NotContainsEmail`)
- 로그인 실패 시 "이메일 미존재"와 "비밀번호 불일치"를 동일 메시지로 응답 → account enumeration 방어.
- DB 응답 시 `password` 컬럼 `select` 제외하여 외부 노출 차단.

### 2-1. Rate Limiting (account enumeration / brute-force 방어)

- 전역 기본: **분당 100회 / IP** (`ThrottlerGuard`를 `APP_GUARD`로 등록).
- 민감 엔드포인트 강화:
  - `GET /auth/check-email`: **분당 30회** — 이메일 입력 즉시 호출되는 특성상 가입자 명단 추측 시도 방지.
  - `POST /auth/login`: **분당 10회** — brute-force 공격의 주 표적이므로 추가 강화.
- 한도 초과 시 `429 Too Many Requests` 응답.
- 분산 환경에서는 메모리 기반 카운터로 우회 가능 → 실서비스 시 Redis storage 도입 필요 (의도적 단순화).

### 3. JWT 인증

- TTL 1시간. 단일 인스턴스 환경 + 과제 범위에서 refresh token 미도입 (의도적 단순화).
- JWT payload만 신뢰하지 않고 매 요청마다 DB에서 사용자 재조회 → 토큰 발급 이후 탈퇴/삭제된 사용자의 잔여 접근 차단.
- `@CurrentUser()` 데코레이터로 컨트롤러에서 사용자 정보 추출 일관화.

### 4. 입력 검증

- 모든 DTO에 `class-validator` 데코레이터 부여.
- 글로벌 `ValidationPipe` 옵션:
  - `whitelist: true` → 정의되지 않은 필드 자동 제거
  - `forbidNonWhitelisted: true` → 정의되지 않은 필드 포함 시 400 응답
  - `transform: true` → DTO 클래스로 자동 변환
- `ParseIntPipe`로 path parameter 타입 강제.

### 5. 도메인 규칙

- 이미 시작된 상영은 목록 조회/예매/취소 모두 차단.
- 좌석은 해당 상영관 소속 좌석만 예매 가능 (타 상영관 좌석 혼합 방지).
- 본인 예매만 취소 가능 (`ForbiddenException`).
- 이미 취소된 예매 재취소 불가.

### 6. 의도적 단순화 (Trade-off)

| 항목 | 단순화 결정 | 실서비스 시 |
|------|-------------|-------------|
| Refresh Token | 미도입 (Access만 1시간) | Access 30분 + Refresh 7일 |
| 좌석 임시 점유 (5분 hold) | 미도입 (즉시 예매 확정) | Redis로 TTL 락 |
| 결제 연동 | 미도입 (예매 즉시 CONFIRMED) | PG사 연동 + 상태 머신 |
| 이메일 인증 | 미도입 | 가입 시 인증 메일 |
| 캐시 | 미도입 | Redis로 좌석/상영 현황 캐시 |
| 분산 환경 대응 | 단일 인스턴스 가정 | Redis-based throttler/세션 |

---

## 추가 구현 내용

### Swagger 자동 문서화
- 모든 컨트롤러에 `@ApiTags`, `@ApiOperation`, `@ApiResponse` 적용.
- DTO에 `@ApiProperty`로 응답/요청 스키마 자동 노출.
- 보호된 엔드포인트는 `@ApiBearerAuth()`로 토큰 입력 UI 제공.
- 접근: `http://localhost:3001/api-docs`

### 커스텀 Validator (`@NotContainsEmail`)
- `class-validator`의 `registerDecorator`로 직접 작성.
- 객체 전체에 접근하여 `password`와 `email` 필드를 교차 검증.
- 이메일 local part가 3자 미만일 경우 우연 매칭 방지를 위해 검증 스킵.

### Docker Compose
- PostgreSQL 단일 컨테이너 정의.
- `healthcheck`로 DB 준비 완료 대기 가능.
- 명명된 volume(`postgres-data`)로 데이터 영속화.

### 글로벌 예외 필터
- `GlobalExceptionFilter`로 모든 예외를 일관된 JSON 형식으로 응답.
  ```json
  {
    "statusCode": 404,
    "message": "영화를 찾을 수 없습니다.",
    "error": "Not Found",
    "path": "/api/movies/99999",
    "timestamp": "2026-04-30T12:34:56.789Z"
  }
  ```
- Prisma 에러를 적절한 HTTP 상태로 자동 매핑:
  - `P2025` (record not found) → `404 Not Found`
  - `P2002` (unique violation) → `409 Conflict`
  - `P2003` (foreign key violation) → `400 Bad Request`
- 5xx는 stack trace 포함 error 로그, 4xx는 warn 로그.
- 예상치 못한 에러는 일반 메시지로 응답하여 내부 정보 노출 차단.

### 환경변수 검증 (Joi)
- 부팅 시점에 `.env` 값을 검증, 누락/형식 오류 시 즉시 부팅 실패.
- 검증 항목:
  - `DATABASE_URL`: postgresql/postgres URI 필수
  - `JWT_SECRET`: 최소 16자 필수 (brute-force 방어)
  - `JWT_EXPIRES_IN`: 기본값 `1h`
  - `PORT`: 1~65535 정수, 기본값 3001
  - `NODE_ENV`: `development` / `production` / `test`
- `abortEarly: false`로 모든 오류를 한 번에 보고.

### 보안 헤더 (Helmet)
- `app.use(helmet())` 한 줄로 OWASP 권장 보안 헤더 자동 부여.
- 적용되는 주요 헤더:
  - `Strict-Transport-Security`: HTTPS 강제
  - `X-Content-Type-Options: nosniff`: MIME sniffing 방어
  - `X-Frame-Options: SAMEORIGIN`: Clickjacking 방어
  - `Content-Security-Policy`: XSS / 데이터 인젝션 방어
  - `Cross-Origin-*-Policy`: 사이드 채널 공격 격리
  - `Referrer-Policy: no-referrer`: 외부 사이트로 Referer 노출 방지

### 동시성 통합 테스트 (e2e)
- 동시성 처리 핵심 로직(DB unique 제약 + 트랜잭션)을 실제 동작으로 검증.
- 테스트 시나리오:
  - 동일 좌석에 대한 20개 동시 예매 요청 → 1건만 성공 + 19건 409
  - 서로 다른 좌석 동시 예매 → 모두 성공
  - 단일 요청 내 좌석 중복 → 400 차단
  - 취소 후 동일 좌석 재예매 → 정상 처리
- 실행: `npm run test:e2e`

### 시드 스크립트
- 영화 4편 + 상영관 2개 + 좌석 80석 + 상영 48건을 멱등(idempotent)하게 재구성.
- 매 실행 시 기존 데이터 정리 후 재삽입 → 테스트 환경 일관성 확보.

---

## API 명세

| Method | Endpoint | 설명 | 인증 | Rate Limit |
|--------|----------|------|------|-----------|
| GET | `/api/auth/check-email?email=` | 이메일 사용 가능 여부 확인 | - | 30/분 |
| POST | `/api/auth/signup` | 회원가입 | - | 100/분 |
| POST | `/api/auth/login` | 로그인 | - | 10/분 |
| GET | `/api/auth/me` | 내 정보 조회 | JWT | 100/분 |
| GET | `/api/movies` | 영화 목록 조회 | - | 100/분 |
| GET | `/api/movies/:id` | 영화 상세 조회 | - | 100/분 |
| GET | `/api/screenings?movieId=` | 상영 시간 목록 조회 (영화별 필터) | - | 100/분 |
| GET | `/api/screenings/:id` | 상영 상세 + 좌석 점유 현황 | - | 100/분 |
| POST | `/api/reservations` | 좌석 예매 | JWT | 100/분 |
| GET | `/api/reservations` | 내 예매 내역 조회 | JWT | 100/분 |
| PATCH | `/api/reservations/:id/cancel` | 예매 취소 | JWT | 100/분 |

상세 명세는 Swagger UI (`/api-docs`) 참고.
