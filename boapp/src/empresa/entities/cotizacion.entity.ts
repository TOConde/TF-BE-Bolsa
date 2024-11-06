import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity('cotizaciones')
export class cotizaciones {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  public id: number;

  @Column({
    name: 'fecha',
    type: 'varchar',
    precision: 10,
  })
  public fecha: string;

  @Column({
    name: 'hora',
    type: 'varchar',
    precision: 5,
  })
  public hora: string;

  @Column({
    name: 'date',
  })
  public dateUTC: string;

  @Column({
    name: 'cotizacion',
    type: 'decimal',
    precision: 7,
    scale: 2,
  })
  public cotization: number;

  constructor() {}
}