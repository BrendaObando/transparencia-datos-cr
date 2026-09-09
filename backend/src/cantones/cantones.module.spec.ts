import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, expect, it } from 'vitest';
import { Canton } from './canton.entity.js';
import { CantonesModule } from './cantones.module.js';

describe('CantonesModule', () => {
  it('compila y expone el repositorio de Canton', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CantonesModule],
    })
      .overrideProvider(getRepositoryToken(Canton))
      .useValue({
        find: () => Promise.resolve([]),
        findOne: () => Promise.resolve(null),
        save: () => Promise.resolve({}),
      })
      .compile();

    expect(module).toBeDefined();

    const repo = module.get(getRepositoryToken(Canton));
    expect(repo).toBeDefined();
    expect(repo.find).toBeDefined();
  });
});
