import { Controller, Get, Param, Post } from "@nestjs/common";
import { BolsaService } from "./bolsa.service";


@Controller('bolsas')
export class BolsaController {
  constructor(private readonly bolsaService: BolsaService) { }

  @Get()
  async getAllBolsas() {
    return await this.bolsaService.getAllBolsas();
  }

  @Get(':code')
  async getBolsa(@Param('code') code: string) {
    return await this.bolsaService.getBolsa(code)
  }
}