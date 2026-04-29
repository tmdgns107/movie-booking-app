import { ApiProperty } from '@nestjs/swagger';

export class ReservedSeatDto {
  @ApiProperty() row: string;
  @ApiProperty() col: number;
}

export class ReservationResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() screeningId: number;
  @ApiProperty() status: 'CONFIRMED' | 'CANCELLED';
  @ApiProperty() totalPrice: number;
  @ApiProperty({ type: [ReservedSeatDto] }) seats: ReservedSeatDto[];
  @ApiProperty() movieTitle: string;
  @ApiProperty() theaterName: string;
  @ApiProperty() startTime: Date;
  @ApiProperty() createdAt: Date;
}
