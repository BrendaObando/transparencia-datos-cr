import { describe, expect, it } from 'vitest';
import { Canton } from './canton.entity.js';

describe('Canton entity', () => {
  it('se puede instanciar con los campos esperados', () => {
    const canton = new Canton();
    canton.codigo = '101';
    canton.nombre = 'San José';
    canton.provincia = 'San José';

    expect(canton.codigo).toBe('101');
    expect(canton.nombre).toBe('San José');
    expect(canton.provincia).toBe('San José');
  });

  it('tiene las propiedades codigo, nombre y provincia', () => {
    const canton = new Canton();
    expect(canton).toHaveProperty('codigo');
    expect(canton).toHaveProperty('nombre');
    expect(canton).toHaveProperty('provincia');
  });
});
