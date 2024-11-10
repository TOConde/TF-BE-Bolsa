import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiService } from './api.service';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) { }

  @Get('empresa/:codEmpresa/details')
  async getEmpresaDetails(@Param('codEmpresa') codEmpresa: string) {
    return this.apiService.getEmpresaDetails(codEmpresa);
  }

  //yyyy/mm/ddT00:00
  @Get('empresa/:codEmpresa/cotizacion')
  async getEmpresaCotizacion(@Param('codEmpresa') codEmpresa: string, @Query('fechaDesde') fechaDesde: string, @Query('fechaHasta') fechaHasta: string) {
    return this.apiService.getEmpresaCotizacion(codEmpresa, fechaDesde, fechaHasta);
  }
}
