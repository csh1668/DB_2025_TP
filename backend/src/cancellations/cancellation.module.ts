import { Module } from '@nestjs/common';
import { CancellationService } from './cancellation.service';
import { CancellationController } from './cancellation.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [CancellationService],
  controllers: [CancellationController],
  exports: [CancellationService],
})
export class CancellationModule {}
