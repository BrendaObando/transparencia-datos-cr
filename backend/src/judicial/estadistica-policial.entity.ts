import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Canton } from '../cantones/canton.entity.js';

/**
 * Registro de estadística policial del OIJ.
 * Cada fila representa un evento delictivo reportado,
 * normalizado desde los archivos XLSX/CSV del portal de datos abiertos del Poder Judicial.
 */
@Entity('estadisticas_policiales')
export class EstadisticaPolicial {
  @PrimaryGeneratedColumn()
  id: number;

  /** Tipo/subtipo de delito, e.g. "Homicidio", "Robo de vehículo" */
  @Column({ type: 'varchar', length: 200 })
  delito: string;

  /** Fecha del evento */
  @Index()
  @Column({ type: 'date' })
  fecha: string;

  /** Provincia donde ocurrió */
  @Column({ type: 'varchar', length: 50 })
  provincia: string;

  /** Código del cantón — FK a la tabla compartida */
  @Column({ type: 'varchar', length: 3, name: 'canton_codigo' })
  cantonCodigo: string;

  @ManyToOne(() => Canton, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'canton_codigo', referencedColumnName: 'codigo' })
  canton: Canton;

  /** Distrito donde ocurrió (si la fuente lo incluye) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  distrito: string | null;

  /** Sexo de la víctima: M, F, o null si no disponible */
  @Column({ type: 'varchar', length: 20, nullable: true })
  victimaSexo: string | null;

  /** Nacionalidad de la víctima si la fuente la incluye */
  @Column({ type: 'varchar', length: 80, nullable: true })
  victimaNacionalidad: string | null;

  /** Grupo etario de la víctima, e.g. "18-30", "Mayor de 65" */
  @Column({ type: 'varchar', length: 30, nullable: true })
  victimaEdad: string | null;
}
