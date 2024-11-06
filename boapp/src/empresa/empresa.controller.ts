import { Controller } from "@nestjs/common";
import { EmpresaService } from "./empresa.service";


@Controller('empresas')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  //geters etc
}