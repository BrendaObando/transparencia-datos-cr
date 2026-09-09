import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, expect, it } from 'vitest';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { Canton } from './cantones/canton.entity.js';

describe('AppModule (sin base de datos)', () => {
  it('compila el módulo con TypeORM mockeado', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: getRepositoryToken(Canton),
          useValue: {
            find: () => Promise.resolve([]),
            findOne: () => Promise.resolve(null),
          },
        },
      ],
    }).compile();

    expect(module).toBeDefined();

    const controller = module.get<AppController>(AppController);
    expect(controller).toBeDefined();

    const service = module.get<AppService>(AppService);
    expect(service.getHello()).toBe('Hello World!');
  });
});
