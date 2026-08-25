import { describe, expect, it } from 'vitest';
import { chatSchema, sttSchema } from '../lib/validation';

describe('validation', () => {
  it('requires prompt or messages for chat', () => {
    expect(() => chatSchema.parse({})).toThrow();
  });
  it('rejects non-http audio URLs', () => {
    expect(() => sttSchema.parse({ model: 'stt', audio: { url: 'file:///etc/passwd' } })).toThrow();
  });
  it('accepts bounded chat prompts', () => {
    expect(chatSchema.parse({ model: 'chat', prompt: 'hello' }).prompt).toBe('hello');
  });
});
