import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 기존 데이터 정리 (FK 의존성 역순)
  await prisma.reservationSeat.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.screening.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.theater.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.user.deleteMany();

  // 영화
  const movies = await Promise.all([
    prisma.movie.create({
      data: {
        title: '인터스텔라',
        description:
          '우주를 배경으로 인류의 미래를 찾기 위한 여정을 그린 SF 영화',
        runningTime: 169,
        rating: '12',
        posterUrl:
          'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        releaseDate: new Date('2014-11-06'),
      },
    }),
    prisma.movie.create({
      data: {
        title: '듄',
        description:
          '사막 행성 아라키스를 둘러싼 거대 가문들의 음모와 폴 아트레이데스의 운명을 그린 SF 대서사시',
        runningTime: 155,
        rating: '12',
        posterUrl:
          'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
        releaseDate: new Date('2021-10-20'),
      },
    }),
    prisma.movie.create({
      data: {
        title: '인셉션',
        description:
          '타인의 꿈에 침투해 생각을 훔치는 도둑들의 이야기를 그린 SF 액션',
        runningTime: 148,
        rating: '12',
        posterUrl:
          'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
        releaseDate: new Date('2010-07-21'),
      },
    }),
    prisma.movie.create({
      data: {
        title: '프로젝트 헤일메리',
        description:
          '인류의 멸망을 막기 위해 홀로 우주로 떠난 한 과학자의 사투를 그린 SF',
        runningTime: 142,
        rating: '12',
        posterUrl:
          'https://image.tmdb.org/t/p/w500/qqGpVVZk2KD1lAvccgTU4Z6nh1H.jpg',
        releaseDate: new Date('2026-03-20'),
      },
    }),
  ]);

  // 상영관 (각 5x8 = 40석)
  const theaters = await Promise.all([
    prisma.theater.create({
      data: { name: '1관', totalRows: 5, totalCols: 8 },
    }),
    prisma.theater.create({
      data: { name: '2관', totalRows: 5, totalCols: 8 },
    }),
  ]);

  // 좌석 생성 (A1 ~ E8)
  const rows = ['A', 'B', 'C', 'D', 'E'];
  for (const theater of theaters) {
    const seatData: { theaterId: number; row: string; col: number }[] = [];
    for (const row of rows) {
      for (let col = 1; col <= theater.totalCols; col++) {
        seatData.push({ theaterId: theater.id, row, col });
      }
    }
    await prisma.seat.createMany({ data: seatData });
  }

  // 상영 (오늘 + 1~3일, 각 영화 × 상영관)
  const now = new Date();
  const screenings: { movieId: number; theaterId: number; startTime: Date; price: number }[] =
    [];

  for (let dayOffset = 0; dayOffset < 4; dayOffset++) {
    for (const movie of movies) {
      for (const theater of theaters) {
        // 하루에 두 회차
        for (const hour of [13, 19]) {
          const start = new Date(now);
          start.setDate(start.getDate() + dayOffset);
          start.setHours(hour, 0, 0, 0);

          // 과거 시간은 스킵
          if (start < now) continue;

          screenings.push({
            movieId: movie.id,
            theaterId: theater.id,
            startTime: start,
            price: hour === 13 ? 12000 : 14000,
          });
        }
      }
    }
  }

  for (const s of screenings) {
    const endTime = new Date(s.startTime);
    const movie = movies.find((m) => m.id === s.movieId)!;
    endTime.setMinutes(endTime.getMinutes() + movie.runningTime);

    await prisma.screening.create({
      data: { ...s, endTime },
    });
  }

  console.log(`✅ Seeded ${movies.length} movies`);
  console.log(`✅ Seeded ${theaters.length} theaters with seats`);
  console.log(`✅ Seeded ${screenings.length} screenings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
