import { Module } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { SeatsController } from './seats.controller';
import { DatabaseModule } from '../database/database.module';
import { AirplaneModule } from '../airplanes/airplane.module';

@Module({
  imports: [DatabaseModule, AirplaneModule],
  providers: [SeatsService],
  controllers: [SeatsController],
  exports: [SeatsService], // 다른 모듈에서 SeatsService를 사용할 수 있도록 내보냄
})
export class SeatsModule {}
