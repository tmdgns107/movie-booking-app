import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ example: 1, description: '상영 ID' })
  @IsInt()
  @Min(1)
  screeningId: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: '예매할 좌석 ID 목록',
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  seatIds: number[];
}
