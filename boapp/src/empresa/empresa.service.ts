import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Cotizacion } from "./entities/cotizacion.entity";
import { Repository } from "typeorm";
import { ApiService } from "src/api/api.service";
import { Empresa } from "./entities/empresa.entity";
import { deUTCaUTCMas3, deUTCMas3aUTC } from "src/utils/dateUtils";
import { Cron } from "@nestjs/schedule";
import * as momentTZ from "moment-timezone";


@Injectable()
export class EmpresaService implements OnModuleInit {
  constructor(
    @InjectRepository(Cotizacion)
    private cotizacionRepository: Repository<Cotizacion>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    private apiService: ApiService,
  ) { }

  async onModuleInit() {
    await this.actualizarDatosIniciales();
  }

  async getAllEmpresas(): Promise<Empresa[]> {
    return this.empresaRepository.find();
  }

  async obtenerUltimaCotizacion(codEmpresa: string): Promise<Cotizacion | null> {
    return this.cotizacionRepository.findOne({
      where: { empresa: { codEmpresa } },
      order: { fecha: 'DESC', hora: 'DESC' },
    });
  }

  async actualizarCotizacion(codEmpresa: string) {
    const empresa = await this.empresaRepository.findOne({ where: { codEmpresa } });

    if (!empresa) {
      throw new NotFoundException(`Empresa con codigo '${codEmpresa}' no encontrada.`);
    }

    const ultimaCotizacion = await this.obtenerUltimaCotizacion(codEmpresa);

    const ahora = momentTZ.tz('Europe/Istanbul') //hora actual en utc+3

    let fechaDesde: momentTZ.Moment;
    if (ultimaCotizacion) {
      // Si hay una última cotización, empezar desde el día siguiente
      const { fechaUtc, horaUtc } = deUTCMas3aUTC(ultimaCotizacion.fecha, ultimaCotizacion.hora);
      fechaDesde = momentTZ.tz(`${fechaUtc}T${horaUtc}`, 'UTC').tz('Europe/Istanbul').startOf('day').add(1, 'day');
    } else {
      fechaDesde = momentTZ.tz('2024-01-01', 'Europe/Istanbul');
    }

    while (fechaDesde.isBefore(ahora, 'day') || fechaDesde.isSame(ahora, 'day')) {
      // solo días lunes(1) a viernes(5)
      if (fechaDesde.isoWeekday() >= 1 && fechaDesde.isoWeekday() <= 5) {
        const inicioDia = fechaDesde.clone().hour(9).minute(0);
        const finDia = fechaDesde.clone().hour(15).minute(0);

        const rangoFin = fechaDesde.isSame(ahora, 'day') && ahora.isBefore(finDia) ? ahora : finDia;

        try {
          const cotizacionDataList = await this.apiService.getEmpresaCotizacion(
            codEmpresa,
            inicioDia.clone().utc().format('YYYY-MM-DDTHH:mm'),
            rangoFin.clone().utc().format('YYYY-MM-DDTHH:mm'),
          );

          const nuevasCotizaciones = cotizacionDataList.map(cotizacionData => {
            const { fechaMas3, horaMas3 } = deUTCaUTCMas3(cotizacionData.fecha, cotizacionData.hora);
            return this.cotizacionRepository.create({
              fecha: fechaMas3,
              hora: horaMas3,
              cotization: cotizacionData.cotization,
              empresa: empresa,
            });
          });

          await this.cotizacionRepository.save(nuevasCotizaciones);
        } catch (error) {
          console.error(
            `Error obteniendo datos para ${codEmpresa} en ${fechaDesde.format('YYYY-MM-DD')}:`,
            error,
          );
        }
      }

      fechaDesde.add(1, 'day');
    }
  }

  async actualizarDatosIniciales() {
    const empresas: Empresa[] = await this.getAllEmpresas();

    for (const empresa of empresas) {
      try {
        await this.actualizarCotizacion(empresa.codEmpresa);
      } catch (error) {
        console.error(`Error actualizando datos iniciales de la empresa ${empresa.codEmpresa}:`, error);
      }
    }
  }

  @Cron('5 * 6-12 * * 1-5')
  async actualizarDatosEmpresaHora() {
    const empresas = await this.getAllEmpresas();

    for (const empresa of empresas) {
      try {
        await this.actualizarCotizacion(empresa.codEmpresa);
      } catch (error) {
        console.log(`Error actualizando datos de la empresa ${empresa.codEmpresa}:`, error);
      }
    }
  }

  async actualizarCotizacionManual(codEmpresa: string, fechaDesde: string, fechaHasta: string) {
    const empresa = await this.empresaRepository.findOne({ where: { codEmpresa } });
    if (!empresa) {
      throw new NotFoundException(`Empresa con codigo '${codEmpresa}' no encontrada.`);
    }

    const cotizacionDataList: any[] = await this.apiService.getEmpresaCotizacion(codEmpresa, fechaDesde, fechaHasta);

    // Recorre el array de cotizaciones y convierte fecha y hora a utc+3
    const nuevasCotizaciones = cotizacionDataList.map(cotizacionData => {
      const { fechaMas3, horaMas3 } = deUTCaUTCMas3(cotizacionData.fecha, cotizacionData.hora);

      return this.cotizacionRepository.create({
        fecha: fechaMas3,
        hora: horaMas3,
        cotization: cotizacionData.cotization,
        empresa: empresa,
      });
    });

    await this.cotizacionRepository.save(nuevasCotizaciones);
  }
}