import { Injectable, OnModuleInit } from '@nestjs/common';
import { EmpresaSeeder } from './empresa/seed/empresa.seeder';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly empresaSeeder: EmpresaSeeder) {}

  async onModuleInit() {
    await this.empresaSeeder.seed()
  }

  getHello(): string {
    return 'Hello World!';
  }
}
