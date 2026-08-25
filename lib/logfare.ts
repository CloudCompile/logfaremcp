import type { ChatInput } from './validation';

export type LogfareModel = {
  id: string;
  name?: string;
  type?: string;
  provider?: string;
  capabilities?: string[];
  context_length?: number;
  input_modalities?: string[];
  output_modalities?: string[];
  pricing?: unknown;
  availability?: unknown;
  [key: string]: unknown;
};

export class LogfareError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'LogfareError';
  }
}

export type UpstreamClientOptions = { fetchImpl?: typeof fetch; timeoutMs?: number };

export class LogfareClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: UpstreamClientOptions = {}) {
    const apiKey = process.env.LOGFARE_API_KEY;
    const baseUrl = process.env.LOGFARE_BASE_URL;
    if (!apiKey) throw new LogfareError(500, 'Logfare is not configured: LOGFARE_API_KEY is missing');
    if (!baseUrl) throw new LogfareError(500, 'Logfare is not configured: LOGFARE_BASE_URL is missing');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 45_000;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      });
      const text = await response.text();
      let body: unknown;
      try { body = text ? JSON.parse(text) : undefined; } catch { body = undefined; }
      if (!response.ok) {
        const message = response.status === 429 ? 'Logfare API is rate-limited' : response.status >= 500 ? 'Logfare API is temporarily unavailable' : 'Logfare API request was rejected';
        throw new LogfareError(response.status, message);
      }
      return body as T;
    } catch (error) {
      if (error instanceof LogfareError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') throw new LogfareError(504, 'Logfare API request timed out');
      throw new LogfareError(502, 'Could not reach Logfare API');
    } finally { clearTimeout(timer); }
  }

  async listModels(): Promise<LogfareModel[]> {
    const body = await this.request<unknown>('/models');
    const records = Array.isArray(body) ? body : (body && typeof body === 'object' && Array.isArray((body as { data?: unknown }).data) ? (body as { data: unknown[] }).data : undefined);
    if (!records || !records.every((item) => item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string')) throw new LogfareError(502, 'Logfare returned a malformed model catalog');
    return records as LogfareModel[];
  }

  async modelInfo(id: string): Promise<LogfareModel> {
    const body = await this.request<unknown>(`/models/${encodeURIComponent(id)}`);
    if (!body || typeof body !== 'object' || typeof (body as { id?: unknown }).id !== 'string') throw new LogfareError(502, 'Logfare returned malformed model information');
    return body as LogfareModel;
  }

  chat(input: ChatInput) { return this.request<unknown>('/chat/completions', { method: 'POST', body: JSON.stringify({ model: input.model, messages: input.messages ?? [{ role: 'user', content: input.prompt }], ...(input.system_prompt ? { system_prompt: input.system_prompt } : {}), temperature: input.temperature, max_tokens: input.max_tokens, tools: input.tools, tool_choice: input.tool_choice }) }); }
  image(input: Record<string, unknown>) { return this.request<unknown>('/images/generations', { method: 'POST', body: JSON.stringify(input) }); }
  tts(input: Record<string, unknown>) { return this.request<unknown>('/audio/speech', { method: 'POST', body: JSON.stringify(input) }); }
  stt(input: FormData | Record<string, unknown>) { return input instanceof FormData ? this.request<unknown>('/audio/transcriptions', { method: 'POST', body: input, headers: {} }) : this.request<unknown>('/audio/transcriptions', { method: 'POST', body: JSON.stringify(input) }); }
  embeddings(input: Record<string, unknown>) { return this.request<unknown>('/embeddings', { method: 'POST', body: JSON.stringify(input) }); }
}

export function extractText(body: unknown): string {
  if (typeof body === 'object' && body !== null) {
    const value = body as { choices?: Array<{ message?: { content?: unknown }; text?: unknown }>; output?: unknown; text?: unknown };
    const content = value.choices?.[0]?.message?.content ?? value.choices?.[0]?.text ?? value.output ?? value.text;
    if (typeof content === 'string') return content;
  }
  throw new LogfareError(502, 'Logfare returned no generated text');
}
