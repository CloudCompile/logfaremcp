import type { LogfareModel } from './logfare';

export const AGENT_ROLES = {
  planner: { label: 'Planner', description: 'Breaks complex work into concrete steps and identifies risks.', modality: 'chat', keywords: ['plan', 'reason', 'analysis'] },
  coder: { label: 'Coder', description: 'Produces implementation-oriented code and technical solutions.', modality: 'chat', keywords: ['code', 'coding', 'programming', 'reason'] },
  reviewer: { label: 'Reviewer', description: 'Critically reviews proposals, code, and decisions for defects.', modality: 'chat', keywords: ['review', 'reason', 'analysis'] },
  researcher: { label: 'Researcher', description: 'Synthesizes supplied research context and compares alternatives.', modality: 'chat', keywords: ['research', 'analysis'] },
  fast: { label: 'Fast agent', description: 'Handles straightforward tasks with a speed-oriented preference.', modality: 'chat', keywords: ['fast', 'flash'] },
  image: { label: 'Image agent', description: 'Creates images from textual prompts.', modality: 'image', keywords: ['image', 'vision'] },
  vision: { label: 'Vision agent', description: 'Analyzes visual input when the catalog advertises vision support.', modality: 'chat', keywords: ['vision', 'image'] },
  voice: { label: 'Voice agent', description: 'Turns text into spoken audio.', modality: 'tts', keywords: ['voice', 'speech', 'tts'] },
  transcriber: { label: 'Transcriber', description: 'Transcribes supplied audio into text.', modality: 'stt', keywords: ['transcription', 'speech', 'stt'] },
  embeddings: { label: 'Memory agent', description: 'Creates vector embeddings for semantic retrieval.', modality: 'embeddings', keywords: ['embedding', 'vector'] },
} as const;

export type AgentRole = keyof typeof AGENT_ROLES;

export function listAgentRoles() {
  return Object.entries(AGENT_ROLES).map(([id, role]) => ({ id, ...role }));
}

export function resolveAgent(models: LogfareModel[], roleName: AgentRole, requestedModel?: string) {
  const role = AGENT_ROLES[roleName];
  const compatible = models.filter((model) => model.type === role.modality || model.input_modalities?.includes(role.modality) || model.output_modalities?.includes(role.modality));
  if (requestedModel) {
    const exact = compatible.find((model) => model.id === requestedModel);
    if (!exact) throw new Error(`Model '${requestedModel}' is not compatible with the '${roleName}' agent role`);
    return { model: exact, reason: 'The requested compatible model was selected.' };
  }
  if (!compatible.length) throw new Error(`No live catalog model supports the '${roleName}' agent role`);
  const ranked = compatible.map((model) => {
    const haystack = JSON.stringify(model).toLowerCase();
    const score = role.keywords.reduce((total, keyword) => total + (haystack.includes(keyword) ? 1 : 0), 0);
    return { model, score };
  }).sort((a, b) => b.score - a.score);
  return { model: ranked[0].model, reason: ranked[0].score ? 'Selected from advertised role and capability metadata.' : 'Selected the first compatible live catalog model because detailed role metadata was unavailable.' };
}
