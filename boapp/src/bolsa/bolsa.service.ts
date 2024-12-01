import { Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CotizacionIndice } from "./entities/cotiza-indice.entity";
import { Between, Repository } from "typeorm";
import { Bolsa } from "./entities/bolsa.entity";
import { ApiService } from "src/api/api.service";
import { EmpresaService } from "src/empresa/empresa.service";
import * as momentTZ from "moment-timezone";
import { Cron } from "@nestjs/schedule";
import { deUTCMas3aUTC } from "src/utils/dateUtils";

@Injectable()
export class BolsaService implements OnModuleInit {
  private readonly logger = new Logger(BolsaService.name)
  constructor(
    @InjectRepository(CotizacionIndice)
    private cotizacionIndiceRepository: Repository<CotizacionIndice>,
    @InjectRepository(Bolsa)
    private bolsaRepository: Repository<Bolsa>,
    private apiservice: ApiService,
    private empresaService: EmpresaService
  ) { }

  async onModuleInit() {
    this.logger.log('Init: actualizarBolsas');
    await this.actualizarBolsas();
    this.logger.log('Init: crearCotizacionesBIST');
    await this.crearCotizacionesBIST();
    this.logger.log('Init: actualizarCotizacionBolsasApi');
    await this.actualizarCotizacionBolsasApi();
    this.logger.log('Init: postCotizacionBolsaApi');
    await this.postCotizacionBolsaApi();
  }

  async getAllBolsas(): Promise<Bolsa[]> {
    return await this.bolsaRepository.find();
  }

  async getBolsa(code: string): Promise<Bolsa> {
    const empresa = this.bolsaRepository.findOne({ where: { code } });
    if (!empresa) {
      throw new NotFoundException(`Empresa con código '${code}' no encontrada.`);
    }
    return empresa;
  }

  async getCotizacionesBolsa(code: string, fechaDesde: string, fechaHasta: string, escala: string): Promise<any[]> {
    const bolsa = await this.bolsaRepository.findOne({ where: { code } });
    if (!bolsa) {
      throw new NotFoundException(`Bolsa con código '${code}' no encontrada.`);
    }

    const fechaInicio = new Date(fechaDesde).toISOString().split('T')[0];
    const fechaFin = new Date(fechaHasta).toISOString().split('T')[0];

    this.logger.log(`Iniciando getCotizacionesBolsa para ${code}. Fecha desde: ${fechaInicio}, fecha fin: ${fechaFin} escala: ${escala}`);

    if (escala === 'dia') {
      return this.cotizacionIndiceRepository
        .createQueryBuilder('cotizacionesindices')
        .select('DATE_FORMAT(cotizacionesindices.fecha, "%Y-%m-%d")', 'fecha')
        .addSelect('MIN(cotizacionesindices.valor)', 'minimo')
        .addSelect('MAX(cotizacionesindices.valor)', 'maximo')
        .addSelect('SUBSTRING_INDEX(GROUP_CONCAT(cotizacionesindices.valor ORDER BY CONCAT(cotizacionesindices.fecha, " ", cotizacionesindices.hora) ASC), ",", 1)', 'apertura')
        .addSelect('SUBSTRING_INDEX(GROUP_CONCAT(cotizacionesindices.valor ORDER BY CONCAT(cotizacionesindices.fecha, " ", cotizacionesindices.hora) DESC), ",", 1)', 'cierre')
        .where('cotizacionesindices.idBolsa = :idBolsa', { idBolsa: bolsa.id })
        .andWhere('cotizacionesindices.fecha BETWEEN :fechaInicio AND :fechaFin', { fechaInicio, fechaFin })
        .groupBy('DATE_FORMAT(cotizacionesindices.fecha, "%Y-%m-%d")')
        .orderBy('DATE_FORMAT(cotizacionesindices.fecha, "%Y-%m-%d")', 'ASC')
        .getRawMany()
    } else if (escala === 'mes') {
      return this.cotizacionIndiceRepository
        .createQueryBuilder('cotizacionesindices')
        .select('DATE_FORMAT(cotizacionesindices.fecha, "%Y-%m")', 'fecha')
        .addSelect('MIN(cotizacionesindices.valor)', 'minimo')
        .addSelect('MAX(cotizacionesindices.valor)', 'maximo')
        .addSelect('SUBSTRING_INDEX(GROUP_CONCAT(cotizacionesindices.valor ORDER BY CONCAT(cotizacionesindices.fecha, " ", cotizacionesindices.hora) ASC), ",", 1)', 'apertura')
        .addSelect('SUBSTRING_INDEX(GROUP_CONCAT(cotizacionesindices.valor ORDER BY CONCAT(cotizacionesindices.fecha, " ", cotizacionesindices.hora) DESC), ",", 1)', 'cierre')
        .where('cotizacionesindices.idBolsa = :idBolsa', { idBolsa: bolsa.id })
        .andWhere('cotizacionesindices.fecha BETWEEN :fechaInicio AND :fechaFin', { fechaInicio, fechaFin })
        .groupBy('DATE_FORMAT(cotizacionesindices.fecha, "%Y-%m")')
        .orderBy('DATE_FORMAT(cotizacionesindices.fecha, "%Y-%m")', 'ASC')
        .getRawMany()
    } else {
      throw new Error(`Escala '${escala}' no soportada. Use 'dia' o 'mes'.`);
    }
  }

  async obtenerUltimaCotizacionBolsa(code: string): Promise<CotizacionIndice | null> {
    return await this.cotizacionIndiceRepository.findOne({
      where: { bolsa: { code } },
      order: { fecha: 'DESC', hora: 'DESC' },
    });
  }

  // si no esta mi bolsa podria crearla (al final)

  async actualizarBolsas() {
    try {
      const bolsasApi = await this.apiservice.getBolsaDetails();
      const bolsasValidas = bolsasApi.filter((bolsa: any) => bolsa.code?.trim());

      const bolsasDB = await this.getAllBolsas();
      const bolsasExistentes = new Set(bolsasDB.map((bolsa) => bolsa.code))

      const bolsasNuevas = bolsasValidas.filter((bolsa: any) => !bolsasExistentes.has(bolsa.code))

      if (bolsasNuevas.length > 0) {
        this.logger.log(`Nuevas bolsas a agregar: ${bolsasNuevas.length}`);

        const bolsasEntities = bolsasNuevas.map((bolsa: any) => {
          this.logger.log(`Agregando bolsa con code: ${bolsa.code} y name: ${bolsa.name}`);
          return this.bolsaRepository.create({ code: bolsa.code, name: bolsa.name })
        });

        await this.bolsaRepository.save(bolsasEntities);
      } else {
        this.logger.log(`No hay bolsas nuevas para agregar`);
      }
    } catch (error) {
      this.logger.error(`Error al actualizar bolsas desde la api: ${error.message}`)
    }
  }

  async crearCotizacionesBIST() {
    try {
      const bolsaBIST = await this.bolsaRepository.findOne({ where: { code: "BIST" } });
      if (!bolsaBIST) {
        this.logger.log("No se encontró la bolsa 'BIST' en la base de datos.");
        return;
      }

      const ultimaCotizacion = await this.obtenerUltimaCotizacionBolsa(bolsaBIST.code);

      let fechaInicio: string;
      let horaInicio: string;

      if (ultimaCotizacion) {
        fechaInicio = ultimaCotizacion.fecha;
        horaInicio = ultimaCotizacion.hora;
      } else {
        const primeraCotizacionEmpresa = await this.empresaService.getPrimeraCotizacionEmpresa();
        if (!primeraCotizacionEmpresa) {
          this.logger.log("No se encontraron cotizaciones para hacer indice de bolsa")
          return;
        }
        fechaInicio = primeraCotizacionEmpresa.fecha;
        horaInicio = primeraCotizacionEmpresa.hora;
      }

      const fechaHoraInicio = momentTZ.tz(`${fechaInicio}T${horaInicio}`, "YYYY-MM-DDTHH:mm", "Europe/Istanbul");
      const fechaHoraActual = momentTZ.tz('Europe/Istanbul');

      while (fechaHoraInicio.isSameOrBefore(fechaHoraActual)) {
        if (fechaHoraInicio.isoWeekday() >= 1 && fechaHoraInicio.isoWeekday() <= 5) {
          if (fechaHoraInicio.hour() >= 9 && fechaHoraInicio.hour() <= 15) {
            const fecha = fechaHoraInicio.format("YYYY-MM-DD")
            const hora = fechaHoraInicio.format("HH:mm")

            const cotizacionExistente = await this.cotizacionIndiceRepository.findOne({
              where: { fecha, hora, bolsa: { code: "BIST" } },
            });

            if (!cotizacionExistente) {
              await this.calcularYGuardarIndice(fecha, hora, bolsaBIST);
            }
          }
        }
        fechaHoraInicio.add(1, 'hour');
      }

      this.logger.log("Índice de BIST generado hasta la fecha y hora actuales.");
    } catch (error) {
      this.logger.error(`Error al generar el índice de BIST: ${error.message}`);
    }
  }

  async calcularYGuardarIndice(fecha: string, hora: string, bolsaBIST: Bolsa) {
    const empresas = await this.empresaService.getAllEmpresas();
    let sumaCotizaciones = 0;

    for (const empresa of empresas) {
      const cotizacion = await this.empresaService.getCotizacionPorFechaYHora(empresa.codEmpresa, fecha, hora)

      if (cotizacion) {
        sumaCotizaciones += Number(cotizacion.cotization);
      } else if (cotizacion) {
        this.logger.warn(`Valor inválido para la cotización de la empresa ${empresa.codEmpresa} en ${fecha} ${hora}: ${cotizacion.cotization}`);
      }
    }

    if (empresas.length) {
      const promedioIndice = sumaCotizaciones / empresas.length;

      if (isNaN(promedioIndice)) {
        this.logger.error(`El promedio calculado es NaN. Suma: ${sumaCotizaciones}, Total empresas: ${empresas.length}`);
        return;
      }

      const nuevaCotizacionIndice = this.cotizacionIndiceRepository.create({
        fecha,
        hora,
        valor: promedioIndice,
        bolsa: bolsaBIST
      })

      await this.cotizacionIndiceRepository.save(nuevaCotizacionIndice);
      this.logger.log(`Índice BIST creado: Fecha ${fecha}, Hora ${hora}, Valor ${promedioIndice}`)
    } else {
      this.logger.warn(`No se encontraron cotizaciones para las empresas en la fecha ${fecha} y hora ${hora}.`);
    }
  }

  async postCotizacionBolsaApi() {
    try {
      const bolsasApi = await this.apiservice.getBolsaDetails();
      const bolsaBIST = bolsasApi.find((bolsa: any) => bolsa.code === "BIST");

      if (!bolsaBIST) {
        this.logger.warn(`No se encontró la bolsa con código "BIST"`);
        return;
      }

      const fechaActual = momentTZ.tz("Europe/Istanbul").format("YYYY-MM-DDTHH:mm");
      const fechaInicioBusqueda = momentTZ.tz("Europe/Istanbul").subtract(1, "month").format("YYYY-MM-DDTHH:mm");

      const cotizacionesApi = await this.apiservice.getBolsaCotizacionIndice("BIST", fechaInicioBusqueda, fechaActual);

      let fechaInicio: string;
      let horaInicio: string;

      const fechaHoraActual = momentTZ.tz(fechaActual, "YYYY-MM-DDTHH:mm", "Europe/Istanbul");
      const fechaHoraInicio = momentTZ.tz(fechaInicioBusqueda, "Europe/Istanbul").format("YYYY-MM-DDTHH:mm");
      const fechaHoraFin = fechaHoraActual.format("YYYY-MM-DDTHH:mm");

      let cotizacionesLocales = await this.cotizacionIndiceRepository.createQueryBuilder("cotizacion")
        .where("cotizacion.idBolsa = :idBolsa", { idBolsa: 9 }) //obtener bien!
        .andWhere(
          "CONCAT(cotizacion.fecha, 'T', cotizacion.hora) BETWEEN :inicio AND :fin",
          { inicio: fechaHoraInicio, fin: fechaHoraFin }
        )
        .getMany();

      this.logger.log(`Cantidad cotizaciones locales encontradas: ${cotizacionesLocales.length}`);

      let cotizacionesFaltantes: any[] = [];
      if (cotizacionesApi && cotizacionesApi.length > 0) {
        const fechasApi = new Set(
          cotizacionesApi.map(cotizacion =>
            momentTZ.tz(`${cotizacion.fecha}T${cotizacion.hora}`, "UTC").format("YYYY-MM-DDTHH:mm")
          )
        );

        cotizacionesFaltantes = cotizacionesLocales.filter(local => {
          const fechaHoraLocal = momentTZ.tz(`${local.fecha}T${local.hora}`, "Europe/Istanbul").utc().format("YYYY-MM-DDTHH:mm");
          return !fechasApi.has(fechaHoraLocal) ? local : null;
        }).filter(Boolean);

        this.logger.log(`cotizacionesFaltantes: ${cotizacionesFaltantes.length}`)

        if (cotizacionesFaltantes.length > 0) {
          const primeraCotizacionFaltante = cotizacionesFaltantes.sort((a, b) => {
            const fechaHoraA = momentTZ.tz(`${a.fecha}T${a.hora}`, "Europe/Istanbul");
            const fechaHoraB = momentTZ.tz(`${b.fecha}T${b.hora}`, "Europe/Istanbul");
            return fechaHoraA.diff(fechaHoraB);
          })[0];

          fechaInicio = momentTZ.tz(`${primeraCotizacionFaltante.fecha}T${primeraCotizacionFaltante.hora}`, "Europe/Istanbul").format("YYYY-MM-DD");
          horaInicio = momentTZ.tz(`${primeraCotizacionFaltante.fecha}T${primeraCotizacionFaltante.hora}`, "Europe/Istanbul").format("HH:mm");

          this.logger.log(`Primera cotización faltante a subir: ${fechaInicio} ${horaInicio}`);
        } else {
          this.logger.log(`No hay cotizaciones locales que falten subir en el rango de la API.`);
          return;
        }
      } else {
        fechaInicio = "2024-01-01";
        horaInicio = "00:00";

        cotizacionesLocales = await this.cotizacionIndiceRepository.createQueryBuilder("cotizacion")
        .where("cotizacion.idBolsa = :idBolsa", { idBolsa: 9 }) //obtener bien!
        .andWhere(
          "CONCAT(cotizacion.fecha, 'T', cotizacion.hora) BETWEEN :inicio AND :fin",
          { inicio: "2024-01-01T00:00", fin: fechaHoraFin }
        )
        .getMany();
        cotizacionesFaltantes = cotizacionesLocales;
        
        this.logger.log(`No hay cotizaciones en la API, comenzando desde la primera cotización local: ${fechaInicio} ${horaInicio}`);
      }

      const cotizacionesToPost = cotizacionesFaltantes.map(async (cotizacionLocal) => {
        if (cotizacionLocal) {
          try {
            const fechaUTC = momentTZ.tz(`${cotizacionLocal.fecha}T${cotizacionLocal.hora}`, "Europe/Istanbul").utc().format("YYYY-MM-DD");
            const horaUTC = momentTZ.tz(`${cotizacionLocal.fecha}T${cotizacionLocal.hora}`, "Europe/Istanbul").utc().format("HH:mm");

            await this.apiservice.postBolsaCotizacionIndice({
              fecha: fechaUTC,
              hora: horaUTC,
              codigoIndice: "BIST",
              valorIndice: cotizacionLocal.valor,
            });

            this.logger.log(`Cotización publicada: Fecha ${cotizacionLocal.fecha}, Hora ${cotizacionLocal.hora}`);
          } catch (error) {
            this.logger.error(`Error al publicar cotización: Fecha ${cotizacionLocal.fecha}, Hora ${cotizacionLocal.hora}, Error: ${error.message}`);
          }
        }
      });

      await Promise.all(cotizacionesToPost);
      this.logger.log("Sincronización de cotizaciones de BIST completada.");
    } catch (error) {
      this.logger.error('Ocurrió un error en la sincronización de cotizaciones', error);
    }
  }

  async actualizarCotizacionBolsasApi() {
    const bolsas = await this.getAllBolsas();

    if (!bolsas) {
      this.logger.warn(`No se encontraron bolsas`)
      return;
    }

    for (const bolsa of bolsas) {
      const bolsasExcluidas = new Set(["BIST", "TSE"]);
      if (bolsasExcluidas.has(bolsa.code)) {
        this.logger.log(`Saltando la actualizacion para la bolsa ${bolsa.code}`);
        continue;
      }

      try {
        const ultimaCotizacion = await this.obtenerUltimaCotizacionBolsa(bolsa.code);

        let fechaDesde: momentTZ.Moment;
        if (ultimaCotizacion) {
          const { fechaUtc, horaUtc } = deUTCMas3aUTC(ultimaCotizacion.fecha, ultimaCotizacion.hora);
          fechaDesde = momentTZ.tz(`${fechaUtc}T${horaUtc}`, 'UTC');
        } else {
          const fechaDefecto = '2024-01-01T00:00';
          fechaDesde = momentTZ.tz(fechaDefecto, 'UTC')
          this.logger.warn(`No se encontraron cotizaciones previas para la bolsa ${bolsa.code}. Usando fecha por defecto: ${fechaDesde.format('YYYY-MM-DD')}`);
        }

        const fechaActual = momentTZ.tz("UTC");
        this.logger.log(`Iniciando actualización para la bolsa ${bolsa.code}. Desde: ${fechaDesde.format("YYYY-MM-DDTHH:mm")} hasta: ${fechaActual.format("YYYY-MM-DDTHH:mm")}`);

        const cotizaciones = await this.apiservice.getBolsaCotizacionIndice(bolsa.code, fechaDesde.format("YYYY-MM-DDTHH:mm"), fechaActual.format("YYYY-MM-DDTHH:mm"));

        if (!cotizaciones || cotizaciones.length === 0) {
          this.logger.log(`No se encontraron cotizaciones nuevas para la bolsa ${bolsa.code}. Desde: ${fechaDesde} hasta: ${fechaActual}`);
          continue;
        }

        for (const cotizacion of cotizaciones) {
          const fechaUtc = cotizacion.fecha;
          const horaUtc = cotizacion.hora;
          const valor = cotizacion.valor;

          const fechaHoraUtcMas3 = momentTZ.tz(`${fechaUtc}T${horaUtc}`, "YYYY-MM-DDTHH:mm", "UTC").add(3, "hours");
          const fecha = fechaHoraUtcMas3.format("YYYY-MM-DD");
          const hora = fechaHoraUtcMas3.format("HH:mm");

          const cotizacionExistente = await this.cotizacionIndiceRepository.findOne({
            where: { fecha, hora, bolsa: { code: bolsa.code } }
          })

          if (!cotizacionExistente) {
            const nuevaCotizacion = this.cotizacionIndiceRepository.create({
              fecha,
              hora,
              valor,
              bolsa: bolsa
            })
            await this.cotizacionIndiceRepository.save(nuevaCotizacion);
            this.logger.log(`Guardada cotización: Bolsa ${bolsa.code}, Fecha ${fecha}, Hora ${hora}, Valor ${valor}`);
          }
        }

      } catch (error) {
        console.error(`Error actualizando datos de la bolsa ${bolsa.code}:`, error);
      }
    }
  }

  @Cron('7 3-9 * * 1-5')
  async actualizarBolsasHora() {
    this.logger.log('Ejecutando tarea programada: actualizarBolsas');
    await this.actualizarBolsas();

    this.logger.log('Ejecutando tarea programada: crearCotizacionesBIST');
    await this.crearCotizacionesBIST();
  }

  @Cron('10 * * * *')
  async actualizarBolsasHoraApi() {
    this.logger.log('Ejecutando tarea programada: actualizarCotizacionBolsasApi');
    await this.actualizarCotizacionBolsasApi();

    /* this.logger.log('Ejecutando tarea programada: postCotizacionBolsaApi');
    await this.postCotizacionBolsaApi(); */
  }
}