import { ApiProperty } from '@nestjs/swagger';

export class MovieDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '인터스텔라' })
  title: string;

  @ApiProperty({ example: '우주를 배경으로 한 SF 영화' })
  description: string;

  @ApiProperty({ example: 169, description: '상영 시간(분)' })
  runningTime: number;

  @ApiProperty({ example: '12', enum: ['ALL', '12', '15', '19'] })
  rating: string;

  @ApiProperty({ example: 'https://example.com/poster.jpg', nullable: true })
  posterUrl: string | null;

  @ApiProperty({ example: '2014-11-06T00:00:00.000Z' })
  releaseDate: Date;
}
