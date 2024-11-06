import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
    name: 'cotizationInicial',
    type: 'decimal',
    precision: 7,
    scale: 2,
  })
  public cotizationInicial: number;

  @Column({
    name: 'cantidadAcciones',
    type: 'bigint',
  })
  public cantidadAcciones: number;
}