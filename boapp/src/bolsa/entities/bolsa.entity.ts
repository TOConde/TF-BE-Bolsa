import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CotizacionIndice } from "./cotiza-indice.entity";

@Entity('bolsas')
export class Bolsa {
  @PrimaryGeneratedColumn({
    type: 'int',
  })
  public id: number;

  @Column({
    name: 'code',
    length: 100,
  })
  public code: string;

  @Column({
    name: 'name',
    length: 100,
  })
  public name: string;

  @OneToMany(() => CotizacionIndice, (cotizacionIndice) => cotizacionIndice.bolsa)
  public cotizacionIndice: CotizacionIndice[];

  constructor(code?: string, name?: string) {
    this.code = code || '';
    this.name = name || '';
  }
}