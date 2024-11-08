import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Cotizacion } from "./cotizacion.entity";

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  public id: number;

  @Column({
  name: 'codEmpresa',
    length: 100,
  })
  public codEmpresa: string;

  @Column({
    name: 'empresaNombre',
    length: 100,
  })
  public empresaNombre: string;

  @Column({
    name: 'cantidadAcciones',
    type: 'bigint',
  })
  public cantidadAcciones: number;

  @OneToMany(() => Cotizacion, (cotizacion) => cotizacion.empresa)
  public cotizaciones: Cotizacion[];

  constructor(codEmpresa?: string, empresaNombre?: string, cantidadAcciones?: number) {
    this.codEmpresa = codEmpresa || '';
    this.empresaNombre = empresaNombre || '';
    this.cantidadAcciones = cantidadAcciones || 0;
  }
}