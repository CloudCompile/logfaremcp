import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { extractText, LogfareClient, LogfareError } from './logfare';
import { chooseModel } from './routing';
import { chatFields, embeddingsSchema, imageSchema, modelInfoSchema, routeSchema, sttSchema, ttsSchema } from './validation';

const json = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }] });
const error = (cause: unknown) => json({ error: cause instanceof Error ? cause.message : 'The request could not be completed' });
const client = () => new LogfareClient();
const fields = (schema: { shape: Record<string, z.ZodType> }) => schema.shape as Record<string, z.ZodType>;

export function createMcpServer() {
  const server = new McpServer({ name: 'logfare-mcp', version: '1.0.0' });
  server.registerTool('logfare_list_models', { description: 'Use when the user asks which Logfare models are currently available. Fetches the live catalog and returns advertised metadata; never uses a hard-coded list.', inputSchema: {} }, async () => { try { return json({ models: await client().listModels() }); } catch (e) { return error(e); } });
  server.registerTool('logfare_model_info', { description: 'Use when detailed metadata for one specific Logfare model is needed, such as capabilities, modality, context, or pricing.', inputSchema: fields(modelInfoSchema) }, async (input) => { try { return json(await client().modelInfo(input.model)); } catch (e) { return error(e); } });
  server.registerTool('logfare_chat', { description: 'Use for text generation, conversation, code analysis, and reasoning through a chosen Logfare chat model. Prefer this over routing when the user names a model.', inputSchema: chatFields }, async (input) => { try { const body = await client().chat(input); return json({ text: extractText(body), model: input.model, response: body }); } catch (e) { return error(e); } });
  server.registerTool('logfare_generate_image', { description: 'Use when the user asks Logfare to create or edit an image. Returns the upstream image result, typically including a URL or content representation.', inputSchema: fields(imageSchema) }, async (input) => { try { return json(await client().image(input)); } catch (e) { return error(e); } });
  server.registerTool('logfare_tts', { description: 'Use when the user asks to turn text into spoken audio with Logfare. Returns the provider media result without exposing credentials.', inputSchema: fields(ttsSchema) }, async (input) => { try { return json(await client().tts(input)); } catch (e) { return error(e); } });
  server.registerTool('logfare_stt', { description: 'Use when the user asks to transcribe audio with Logfare. Accepts bounded inline data, MCP resource references, or HTTP(S) URLs supplied by the client; it is not an arbitrary URL proxy.', inputSchema: fields(sttSchema) }, async (input) => { try { return json(await client().stt(input)); } catch (e) { return error(e); } });
  server.registerTool('logfare_embeddings', { description: 'Use when vector embeddings are explicitly needed for one string or a bounded array of strings. Returns the actual embedding vectors and provider usage.', inputSchema: fields(embeddingsSchema) }, async (input) => { try { return json(await client().embeddings(input)); } catch (e) { return error(e); } });
  server.registerTool('logfare_route', { description: 'Use when the user asks Logfare to choose an appropriate model for a task. It first fetches the live catalog, selects only a returned compatible model, executes chat, and explains the decision. An explicit model is never overridden.', inputSchema: fields(routeSchema) }, async (input) => { try { const models = await client().listModels(); const decision = chooseModel(models, input); const response = await client().chat({ model: decision.model.id, prompt: input.prompt }); return json({ selected_model: decision.model.id, reason: decision.reason, result: extractText(response), response }); } catch (e) { return error(e); } });
  return server;
}

export function publicError(errorValue: unknown) {
  if (errorValue instanceof LogfareError) return errorValue.message;
  return 'MCP request failed';
}
