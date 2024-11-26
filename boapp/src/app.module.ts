import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EmpresaModule } from './empresa/empresa.module';
import { ConfigModule } from '@nestjs/config';
import { Empresa } from './empresa/entities/empresa.entity';
import { ApiModule } from './api/api.module';
import { BolsaModule } from './bolsa/bolsa.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
      synchronize: false,
      entities: ['dist/**/*.entity.js'],
      logging: 'all',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Empresa]),
    EmpresaModule,
    BolsaModule,
    ApiModule,
  ],
  controllers: [AppController],
  providers: [AppService ],
})
export class AppModule {}
