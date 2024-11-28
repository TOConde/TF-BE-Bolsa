import { Controller, Get, Post } from "@nestjs/common";
import { BolsaService } from "./bolsa.service";


@Controller('bolsas')
export class BolsaController {
  constructor(private readonly bolsaService: BolsaService) { }

  @Get()
  async getAllBolsas() {
    return await this.bolsaService.getAllBolsas();
  }

  
}