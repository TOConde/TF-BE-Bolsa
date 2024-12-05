import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { EmpresaService } from "./empresa.service";


@Controller('empresas')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) { }

  @Get()
  async getAllEmpresas() {
    return await this.empresaService.getAllEmpresas();
  }

  @Post(':codEmpresa/cotizaciones')
  async actualizarCotizacionManual(@Param('codEmpresa') codEmpresa: string, @Query('fechaDesde') fechaDesde: string, @Query('fechaHasta') fechaHasta: string,) {
    return await this.empresaService.actualizarCotizacionManual(codEmpresa, fechaDesde, fechaHasta);
  }

  @Get(':codEmpresa/cotizaciones')
  async getCotizacionesEmpresa(@Param('codEmpresa') codEmpresa: string, @Query('fechaDesde') fechaDesde: string, @Query('fechaHasta') fechaHasta: string, @Query('escala') escala: string) {
    return await this.empresaService.getCotizacionesEmpresa(codEmpresa, fechaDesde, fechaHasta, escala);
  }

  @Get(':codEmpresa/ultima/cotizacion')
  async getUltimaCotizacion(@Param('codEmpresa') codEmpresa: string) {
    return await this.empresaService.getUltimaCotizacion(codEmpresa);
  }

  @Get(':codEmpresa')
  async getEmpresa(@Param('codEmpresa') codEmpresa: string) {
    return await this.empresaService.getEmpresa(codEmpresa);
  }
}