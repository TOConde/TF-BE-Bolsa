import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmpresaController } from "./empresa.controller";
import { EmpresaService } from "./empresa.service";


@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [EmpresaController],
  providers: [EmpresaService],
  exports: [EmpresaService],
})
export class EmpresaModule {}