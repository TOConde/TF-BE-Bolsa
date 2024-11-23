import { Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Cotizacion } from "./entities/cotizacion.entity";
import { Between, Repository } from "typeorm";
import { ApiService } from "src/api/api.service";
import { Empresa } from "./entities/empresa.entity";
import { deUTCaUTCMas3, deUTCMas3aUTC } from "src/utils/dateUtils";
import { Cron } from "@nestjs/schedule";
import * as momentTZ from "moment-timezone";


@Injectable()
export class EmpresaService implements OnModuleInit {
  private readonly logger = new Logger(EmpresaService.name)
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

  async getEmpresa(codEmpresa: string): Promise<Empresa> {
    const empresa = this.empresaRepository.findOne({ where: { codEmpresa } });
    if (!empresa) {
      throw new NotFoundException(`Empresa con código '${codEmpresa}' no encontrada.`);
    }
    return empresa;
  }

  async obtenerUltimaCotizacion(codEmpresa: string): Promise<Cotizacion | null> {
    return this.cotizacionRepository.findOne({
      where: { empresa: { codEmpresa } },
      order: { fecha: 'DESC', hora: 'DESC' },
    });
  }

  async getCotizacionesEmpresa(codEmpresa: string, fechaDesde: string, fechaHasta: string, escala: string): Promise<any[]> {
    const empresa = await this.empresaRepository.findOne({ where: { codEmpresa } });
    if (!empresa) {
      throw new NotFoundException(`Empresa con código '${codEmpresa}' no encontrada.`);
    }

    const fechaInicio = new Date(fechaDesde).toISOString().split('T')[0];
    const fechaFin = new Date(fechaHasta).toISOString().split('T')[0];

    if (escala === 'hora') {
      return this.cotizacionRepository.find({
        where: {
          empresa: { codEmpresa },
          fecha: Between(fechaInicio, fechaFin),
        },
        order: { fecha: 'ASC', hora: 'ASC' },
      });
    } else if (escala === 'dia') {
      return this.cotizacionRepository
        .createQueryBuilder('cotizacion')
        .select('DATE_FORMAT(cotizacion.fecha, "%Y-%m-%d")', 'fecha')
        .addSelect('MIN(cotizacion.cotization)', 'minimo')
        .addSelect('MAX(cotizacion.cotization)', 'maximo')
        .addSelect('SUBSTRING_INDEX(GROUP_CONCAT(cotizacion.cotization ORDER BY cotizacion.hora ASC), ",", 1)', 'apertura')
        .addSelect('SUBSTRING_INDEX(GROUP_CONCAT(cotizacion.cotization ORDER BY cotizacion.hora DESC), ",", 1)', 'cierre')
        .where('cotizacion.idEmpresa = :idEmpresa', { idEmpresa: empresa.id })
        .andWhere('cotizacion.fecha BETWEEN :fechaInicio AND :fechaFin', { fechaInicio, fechaFin })
        .groupBy('DATE_FORMAT(cotizacion.fecha, "%Y-%m-%d")')
        .orderBy('DATE_FORMAT(cotizacion.fecha, "%Y-%m-%d")', 'ASC')
        .getRawMany();
    } else if (escala === 'mes') {
      return this.cotizacionRepository
        .createQueryBuilder('cotizacion')
        .select('DATE_FORMAT(cotizacion.fecha, "%Y-%m")', 'mes')
        .addSelect('MIN(cotizacion.cotization)', 'minimo')
        .addSelect('MAX(cotizacion.cotization)', 'maximo')
        .addSelect('SUBSTRING_INDEX(GROUP_CONCAT(cotizacion.cotization ORDER BY cotizacion.fecha ASC), ",", 1)', 'apertura')
        .addSelect('SUBSTRING_INDEX(GROUP_CONCAT(cotizacion.cotization ORDER BY cotizacion.fecha DESC), ",", 1)', 'cierre')
        .where('cotizacion.idEmpresa = :idEmpresa', { idEmpresa: empresa.id })
        .andWhere('cotizacion.fecha BETWEEN :fechaInicio AND :fechaFin', { fechaInicio, fechaFin })
        .groupBy('DATE_FORMAT(cotizacion.fecha, "%Y-%m")')
        .orderBy('DATE_FORMAT(cotizacion.fecha, "%Y-%m")', 'ASC')
        .getRawMany();
    } else {
      throw new Error(`Escala '${escala}' no soportada. Use 'hora', 'dia' o 'mes'.`);
    }
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
      const { fechaUtc, horaUtc } = deUTCMas3aUTC(ultimaCotizacion.fecha, ultimaCotizacion.hora);
      fechaDesde = momentTZ.tz(`${fechaUtc}T${horaUtc}`, 'UTC').tz('Europe/Istanbul');
    } else {
      fechaDesde = momentTZ.tz('2024-01-01', 'Europe/Istanbul');
    }

    this.logger.log(`Iniciando actualización de cotización para ${codEmpresa}. Fecha desde: ${fechaDesde.format('YYYY-MM-DD HH:mm')}, ahora: ${ahora.format('YYYY-MM-DD HH:mm')}`);

    while (fechaDesde.isBefore(ahora, 'day') || fechaDesde.isSame(ahora, 'day')) {
      // solo días lunes(1) a viernes(5)
      if (fechaDesde.isoWeekday() >= 1 && fechaDesde.isoWeekday() <= 5) {
        // Obtener última hora registrada del día
        let inicioDia: momentTZ.Moment;
        if (ultimaCotizacion && fechaDesde.isSame(momentTZ.tz(ultimaCotizacion.fecha, 'Europe/Istanbul'), 'day')) {
          const ultimaHora = momentTZ.tz(ultimaCotizacion.hora, 'HH:mm', 'Europe/Istanbul').add(1, 'hour');
          if (ultimaHora.hour() > 15) {
            fechaDesde.add(1, 'day');
            continue;
          }
          inicioDia = fechaDesde.clone().hour(ultimaHora.hour()).minute(0);
        } else {
          inicioDia = fechaDesde.clone().hour(9).minute(0);
        }
  
        const finDia = fechaDesde.clone().hour(15).minute(0);
        const rangoFin = fechaDesde.isSame(ahora, 'day') && ahora.isBefore(finDia) ? ahora : finDia;  

        this.logger.log(`Consultando API para empresa ${codEmpresa} entre ${inicioDia.format('YYYY-MM-DD HH:mm')} y ${rangoFin.format('YYYY-MM-DD HH:mm')}`);

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
          console.error(`Error obteniendo datos para ${codEmpresa} en ${fechaDesde.format('YYYY-MM-DD HH:mm')}:`, error,);
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

  @Cron('5 3-9 * * 1-5') // 3-9 hora local(utc-3) -> 9-15 utc+3
  async actualizarDatosEmpresaHora() {
    this.logger.log('Ejecución del cron actualizarDatosEmpresaHora iniciada.')
    const empresas = await this.getAllEmpresas();

    for (const empresa of empresas) {
      try {
        await this.actualizarCotizacion(empresa.codEmpresa);
        this.logger.log(`Cotización actualizada para la empresa ${empresa.codEmpresa}`);
      } catch (error) {
        console.log(`Error actualizando datos de la empresa ${empresa.codEmpresa}:`, error);
        this.logger.error(`Error actualizando datos de la empresa ${empresa.codEmpresa}: ${error.message}`);
      }
    }

    this.logger.log('Ejecución del cron actualizarDatosEmpresaHora finalizada.');
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