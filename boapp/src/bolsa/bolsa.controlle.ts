import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { BolsaService } from "./bolsa.service";


@Controller('bolsas')
export class BolsaController {
  constructor(private readonly bolsaService: BolsaService) { }

  @Get()
  async getAllBolsas() {
    return await this.bolsaService.getAllBolsas();
  }

  @Get(':code/cotizaciones')
  async getCotizacionesEmpresa(@Param('code') code: string, @Query('fechaDesde') fechaDesde: string, @Query('fechaHasta') fechaHasta: string, @Query('escala') escala: string) {
    return await this.bolsaService.getCotizacionesBolsa(code, fechaDesde, fechaHasta, escala);
  }

  @Get(':code')
  async getBolsa(@Param('code') code: string) {
    return await this.bolsaService.getBolsa(code)
  }
}