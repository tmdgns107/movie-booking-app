import { ApiProperty } from '@nestjs/swagger';

export class TheaterDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty() totalRows: number;
  @ApiProperty() totalCols: number;
}

export class ScreeningSummaryDto {
  @ApiProperty() id: number;
  @ApiProperty() movieId: number;
  @ApiProperty() theaterId: number;
  @ApiProperty() startTime: Date;
  @ApiProperty() endTime: Date;
  @ApiProperty() price: number;
}

export class SeatStatusDto {
  @ApiProperty() id: number;
  @ApiProperty() row: string;
  @ApiProperty() col: number;
  @ApiProperty({ description: '예매 여부' }) reserved: boolean;
}

export class ScreeningDetailDto {
  @ApiProperty() id: number;
  @ApiProperty() movieId: number;
  @ApiProperty() startTime: Date;
  @ApiProperty() endTime: Date;
  @ApiProperty() price: number;
  @ApiProperty({ type: TheaterDto }) theater: TheaterDto;
  @ApiProperty({ type: [SeatStatusDto] }) seats: SeatStatusDto[];
}
