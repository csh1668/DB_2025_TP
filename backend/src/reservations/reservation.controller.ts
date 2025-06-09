import { Controller, Get, Post, Delete, Body, Param, Put } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { Reservation } from './reservation.interface';

@Controller('reservations')
export class ReservationController {
  constructor(private reservationService: ReservationService) {}

  @Get()
  findAll(): Promise<Reservation[]> {
    return this.reservationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Reservation | null> {
    return this.reservationService.findOne(+id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string): Promise<Reservation[]> {
    return this.reservationService.findByUserId(+userId);
  }

  @Post()
  create(@Body() reservation: Omit<Reservation, 'reservationId' | 'reservationDate'>): Promise<Reservation> {
    return this.reservationService.create(reservation);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<number> {
    return this.reservationService.updateStatus(+id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<number> {
    return this.reservationService.delete(+id);
  }
}
