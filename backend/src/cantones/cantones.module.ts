import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Canton } from './canton.entity.js';
import { CantonesController } from './cantones.controller.js';
import { CantonesService } from './cantones.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Canton])],
  controllers: [CantonesController],
  providers: [CantonesService],
  exports: [TypeOrmModule, CantonesService],
})
export class CantonesModule {}
