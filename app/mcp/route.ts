import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer, publicError } from '@/lib/mcp-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request) {
  try {
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    const server = createMcpServer();
    await server.connect(transport);
    return await transport.handleRequest(request);
  } catch (error) {
    return Response.json({ jsonrpc: '2.0', error: { code: -32603, message: publicError(error) } }, { status: 500 });
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = async () => new Response(null, { status: 405, headers: { Allow: 'GET, POST' } });
