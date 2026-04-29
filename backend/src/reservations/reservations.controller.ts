import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {ReservationsService} from './reservations.service';
import {CreateReservationDto} from './dto/create-reservation.dto';
import {ReservationResponseDto} from './dto/reservation-response.dto';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import type {CurrentUserType} from '../auth/decorators/current-user.decorator';

@ApiTags('Reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationsController {
    constructor(private readonly reservationsService: ReservationsService) {}

    @Post()
    @ApiOperation({summary: '좌석 예매'})
    @ApiResponse({status: 201, type: ReservationResponseDto})
    @ApiResponse({status: 409, description: '이미 예매된 좌석'})
    create(
        @CurrentUser() user: CurrentUserType,
        @Body() dto: CreateReservationDto,
    ) {
        return this.reservationsService.create(user.id, dto);
    }

    @Get()
    @ApiOperation({summary: '내 예매 내역 조회'})
    @ApiResponse({status: 200, type: [ReservationResponseDto]})
    findMine(@CurrentUser() user: CurrentUserType) {
        return this.reservationsService.findMine(user.id);
    }

    @Patch(':id/cancel')
    @ApiOperation({summary: '예매 취소'})
    cancel(
        @CurrentUser() user: CurrentUserType,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.reservationsService.cancel(user.id, id);
    }
}
