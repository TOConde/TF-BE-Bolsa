import { TypeOrmModule } from "@nestjs/typeorm";
import { Bolsa } from "./entities/bolsa.entity";
import { CotizacionIndice } from "./entities/cotiza-indice.entity";
import { BolsaController } from "./bolsa.controlle";
import { Module } from "@nestjs/common";
import { ApiService } from "src/api/api.service";
import { BolsaService } from "./bolsa.service";

@Module({
  imports: [TypeOrmModule.forFeature([Bolsa, CotizacionIndice])],
  controllers: [BolsaController],
  providers: [BolsaService, ApiService],
  exports: [BolsaService],
})
export class BolsaModule {}