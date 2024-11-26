import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CotizacionIndice } from "./entities/cotiza-indice.entity";
import { Repository } from "typeorm";
import { Bolsa } from "./entities/bolsa.entity";
import { ApiService } from "src/api/api.service";


@Injectable()
export class BolsaService implements OnModuleInit {
  private readonly logger = new Logger(BolsaService.name)
  constructor(
    @InjectRepository(CotizacionIndice)
    private cotizacionIndiceRepository: Repository<CotizacionIndice>,
    @InjectRepository(Bolsa)
    private bolsaRepository: Repository<Bolsa>,
    private apiservice: ApiService,
  ) { }

  async onModuleInit() {
    await this.actualizarBolsas();
  }

  async getAllBolsas(): Promise<Bolsa[]> {
    return await this.bolsaRepository.find();
  }

  async actualizarBolsas() {
    try {
      const bolsasApi = await this.apiservice.getBolsaDetails();
      const bolsasValidas = bolsasApi.filter((bolsa: any) => bolsa.code?.trim());

      const bolsasDB = await this.getAllBolsas();
      const bolsasExistentes = new Set(bolsasDB.map((bolsa) => bolsa.code))

      const bolsasNuevas = bolsasValidas.filter((bolsa: any) => !bolsasExistentes.has(bolsa.code))

      if (bolsasNuevas.length > 0) {
        this.logger.log(`Nuevas bolsas a agregar: ${bolsasNuevas.length}`);

        const bolsasEntities = bolsasNuevas.map((bolsa: any) => {
          this.logger.log(`Agregando bolsa con code: ${bolsa.code} y name: ${bolsa.name}`);
          return this.bolsaRepository.create({ code: bolsa.code, name: bolsa.name })
        });

        await this.bolsaRepository.save(bolsasEntities);
      } else {
        this.logger.log(`No hay bolsas nuevas para agregar`);
      }
    } catch (error) {
      this.logger.error(`Error al actualizar bolsas desde la api: ${error.message}`)
    }
  }
}