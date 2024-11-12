import { Controller, Param, Post, Query } from "@nestjs/common";
import { EmpresaService } from "./empresa.service";


@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Post(':codEmpresa/cotizacion')
  async actualizarCotizacion(@Param('codEmpresa') codEmpresa: string, @Query('fechaDesde') fechaDesde: string, @Query('fechaHasta') fechaHasta: string,) {
    return await this.empresaService.actualizarCotizacion(codEmpresa, fechaDesde, fechaHasta)
  }
}