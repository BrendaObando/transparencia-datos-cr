import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Canton } from './canton.entity.js';
import { CANTONES_CR } from './cantones-seed.js';

@Injectable()
export class CantonesService implements OnModuleInit {
  private readonly logger = new Logger(CantonesService.name);

  constructor(
    @InjectRepository(Canton)
    private readonly cantonRepo: Repository<Canton>,
  ) {}

  /**
   * Al iniciar el módulo, seedea los 82 cantones si la tabla está vacía.
   */
  async onModuleInit(): Promise<void> {
    const count = await this.cantonRepo.count();
    if (count > 0) {
      this.logger.log(`Tabla cantones ya tiene ${count} registros, no se hace seed.`);
      return;
    }

    this.logger.log('Seeding 82 cantones de Costa Rica...');
    await this.cantonRepo.save(CANTONES_CR);
    this.logger.log('Seed de cantones completado.');
  }

  async findAll(): Promise<Canton[]> {
    return this.cantonRepo.find({ order: { codigo: 'ASC' } });
  }

  async findByCodigo(codigo: string): Promise<Canton | null> {
    return this.cantonRepo.findOneBy({ codigo });
  }

  async findByProvincia(provincia: string): Promise<Canton[]> {
    return this.cantonRepo.find({
      where: { provincia },
      order: { codigo: 'ASC' },
    });
  }
}
