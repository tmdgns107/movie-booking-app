import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateReservationDto) {
    const { screeningId, seatIds } = dto;

    // 단일 요청 내 중복 좌석 사전 차단.
    // (DB unique 제약은 동일 요청 내 중복까지는 검출 불가)
    const uniqueSeatIds = [...new Set(seatIds)];
    if (uniqueSeatIds.length !== seatIds.length) {
      throw new BadRequestException('중복된 좌석이 포함되어 있습니다.');
    }

    // 검증부터 좌석 점유까지 단일 트랜잭션으로 처리.
    // 검증과 좌석 생성 사이의 race condition 방지 목적.
    return this.prisma.$transaction(async (tx) => {
      const screening = await tx.screening.findUnique({
        where: { id: screeningId },
        include: { theater: true },
      });
      if (!screening) {
        throw new NotFoundException('상영 정보를 찾을 수 없습니다.');
      }
      if (screening.startTime < new Date()) {
        throw new BadRequestException('이미 시작된 상영은 예매할 수 없습니다.');
      }

      // 좌석은 상영관 단위 관리 → 타 상영관 좌석 혼합 예매 방지
      const seats = await tx.seat.findMany({
        where: { id: { in: uniqueSeatIds } },
      });
      if (seats.length !== uniqueSeatIds.length) {
        throw new NotFoundException('존재하지 않는 좌석이 포함되어 있습니다.');
      }
      const wrongTheater = seats.find((s) => s.theaterId !== screening.theaterId);
      if (wrongTheater) {
        throw new BadRequestException('해당 상영관의 좌석이 아닙니다.');
      }

      const totalPrice = screening.price * uniqueSeatIds.length;

      const reservation = await tx.reservation.create({
        data: {
          userId,
          screeningId,
          totalPrice,
          status: 'CONFIRMED',
        },
      });

      // 동시성 처리의 핵심 지점.
      // ReservationSeat의 @@unique([screeningId, seatId]) 제약에 의존,
      // 동일 좌석 동시 예매 요청 중 단 1건만 성공 보장.
      // 후속 요청은 P2002(unique 위반)로 실패 → 트랜잭션 롤백.
      try {
        await tx.reservationSeat.createMany({
          data: uniqueSeatIds.map((seatId) => ({
            reservationId: reservation.id,
            seatId,
            screeningId,
          })),
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException('이미 예매된 좌석이 포함되어 있습니다.');
        }
        throw error;
      }

      return this.formatReservation(tx, reservation.id);
    });
  }

  async findMine(userId: number) {
    const reservations = await this.prisma.reservation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        screening: {
          include: {
            movie: { select: { title: true, posterUrl: true } },
            theater: { select: { name: true } },
          },
        },
        reservationSeats: {
          include: { seat: { select: { row: true, col: true } } },
        },
      },
    });

    return reservations.map((r) => ({
      id: r.id,
      screeningId: r.screeningId,
      status: r.status,
      totalPrice: r.totalPrice,
      movieTitle: r.screening.movie.title,
      posterUrl: r.screening.movie.posterUrl,
      theaterName: r.screening.theater.name,
      startTime: r.screening.startTime,
      seats: r.reservationSeats.map((rs) => ({
        row: rs.seat.row,
        col: rs.seat.col,
      })),
      createdAt: r.createdAt,
    }));
  }

  async cancel(userId: number, id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { screening: true },
    });
    if (!reservation) throw new NotFoundException('예매 내역이 없습니다.');
    if (reservation.userId !== userId) {
      throw new ForbiddenException('본인의 예매만 취소할 수 있습니다.');
    }
    if (reservation.status === 'CANCELLED') {
      throw new BadRequestException('이미 취소된 예매입니다.');
    }
    if (reservation.screening.startTime < new Date()) {
      throw new BadRequestException(
        '이미 시작된 상영은 취소할 수 없습니다.',
      );
    }

    // status 변경만으로 부족 → ReservationSeat 행 자체 삭제 필요.
    // unique(screeningId, seatId) 제약상 행이 잔존 시 재예매 불가.
    // 좌석 즉시 해제를 위해 매핑 행 삭제.
    return this.prisma.$transaction(async (tx) => {
      await tx.reservationSeat.deleteMany({
        where: { reservationId: id },
      });
      await tx.reservation.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
      return { id, status: 'CANCELLED' as const };
    });
  }

  private async formatReservation(
    tx: Prisma.TransactionClient,
    id: number,
  ) {
    const r = await tx.reservation.findUniqueOrThrow({
      where: { id },
      include: {
        screening: {
          include: {
            movie: { select: { title: true } },
            theater: { select: { name: true } },
          },
        },
        reservationSeats: {
          include: { seat: { select: { row: true, col: true } } },
        },
      },
    });
    return {
      id: r.id,
      screeningId: r.screeningId,
      status: r.status,
      totalPrice: r.totalPrice,
      movieTitle: r.screening.movie.title,
      theaterName: r.screening.theater.name,
      startTime: r.screening.startTime,
      seats: r.reservationSeats.map((rs) => ({
        row: rs.seat.row,
        col: rs.seat.col,
      })),
      createdAt: r.createdAt,
    };
  }
}
