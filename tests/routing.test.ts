import { describe, expect, it } from 'vitest';
import { chooseModel } from '../lib/routing';

const models = [
  { id: 'fast-chat', type: 'chat', capabilities: ['coding', 'reasoning'] },
  { id: 'image-one', type: 'image' },
];

describe('chooseModel', () => {
  it('chooses only a compatible advertised model', () => {
    expect(chooseModel(models, { preferred_modality: 'image' }).model.id).toBe('image-one');
  });
  it('honors an explicit model', () => {
    expect(chooseModel(models, { model: 'fast-chat' }).model.id).toBe('fast-chat');
  });
  it('rejects fabricated or unavailable models', () => {
    expect(() => chooseModel(models, { model: 'missing' })).toThrow('not available');
  });
});
