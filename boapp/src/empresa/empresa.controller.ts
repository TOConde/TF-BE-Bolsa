import { Controller, Param, Post, Query } from "@nestjs/common";
import { EmpresaService } from "./empresa.service";


@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Post(':codEmpresa/cotizacion')
  async actualizarCotizacionManual(@Param('codEmpresa') codEmpresa: string, @Query('fechaDesde') fechaDesde: string, @Query('fechaHasta') fechaHasta: string,) {
    return await this.empresaService.actualizarCotizacionManual(codEmpresa, fechaDesde, fechaHasta)
  }
}