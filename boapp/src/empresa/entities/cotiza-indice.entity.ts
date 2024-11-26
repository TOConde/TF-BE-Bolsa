import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Bolsa } from "./bolsa.entity";

@Entity('cotizacionesIndices')
export class CotizacionIndice {
  @PrimaryGeneratedColumn({
    type: 'int',
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
    name: 'valor',
    type: 'decimal',
    precision: 7,
    scale: 2,
  })
  public valor: number;

  @ManyToOne(() => Bolsa)
  @JoinColumn({
    name: 'idBolsa',
    referencedColumnName: 'id'
  })
  bolsa: Bolsa;

  constructor() {}
}