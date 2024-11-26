import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CotizacionIndice } from "./entities/cotiza-indice.entity";
import { Repository } from "typeorm";
import { Bolsa } from "./entities/bolsa.entity";


@Injectable()
export class BolsaService {
  constructor (
    @InjectRepository(CotizacionIndice)
    private cotizacionIndiceRepository: Repository<CotizacionIndice>,
    @InjectRepository(Bolsa)
    private bolsaRepository: Repository<Bolsa>,
  ) {}
}