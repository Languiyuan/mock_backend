import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { User } from './user/entities/User.entity';
import { RedisModule } from './redis/redis.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { LoginGuard } from './login.guard';
import { MockModule } from './mock/mock.module';
import { Project } from './project/entities/Project.entity';
import { Folder } from './project/entities/Folder.entity';
import { ProjectModule } from './project/project.module';
import { ApiModule } from './api/api.module';
import { Api } from './api/entities/Api.entity';
import { UserProject } from './project/entities/UserProject.entity';
import { ApiHistory } from './api/entities/ApiHistory.entity';
// import * as path from 'path';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'src/.env.development',
      // envFilePath: path.join(__dirname, '.env'),
    }),
    TypeOrmModule.forRootAsync({
      useFactory(configService: ConfigService) {
        return {
          type: 'mysql',
          host: configService.get('mysql_server_host'),
          port: configService.get('mysql_server_port'),
          username: configService.get('mysql_server_username'),
          password: configService.get('mysql_server_password'),
          database: configService.get('mysql_server_database'),
          synchronize: true,
          logging: true,
          entities: [User, Project, Folder, Api, UserProject, ApiHistory],
          poolSize: 10,
          connectorPackage: 'mysql2',
          timezone: 'Asia/Beijing', // 设置为你所需的时区 没有起作用
          extra: {
            authPlugin: 'sha256_password',
          },
        };
      },
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory(configService: ConfigService) {
        return {
          secret: configService.get('jwt_secret'),
          signOptions: {
            expiresIn: '30m', // 默认 30 分钟
          },
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
    RedisModule,
    MockModule,
    ProjectModule,
    ApiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: LoginGuard,
    },
  ],
})
export class AppModule {}
