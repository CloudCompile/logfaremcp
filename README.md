# Logfare MCP

A private, server-side Model Context Protocol gateway that lets ChatGPT use Logfare through HTTPS and Vercel Functions.

## Architecture

ChatGPT connects to `/mcp` using the official MCP Streamable HTTP transport. The route creates an MCP server whose typed tools call a small server-only Logfare adapter. The adapter sends `LOGFARE_API_KEY` only in the upstream authorization header.

## Environment

Set these in local development and Vercel Project Settings → Environment Variables:

```env
LOGFARE_API_KEY=
LOGFARE_BASE_URL=
```

`.env.example` contains placeholders only. Never expose the API key in browser code, tool results, logs, or source control.

## Local development

```bash
bun install
bun run dev
```

The endpoint is `http://localhost:3000/mcp`. The smoke test can target another endpoint with `MCP_URL=https://YOUR-DOMAIN.vercel.app/mcp bun run smoke`.

## Tests and checks

```bash
bun run lint
bun run typecheck
bun test
bun run build
```

## Deploying to Vercel

Deploy with `vercel` or `vercel --prod`, after adding both environment variables to the Vercel project. The MCP endpoint is:

```text
https://YOUR-DOMAIN.vercel.app/mcp
```

Add that URL as a remote MCP server in ChatGPT. The endpoint uses a stateless Node.js Function and does not require a separate WebSocket server.

## Tools

- `logfare_list_models`: live model catalog and metadata.
- `logfare_model_info`: detailed information for one model.
- `logfare_chat`: typed text/chat generation.
- `logfare_generate_image`: image generation.
- `logfare_tts`: speech synthesis.
- `logfare_stt`: transcription from bounded inline data, MCP resource references, or HTTP(S) audio URLs.
- `logfare_embeddings`: one or many text embeddings.
- `logfare_route`: catalog-driven selection followed by chat generation.
- `logfare_list_agents`: discover stable specialist roles such as planner, coder, reviewer, and researcher.
- `logfare_spawn_agent`: delegate a bounded task to a catalog-resolved specialist with a role-specific system prompt.

Examples to try in ChatGPT: “List the models available through Logfare.”, “Use Logfare’s DeepSeek model to analyze this code.”, “Pick the best Logfare model for this coding task.”, “Ask the Logfare coder agent to review this function.”, “Have a planner and reviewer analyze this architecture.”, “Generate an image using Logfare.”, “Transcribe this audio using Logfare.”, and “Turn this text into speech using Logfare.”

## Agent runtime

The agent layer intentionally keeps one delegation primitive instead of creating one MCP tool per model. `logfare_list_agents` describes stable roles. `logfare_spawn_agent` then fetches the live catalog, filters it by the role’s advertised modality, optionally honors an explicitly requested compatible model, and executes a bounded text task with a role-specific system prompt. No model IDs are hard-coded and no persistent agent state is stored. Image, audio, and embedding roles are discoverable, but use their modality-specific tools for execution because delegation currently returns text only.

## Security

The server has no arbitrary HTTP, shell, filesystem, or generic proxy tool. Inputs are bounded and validated with Zod. Audio URLs are restricted to HTTP(S); applications that accept untrusted URLs should additionally enforce an allowlist or resolve/fetch through a dedicated media service. Upstream errors are sanitized and generation requests are not retried automatically.

## Adapter contract

This repository initially contained no Logfare API code, types, endpoint definitions, or documentation. The adapter therefore uses the common OpenAI-compatible paths `/models`, `/models/{id}`, `/chat/completions`, `/images/generations`, `/audio/speech`, `/audio/transcriptions`, and `/embeddings`, and accepts either an array or `{ data: [] }` model response. If Logfare uses different paths or media envelopes, update only `lib/logfare.ts`; MCP schemas and tool behavior remain isolated from those assumptions.
