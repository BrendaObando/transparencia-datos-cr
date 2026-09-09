import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import { Canton } from '../cantones/canton.entity.js';
import { EstadisticaPolicial } from './estadistica-policial.entity.js';

/**
 * Base URL de los CSVs anuales de Estadísticas Policiales del OIJ.
 * Fuente: Portal de Datos Abiertos del Poder Judicial de Costa Rica.
 * Formato: sin headers, 11 columnas separadas por coma:
 *   0: Delito, 1: SubDelito, 2: Fecha (YYYY-MM-DD), 3: TipoVictima,
 *   4: SubTipoVictima, 5: GrupoEdad, 6: Sexo, 7: Nacionalidad,
 *   8: Provincia, 9: Cantón, 10: Distrito
 *
 * @see https://datosabiertospj.poder-judicial.go.cr/dataset/estadisticas-policiales
 */
const CSV_BASE =
  'https://pjcrdatosabiertos.blob.core.windows.net/datosabiertos/PJCROD_POLICIALES_V1/PJCROD_POLICIALES_V1';

/** Años a descargar. Se pueden agregar más si se quiere histórico. */
const ANIOS = [2024, 2025, 2026];

@Injectable()
export class JudicialService {
  private readonly logger = new Logger(JudicialService.name);

  constructor(
    @InjectRepository(EstadisticaPolicial)
    private readonly estadisticaRepo: Repository<EstadisticaPolicial>,
    @InjectRepository(Canton)
    private readonly cantonRepo: Repository<Canton>,
  ) {}

  /**
   * Cron: refresca datos cada domingo a las 3 AM.
   * La fuente se actualiza mensualmente; semanal es suficiente.
   */
  @Cron(CronExpression.EVERY_WEEK)
  async refrescarDatos(): Promise<void> {
    this.logger.log('Iniciando descarga de estadísticas policiales del OIJ...');
    try {
      const resultado = await this.descargarYProcesar();
      this.logger.log(
        `Datos del OIJ actualizados: ${resultado.insertados} registros de ${resultado.filasLeidas} filas.`,
      );
    } catch (error) {
      this.logger.error(
        'Error al refrescar datos del OIJ — se mantiene el último dato cacheado.',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  /**
   * Descarga los CSVs del OIJ, los parsea, normaliza y guarda en la base.
   * Reemplaza todos los datos existentes (full refresh).
   */
  async descargarYProcesar(): Promise<{ filasLeidas: number; insertados: number }> {
    const cantones = await this.cantonRepo.find();
    const cantonMap = this.construirMapaCantones(cantones);

    let todosRegistros: Partial<EstadisticaPolicial>[] = [];
    let filasLeidas = 0;

    for (const anio of ANIOS) {
      const url = `${CSV_BASE}-${anio}.csv`;
      this.logger.log(`Descargando ${url}...`);
      try {
        const response = await axios.get<string>(url, {
          responseType: 'text',
          timeout: 60_000,
        });
        const filas = response.data.split('\n').filter((l) => l.trim().length > 0);
        filasLeidas += filas.length;
        const registros = this.parsearCSV(filas, cantonMap);
        todosRegistros = todosRegistros.concat(registros);
        this.logger.log(`  ${anio}: ${filas.length} filas → ${registros.length} registros válidos`);
      } catch (err) {
        // Si un año no existe (e.g. 2026 muy temprano), seguir con los demás
        this.logger.warn(`  ${anio}: no disponible o error, se omite.`);
      }
    }

    if (todosRegistros.length === 0) {
      this.logger.warn('No se obtuvieron registros de ningún año. Se conservan datos previos.');
      return { filasLeidas, insertados: 0 };
    }

    // Full refresh: limpiar y reemplazar
    await this.estadisticaRepo.clear();

    const BATCH_SIZE = 500;
    let insertados = 0;
    for (let i = 0; i < todosRegistros.length; i += BATCH_SIZE) {
      const batch = todosRegistros.slice(i, i + BATCH_SIZE);
      await this.estadisticaRepo.save(batch);
      insertados += batch.length;
    }

    return { filasLeidas, insertados };
  }

  /**
   * Parsea filas CSV del OIJ (sin headers, 11 columnas) a entidades.
   */
  private parsearCSV(
    filas: string[],
    cantonMap: Map<string, string>,
  ): Partial<EstadisticaPolicial>[] {
    const registros: Partial<EstadisticaPolicial>[] = [];

    for (const fila of filas) {
      const cols = fila.split(',');
      if (cols.length < 10) continue;

      const delito = cols[0]?.trim();
      const subDelito = cols[1]?.trim();
      const fecha = cols[2]?.trim();
      // cols[3] = TipoVictima, cols[4] = SubTipoVictima (informativo, no lo guardamos aparte)
      const grupoEdad = cols[5]?.trim() || null;
      const sexo = cols[6]?.trim() || null;
      const nacionalidad = cols[7]?.trim() || null;
      const provincia = cols[8]?.trim();
      const cantonNombre = cols[9]?.trim();
      const distrito = cols[10]?.trim() || null;

      if (!delito || !fecha || !provincia || !cantonNombre) continue;

      // Validar formato de fecha YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) continue;

      // Buscar código de cantón
      const cantonKey = this.normalizarTexto(`${provincia}|${cantonNombre}`);
      const cantonCodigo = cantonMap.get(cantonKey);
      if (!cantonCodigo) continue;

      const delitoCompleto = subDelito ? `${delito} — ${subDelito}` : delito;

      registros.push({
        delito: delitoCompleto.substring(0, 200),
        fecha,
        provincia,
        cantonCodigo,
        distrito,
        victimaSexo: sexo && sexo !== 'Desconocido' ? sexo : null,
        victimaNacionalidad:
          nacionalidad && nacionalidad !== 'Desconocido' ? nacionalidad : null,
        victimaEdad: grupoEdad && grupoEdad !== 'Desconocido' ? grupoEdad.trim() : null,
      });
    }

    return registros;
  }

  /**
   * Construye un mapa nombre normalizado → código de cantón.
   */
  private construirMapaCantones(cantones: Canton[]): Map<string, string> {
    const mapa = new Map<string, string>();
    for (const c of cantones) {
      const key = this.normalizarTexto(`${c.provincia}|${c.nombre}`);
      mapa.set(key, c.codigo);
    }
    return mapa;
  }

  /** Quita tildes y pone en minúsculas para comparar nombres. */
  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();
  }

  // ─── Métodos de consulta para el controller ───────────────────────

  /** Estadísticas filtradas por cantón, con paginación y rango de fechas. */
  async porCanton(
    cantonCodigo: string,
    opciones?: { desde?: string; hasta?: string; limit?: number; offset?: number },
  ): Promise<EstadisticaPolicial[]> {
    const qb = this.estadisticaRepo
      .createQueryBuilder('e')
      .where('e.canton_codigo = :cantonCodigo', { cantonCodigo });

    if (opciones?.desde) qb.andWhere('e.fecha >= :desde', { desde: opciones.desde });
    if (opciones?.hasta) qb.andWhere('e.fecha <= :hasta', { hasta: opciones.hasta });

    qb.orderBy('e.fecha', 'DESC');
    qb.limit(opciones?.limit ?? 100);
    if (opciones?.offset) qb.offset(opciones.offset);

    return qb.getMany();
  }

  /** Resumen: conteo de delitos agrupado por tipo para un cantón. */
  async resumenPorCanton(
    cantonCodigo: string,
    opciones?: { desde?: string; hasta?: string },
  ): Promise<{ delito: string; total: number }[]> {
    const qb = this.estadisticaRepo
      .createQueryBuilder('e')
      .select('e.delito', 'delito')
      .addSelect('COUNT(*)::int', 'total')
      .where('e.canton_codigo = :cantonCodigo', { cantonCodigo })
      .groupBy('e.delito')
      .orderBy('total', 'DESC');

    if (opciones?.desde) qb.andWhere('e.fecha >= :desde', { desde: opciones.desde });
    if (opciones?.hasta) qb.andWhere('e.fecha <= :hasta', { hasta: opciones.hasta });

    return qb.getRawMany();
  }

  /** Incidentes agrupados por mes para un cantón (para el timeline). */
  async porCantonMensual(
    cantonCodigo: string,
    opciones?: { desde?: string; hasta?: string },
  ): Promise<{ mes: string; casos: number }[]> {
    const qb = this.estadisticaRepo
      .createQueryBuilder('e')
      .select("TO_CHAR(e.fecha, 'YYYY-MM')", 'mes')
      .addSelect('COUNT(*)::int', 'casos')
      .where('e.canton_codigo = :cantonCodigo', { cantonCodigo })
      .groupBy('mes')
      .orderBy('mes', 'ASC');

    if (opciones?.desde) qb.andWhere('e.fecha >= :desde', { desde: opciones.desde });
    if (opciones?.hasta) qb.andWhere('e.fecha <= :hasta', { hasta: opciones.hasta });

    return qb.getRawMany();
  }

  /** Conteo total de registros (para health check). */
  async conteoTotal(): Promise<number> {
    return this.estadisticaRepo.count();
  }
}
