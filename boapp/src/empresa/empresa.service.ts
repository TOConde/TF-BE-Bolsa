import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Cotizacion } from "./entities/cotizacion.entity";
import { Repository } from "typeorm";
import { ApiService } from "src/api/api.service";
import { Empresa } from "./entities/empresa.entity";


@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Cotizacion)
    private cotizacionRepository: Repository<Cotizacion>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    private apiService: ApiService,
  ) {}

  async actualizarCotizacion(codEmpresa: string, fechaDesde: string, fechaHasta: string) {
    const empresa = await this.empresaRepository.findOne({ where: { codEmpresa } });
    if (!empresa) {
      throw new NotFoundException(`Empresa con codigo '${codEmpresa}' no encontrada.`);
    }
  
    const cotizacionDataList = await this.apiService.getEmpresaCotizacion(codEmpresa, fechaDesde, fechaHasta);
    
    // Recorre el array de cotizaciones
    const nuevasCotizaciones = cotizacionDataList.map(cotizacionData => {
      return this.cotizacionRepository.create({
        fecha: cotizacionData.fecha,
        hora: cotizacionData.hora,
        cotization: cotizacionData.cotization,
        empresa: empresa,
      });
    });

    await this.cotizacionRepository.save(nuevasCotizaciones);
  }
}