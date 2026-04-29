import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScreeningsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(movieId?: number) {
    // 이미 시작된 상영은 예매 불가 → 목록에서도 제외.
    return this.prisma.screening.findMany({
      where: {
        ...(movieId ? { movieId } : {}),
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
      include: {
        movie: { select: { id: true, title: true, runningTime: true, posterUrl: true, rating: true } },
        theater: { select: { id: true, name: true } },
      },
    });
  }

  async findDetailWithSeats(id: number) {
    const screening = await this.prisma.screening.findUnique({
      where: { id },
      include: {
        movie: true,
        theater: {
          include: {
            seats: { orderBy: [{ row: 'asc' }, { col: 'asc' }] },
          },
        },
      },
    });
    if (!screening) throw new NotFoundException('상영 정보를 찾을 수 없습니다.');

    // CANCELLED 상태 예매는 좌석 미점유 → 제외.
    // (취소 시 ReservationSeat 행 삭제가 기본이나, 이중 안전장치로 status 필터 병행)
    const reserved = await this.prisma.reservationSeat.findMany({
      where: {
        screeningId: id,
        reservation: { status: 'CONFIRMED' },
      },
      select: { seatId: true },
    });
    // 좌석 수 증가 시 Array.includes() O(N) 대비, Set 조회로 O(1) 검사 확보
    const reservedSet = new Set(reserved.map((r) => r.seatId));

    return {
      id: screening.id,
      movieId: screening.movieId,
      movie: screening.movie,
      startTime: screening.startTime,
      endTime: screening.endTime,
      price: screening.price,
      theater: {
        id: screening.theater.id,
        name: screening.theater.name,
        totalRows: screening.theater.totalRows,
        totalCols: screening.theater.totalCols,
      },
      seats: screening.theater.seats.map((s) => ({
        id: s.id,
        row: s.row,
        col: s.col,
        reserved: reservedSet.has(s.id),
      })),
    };
  }
}
