import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ApiService {
  private readonly apiUrl = 'http://ec2-54-145-211-254.compute-1.amazonaws.com:3000';

  async getEmpresaDetails(codEmpresa: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/empresas/${codEmpresa}/details`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo detalles de empresa:', error);
      throw new Error('No se pudo obtener los datos');
    }
  }

  async getEmpresaCotizacion(codEmpresa: string, fechaDesde: string, fechaHasta: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/empresas/${codEmpresa}/cotizaciones?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo detalles de cotizacion de empresa:', error);
      throw new Error('No se pudo obtener los datos');
    }
  }
  
  async getBolsaDetails() {
    try {
      const response = await axios.get(`${this.apiUrl}/indices`);
      return response.data
    } catch (error) {
      console.error('Error obteniendo detalles de Bolsa:', error);
      throw new Error('No se pudo obtener los datos');
    }
  }

  async getBolsaCotizacionIndice(codBolsa: string, fechaDesde: string, fechaHasta: string) {
    try {
      const response = await axios.get(`${this.apiUrl}/indices/${codBolsa}/cotizaciones?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo detalles de cotizacion de bolsa:', error);
      throw new Error('No se pudo obtener los datos');
    }
  }

  async createBolsa(body: { code: string; name: string }): Promise<any> {
    const response = await axios.post(`${this.apiUrl}/indices`, body)
    return response.data;
  }

  async createBolsaCotizacionIndice(codBolsa: string, fechaDesde: string, fechaHasta: string) {

  }
}
