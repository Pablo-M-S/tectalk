import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', 1);
  app.use(helmet());
  // O app nativo não usa CORS. Só abre para origens listadas; '*' vale apenas fora de produção.
  const origins = env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter((o) => o && o !== 'none');
  if (origins.length > 0 && !(env.NODE_ENV === 'production' && origins.includes('*'))) {
    app.enableCors({ origin: origins.includes('*') ? true : origins });
  }
  app.setGlobalPrefix('v1', { exclude: ['health'] });
  app.enableShutdownHooks();

  await app.listen(env.PORT, '0.0.0.0');
  Logger.log(`TecTalk API em execução na porta ${env.PORT}`, 'Bootstrap');
}

void bootstrap();
