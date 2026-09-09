import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { JudicialService } from './judicial.service.js';

@Controller('api/judicial')
export class JudicialController {
  constructor(private readonly judicialService: JudicialService) {}

  /**
   * GET /api/judicial/canton/:codigo
   * Estadísticas policiales para un cantón específico.
   * Query params opcionales: desde, hasta, limit, offset
   */
  @Get('canton/:codigo')
  porCanton(
    @Param('codigo') codigo: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.judicialService.porCanton(codigo, {
      desde,
      hasta,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * GET /api/judicial/canton/:codigo/resumen
   * Conteo de delitos agrupado por tipo para un cantón.
   */
  @Get('canton/:codigo/resumen')
  resumen(
    @Param('codigo') codigo: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.judicialService.resumenPorCanton(codigo, { desde, hasta });
  }

  /**
   * GET /api/judicial/canton/:codigo/mensual
   * Incidentes agrupados por mes para el timeline.
   */
  @Get('canton/:codigo/mensual')
  mensual(
    @Param('codigo') codigo: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.judicialService.porCantonMensual(codigo, { desde, hasta });
  }

  /**
   * GET /api/judicial/status
   * Health check — conteo total de registros en la base.
   */
  @Get('status')
  async status() {
    const total = await this.judicialService.conteoTotal();
    return { fuente: 'OIJ — Estadísticas Policiales', registros: total };
  }

  /**
   * POST /api/judicial/sync
   * Dispara manualmente la descarga e ingesta de datos.
   * Útil para la primera carga y para demos.
   */
  @Post('sync')
  async sync() {
    const resultado = await this.judicialService.descargarYProcesar();
    return {
      mensaje: 'Sincronización completada',
      ...resultado,
    };
  }
}
