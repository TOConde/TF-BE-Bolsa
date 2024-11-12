import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmpresaController } from "./empresa.controller";
import { EmpresaService } from "./empresa.service";
import { Cotizacion } from "./entities/cotizacion.entity";
import { Empresa } from "./entities/empresa.entity";
import { ApiService } from "src/api/api.service";
import { EmpresaSeeder } from "./seed/empresa.seeder";


@Module({
  imports: [TypeOrmModule.forFeature([Cotizacion, Empresa])],
  controllers: [EmpresaController],
  providers: [EmpresaService, ApiService, EmpresaSeeder],
  exports: [EmpresaService, EmpresaSeeder],
})
export class EmpresaModule {}