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
}
