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
  public codempresa: string;

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

  constructor(codempresa?: string, empresaNombre?: string, cantidadAcciones?: number) {
    this.codempresa = codempresa || '';
    this.empresaNombre = empresaNombre || '';
    this.cantidadAcciones = cantidadAcciones || 0;
  }
}