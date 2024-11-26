import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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

  @Get('bolsa/details')
  async getBolsaDetails() {
    return this.apiService.getBolsaDetails();
  }

  @Get('bolsa/:codBolsa/cotizacion')
  async getBolsaCotizacionIndice(@Param('codBolsa') codBolsa: string, @Query('fechaDesde') fechaDesde: string, @Query('fechaHasta') fechaHasta: string) {
    return this.apiService.getBolsaCotizacionIndice(codBolsa, fechaDesde, fechaHasta);
  }

  @Post('crear/bolsa/')
  async createBolsa(@Body() body: { code: string; name: string }) {
    return this.apiService.createBolsa(body);
  }

  @Post('bolsa/:codBolsa/cotizacion')
  async createBolsaCotizacionIndice(@Param('codBolsa') codBolsa: string, @Query('fechaDesde') fechaDesde: string, @Query('fechaHasta') fechaHasta: string) {
    return this.apiService.createBolsaCotizacionIndice(codBolsa, fechaDesde, fechaHasta);
  }
}
