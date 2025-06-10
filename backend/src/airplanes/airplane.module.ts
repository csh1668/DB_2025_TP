import { Module } from '@nestjs/common';
import { AirplaneService } from './airplane.service';
import { AirplaneController } from './airplane.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AirplaneService],
  controllers: [AirplaneController],
  exports: [AirplaneService],
})
export class AirplaneModule {}
