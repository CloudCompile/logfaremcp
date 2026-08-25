import type { LogfareModel } from './logfare';

export function chooseModel(models: LogfareModel[], input: { task?: string; preferred_modality?: string; speed?: string; reasoning?: string; model?: string }): { model: LogfareModel; reason: string } {
  if (!models.length) throw new Error('Logfare returned no available models');
  if (input.model) {
    const exact = models.find((candidate) => candidate.id === input.model);
    if (!exact) throw new Error(`Requested model '${input.model}' is not available`);
    return { model: exact, reason: 'The explicitly requested model was selected.' };
  }
  const modality = input.preferred_modality;
  const task = input.task?.toLowerCase();
  const candidates = models.filter((candidate) => !modality || candidate.type === modality || candidate.input_modalities?.includes(modality) || candidate.output_modalities?.includes(modality));
  if (!candidates.length) throw new Error(`No available model advertises the requested modality${modality ? ` '${modality}'` : ''}.`);
  const scored = candidates.map((candidate) => {
    const haystack = JSON.stringify(candidate).toLowerCase();
    let score = 0;
    if (task && haystack.includes(task)) score += 4;
    if (input.reasoning === 'high' && haystack.includes('reason')) score += 2;
    if (input.speed === 'fast' && (haystack.includes('flash') || haystack.includes('fast'))) score += 2;
    if (input.speed === 'quality' && (haystack.includes('pro') || haystack.includes('quality'))) score += 2;
    return { candidate, score };
  }).sort((a, b) => b.score - a.score);
  const selected = scored[0].candidate;
  return { model: selected, reason: scored[0].score ? 'Selected from advertised catalog metadata matching the requested task or preferences.' : 'No matching capability metadata was available; selected the first compatible catalog model conservatively.' };
}
