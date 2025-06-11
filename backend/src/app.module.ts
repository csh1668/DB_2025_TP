import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './users/user.module';
import { AirplaneModule } from './airplanes/airplane.module';
import { ReservationModule } from './reservations/reservation.module';
import { AuthModule } from './auth/auth.module';
import { AirportModule } from './airports/airport.module';
import { SeatsModule } from './seats/seats.module';
import { CancellationModule } from './cancellations/cancellation.module';
import { StatisticsModule } from './statistics/statistics.module';
import { EmailModule } from './email/email.module';

@Module({  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    UserModule,
    AirplaneModule,
    AirportModule,
    SeatsModule,
    ReservationModule,
    CancellationModule,
    AuthModule,
    StatisticsModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
