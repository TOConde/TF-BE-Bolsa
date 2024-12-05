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
      {codEmpresa: "AMZN", empresaNombre: "Amazon.com Inc.", cantidadAcciones: 10000000000, empresaDetails: "Amazon.com, Inc. es una corporación estadounidense de comercio electrónico y servicios de computación en la nube a todos los niveles con sede en la ciudad de Seattle, Washington."},
      {codEmpresa: "XOM", empresaNombre: "ExxonMobil Corporation", cantidadAcciones: 4200000000, empresaDetails: "ExxonMobil Corporation es una empresa petrolera y gasista estadounidense, la mayor del país en su sector. Fue fundada como Standard Oil Company en 1870 por John D. Rockefeller."},
      {codEmpresa: "UNH", empresaNombre: "UnitedHealth Group Incorporated", cantidadAcciones: 950000000, empresaDetails: "UnitedHealthcare es una empresa estadounidense de seguros de salud. Tiene su sede en Minnetonka, Minnesota, en la área metropolitana de Mineápolis–Saint Paul."},
      {codEmpresa: "PEP", empresaNombre: "PepsiCo, Inc.", cantidadAcciones: 1380000000, empresaDetails: "PepsiCo, Inc. es una empresa multinacional estadounidense dedicada a la fabricación, comercialización y distribución de bebidas y aperitivos. Tiene su sede en Purchase, Nueva York, Estados Unidos."},
      {codEmpresa: "TTE", empresaNombre: "TotalEnergies SE", cantidadAcciones: 2900000000, empresaDetails: "TotalEnergies SE es un grupo empresarial del sector petroquímico y energético con sede mundial en La Défense (Francia). Su actividad se encuentra presente en más de 130 países, empleando a unas 105 000 personas."},
      {codEmpresa: "MSFT", empresaNombre: "Microsoft Corporation", cantidadAcciones: 7495300000, empresaDetails: "Microsoft Corporation es una corporación tecnológica multinacional estadounidense con sede en Redmond, Washington. Los productos de software más conocidos de Microsoft son la línea de sistemas operativos Microsoft Windows."},
      {codEmpresa: "KO", empresaNombre: "Coca-Cola Company", cantidadAcciones: 4320000000, empresaDetails: "The Coca-Cola Company es una corporación multinacional estadounidense de bebidas con sede en Atlanta, Georgia. Tiene intereses en la fabricación, venta minorista y comercialización de concentrados y jarabes para bebidas no alcohólicas."},
    ];

    const count = await this.empresaRepository.count();
    if (count === 0) {
      await this.empresaRepository.save(empresas);
    }
  }
}