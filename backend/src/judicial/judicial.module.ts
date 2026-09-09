import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Canton } from '../cantones/canton.entity.js';
import { EstadisticaPolicial } from './estadistica-policial.entity.js';
import { JudicialController } from './judicial.controller.js';
import { JudicialService } from './judicial.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([EstadisticaPolicial, Canton])],
  controllers: [JudicialController],
  providers: [JudicialService],
})
export class JudicialModule {}
