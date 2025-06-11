import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../users/user.module';

@Module({
  imports: [DatabaseModule, EmailModule, UserModule],
  providers: [ReservationService],
  controllers: [ReservationController],
  exports: [ReservationService],
})
export class ReservationModule {}
