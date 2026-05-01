import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

/**
 * 좌석 예매 동시성 통합 테스트.
 *
 * README와 코드 주석에서 강조한 "DB unique 제약 + 트랜잭션" 동시성 처리가
 * 실제로 동작함을 증명한다.
 *
 * 주의: ThrottlerGuard에 의해 분당 100회 제한이 걸려 있으므로
 *       큰 N으로 테스트 시 429가 섞여 들어올 수 있다.
 *       테스트 신뢰성을 위해 Throttler를 e2e에서는 우회 필요 시 별도 처리.
 */
const TEST_EMAIL = `concurrent_${Date.now()}@test.com`;
const TEST_PASSWORD = 'SecurePw!42';

describe('Reservations - 동시성 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let screeningId: number;
  let availableSeatIds: number[];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // 회원가입 → 토큰 확보
    const signupRes = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: '동시성테스트',
      });
    expect(signupRes.status).toBe(201);
    token = signupRes.body.accessToken;

    // 미래 상영 + 비어있는 좌석 확보
    const screening = await prisma.screening.findFirst({
      where: { startTime: { gte: new Date() } },
      orderBy: { startTime: 'asc' },
    });
    if (!screening) {
      throw new Error('테스트용 미래 상영 데이터 없음. 시드를 먼저 실행할 것.');
    }
    screeningId = screening.id;

    const seats = await prisma.seat.findMany({
      where: { theaterId: screening.theaterId },
      orderBy: [{ row: 'asc' }, { col: 'asc' }],
      take: 5,
    });
    availableSeatIds = seats.map((s) => s.id);
  });

  afterAll(async () => {
    // 테스트로 생성된 데이터 정리
    const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    if (user) {
      await prisma.reservationSeat.deleteMany({
        where: { reservation: { userId: user.id } },
      });
      await prisma.reservation.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await app.close();
  });

  it('동일 좌석에 대한 동시 예매 요청 중 1건만 성공해야 한다', async () => {
    const N = 20;
    const targetSeatId = availableSeatIds[0];

    const requests = Array.from({ length: N }, () =>
      request(app.getHttpServer())
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ screeningId, seatIds: [targetSeatId] }),
    );

    const results = await Promise.all(requests);

    const successes = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);

    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(N - 1);

    // DB 검증: 해당 좌석에 ReservationSeat이 정확히 1건만 존재
    const count = await prisma.reservationSeat.count({
      where: { screeningId, seatId: targetSeatId },
    });
    expect(count).toBe(1);
  });

  it('서로 다른 좌석에 대한 동시 예매는 모두 성공해야 한다', async () => {
    // 위 테스트에서 사용한 좌석은 제외
    const independentSeats = availableSeatIds.slice(1, 4);

    const requests = independentSeats.map((seatId) =>
      request(app.getHttpServer())
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ screeningId, seatIds: [seatId] }),
    );

    const results = await Promise.all(requests);
    const successes = results.filter((r) => r.status === 201);

    expect(successes).toHaveLength(independentSeats.length);
  });

  it('단일 요청 내 같은 좌석 중복 시 400으로 차단되어야 한다', async () => {
    const seatId = availableSeatIds[4];

    const res = await request(app.getHttpServer())
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ screeningId, seatIds: [seatId, seatId] });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('중복');
  });

  it('예매 취소 후 동일 좌석을 즉시 재예매할 수 있어야 한다', async () => {
    const seatId = availableSeatIds[4];

    // 1) 예매
    const reserveRes = await request(app.getHttpServer())
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ screeningId, seatIds: [seatId] });
    expect(reserveRes.status).toBe(201);
    const reservationId = reserveRes.body.id;

    // 2) 취소
    const cancelRes = await request(app.getHttpServer())
      .patch(`/api/reservations/${reservationId}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(cancelRes.status).toBe(200);

    // 3) 같은 좌석 재예매 → 성공해야 함
    const reReserveRes = await request(app.getHttpServer())
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ screeningId, seatIds: [seatId] });
    expect(reReserveRes.status).toBe(201);
  });
});
