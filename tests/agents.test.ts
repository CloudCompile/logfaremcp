import { describe, expect, it } from 'vitest';
import { listAgentRoles, resolveAgent } from '../lib/agents';

const models = [
  { id: 'coder-pro', type: 'chat', capabilities: ['coding', 'reasoning'] },
  { id: 'image-pro', type: 'image' },
  { id: 'speech-one', type: 'tts' },
];

describe('agent runtime', () => {
  it('exposes stable role definitions', () => {
    expect(listAgentRoles().some((agent) => agent.id === 'coder')).toBe(true);
  });
  it('resolves a role only from compatible catalog models', () => {
    expect(resolveAgent(models, 'image').model.id).toBe('image-pro');
  });
  it('rejects incompatible explicit models', () => {
    expect(() => resolveAgent(models, 'coder', 'image-pro')).toThrow('not compatible');
  });
});
