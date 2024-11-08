import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Empresa } from "../entities/empresa.entity";
import { Repository } from "typeorm";

@Injectable()
export class EmpresaSeeder {
  constructor(
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
  ) {}

  async seed() {
    const empresas = [
      {codEmpresa: "AMZN", empresaNombre: "Amazon.com Inc.", cantidadAcciones: 10000000000},
      {codEmpresa: "XOM", empresaNombre: "ExxonMobil Corporation", cantidadAcciones: 4200000000},
      {codEmpresa: "UNH", empresaNombre: "UnitedHealth Group Incorporated", cantidadAcciones: 950000000},
      {codEmpresa: "PEP", empresaNombre: "PepsiCo, Inc.", cantidadAcciones: 1380000000},
      {codEmpresa: "TTE", empresaNombre: "TotalEnergies SE", cantidadAcciones: 2900000000},
      {codEmpresa: "MSFT", empresaNombre: "Microsoft Corporation", cantidadAcciones: 7495300000},
      {codEmpresa: "KO", empresaNombre: "Coca-Cola Company", cantidadAcciones: 4320000000},
    ];

    const count = await this.empresaRepository.count();
    if (count === 0) {
      await this.empresaRepository.save(empresas);
    }
  }
}