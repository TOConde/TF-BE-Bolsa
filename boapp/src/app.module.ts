import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'escolar',
      synchronize: false,
      entities: ['dist/**/*.entity.js'],
      logging: 'all',
    }),
    ScheduleModule.forRoot()
    //modulos
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
