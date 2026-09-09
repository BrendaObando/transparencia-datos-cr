import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Canton } from './canton.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Canton])],
  exports: [TypeOrmModule],
})
export class CantonesModule {}
