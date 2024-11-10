import { Controller, Get, Param } from '@nestjs/common';
import { ApiService } from './api.service';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('empresaDetails/:codEmpresa')
  async getEmpresaDetails(@Param('codEmpresa') codEmpresa: string) {
    return this.apiService.getEmpresaDetails(codEmpresa);
  }
}
