import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ScreeningsService } from './screenings.service';
import { ScreeningDetailDto, ScreeningSummaryDto } from './screening.dto';

@ApiTags('Screenings')
@Controller('screenings')
export class ScreeningsController {
  constructor(private readonly screeningsService: ScreeningsService) {}

  @Get()
  @ApiOperation({ summary: '상영 시간 목록 조회 (현재 이후만)' })
  @ApiQuery({ name: 'movieId', required: false, type: Number })
  @ApiResponse({ status: 200, type: [ScreeningSummaryDto] })
  findAll(@Query('movieId') movieId?: string) {
    return this.screeningsService.findAll(
      movieId ? parseInt(movieId, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: '상영 상세 조회 (좌석 예매 현황 포함)',
  })
  @ApiResponse({ status: 200, type: ScreeningDetailDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.screeningsService.findDetailWithSeats(id);
  }
}
