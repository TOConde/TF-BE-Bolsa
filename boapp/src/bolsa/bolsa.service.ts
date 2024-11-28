import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CotizacionIndice } from "./entities/cotiza-indice.entity";
import { Repository } from "typeorm";
import { Bolsa } from "./entities/bolsa.entity";
import { ApiService } from "src/api/api.service";
import { EmpresaService } from "src/empresa/empresa.service";
import * as momentTZ from "moment-timezone";
import { Cron } from "@nestjs/schedule";

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
    await this.actualizarBolsas();
    await this.crearCotizacionesBIST();
  }

  async getAllBolsas(): Promise<Bolsa[]> {
    return await this.bolsaRepository.find();
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

      const ultimaCotizacion = await this.cotizacionIndiceRepository.findOne({
        where: { bolsa: { code: "BIST" } },
        order: { fecha: "DESC", hora: "DESC" }
      })

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

  async actualizarCotizacionBolsasApi() { // llamar onModuleInit (ver si el orden de ejecucion es el orden de llamado, creo que si)
    // si no hay registro previo traer desde 2024-01-01T00:00 si no traer desde ultima fecha de cotizacion existente (verificar que no se repita el ultimo dato)
  }

  async subirCotizacionesBIST() { // tambien dejarlo en onModuleInit y llamar a schedule
    // subi las cotizaciones de mi bolsa a la api (tener en cuenta el cambio horario)
  }

  @Cron('10 * 3-9 * * 1-5')
  async a(){
    this.logger.log('Ejecutando tarea programada: actualizarBolsas');
    await this.actualizarBolsas();

    this.logger.log('Ejecutando tarea programada: crearCotizacionesBIST');
    await this.crearCotizacionesBIST();

    //this.logger.log('Ejecutando tarea programada: actualizarCotizacionBolsasApi');
    //await this.actualizarCotizacionBolsasApi();
  }

  //otro cron que suba mis cotizaciones
}