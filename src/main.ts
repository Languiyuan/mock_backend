import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes';
import { ConfigService } from '@nestjs/config';
import { FormatResponseInterceptor } from './format-response.interceptor';
import { InvokeRecordInterceptor } from './invoke-record.interceptor';
import { UnloginFilter } from './unlogin.filter';
import { CustomExceptionFilter } from './custom-exception.filter';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
// import { ProjectPermissionInterceptor } from './project-permission.interceptor';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // set context
  app.setGlobalPrefix('/lanMock');
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });
  app.enableCors({
    origin: '*', // 从环境变量读取 CORS 来源
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Origin, Content-Type, Accept, Authorization',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new FormatResponseInterceptor(new Reflector()));
  // app.useGlobalInterceptors(new ProjectPermissionInterceptor(new Reflector()));
  app.useGlobalInterceptors(new InvokeRecordInterceptor());
  app.useGlobalFilters(new UnloginFilter());
  app.useGlobalFilters(new CustomExceptionFilter());

  const configService = app.get(ConfigService);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  await app.listen(configService.get('nest_server_port'));
}
bootstrap();
