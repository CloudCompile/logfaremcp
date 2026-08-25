import { z } from 'zod';

const model = z.string().trim().min(1).max(200);
const prompt = z.string().min(1).max(100_000);
const modality = z.enum(['chat', 'image', 'tts', 'stt', 'embeddings']);

export const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string().max(100_000),
});

export const listModelsSchema = z.object({});
export const modelInfoSchema = z.object({ model });
export const chatFields = {
  model: model.optional(),
  prompt: prompt.optional(),
  messages: z.array(messageSchema).min(1).max(100).optional(),
  system_prompt: z.string().max(20_000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().max(100_000).optional(),
  tools: z.array(z.record(z.unknown())).max(100).optional(),
  tool_choice: z.unknown().optional(),
};
export const chatSchema = z.object(chatFields).refine((value) => Boolean(value.prompt || value.messages), 'Provide prompt or messages');

export const imageSchema = z.object({
  model: model,
  prompt,
  size: z.string().max(32).optional(),
  aspect_ratio: z.string().max(32).optional(),
  quality: z.string().max(32).optional(),
  seed: z.number().int().optional(),
});

export const ttsSchema = z.object({
  model,
  text: prompt,
  voice: z.string().max(100).optional(),
  format: z.string().max(20).optional(),
  speed: z.number().positive().max(4).optional(),
});

const safeHttpUrl = z.string().url().max(2_000).refine((value) => {
  const url = new URL(value);
  return url.protocol === 'https:' || url.protocol === 'http:';
}, 'Audio URL must use HTTP(S)');

export const audioInputSchema = z.union([
  z.object({ url: safeHttpUrl, mime_type: z.string().max(100).optional() }),
  z.object({ data: z.string().min(1).max(25_000_000), mime_type: z.string().max(100) }),
  z.object({ resource_uri: z.string().min(1).max(2_000), mime_type: z.string().max(100).optional() }),
]);

export const sttSchema = z.object({
  model,
  audio: audioInputSchema,
  language: z.string().max(20).optional(),
  prompt: z.string().max(20_000).optional(),
});

export const embeddingsSchema = z.object({
  model,
  input: z.union([z.string().min(1).max(100_000), z.array(z.string().min(1).max(100_000)).min(1).max(1_000)]),
});

export const routeSchema = z.object({
  task: z.string().min(1).max(100).optional(),
  prompt,
  constraints: z.string().max(2_000).optional(),
  preferred_modality: modality.optional(),
  maximum_cost: z.number().nonnegative().optional(),
  speed: z.enum(['fast', 'balanced', 'quality']).optional(),
  reasoning: z.enum(['low', 'medium', 'high']).optional(),
  model: model.optional(),
});

export type ChatInput = z.infer<typeof chatSchema>;
export type Model = z.infer<typeof modelInfoSchema>;
