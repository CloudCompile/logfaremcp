export {};

const endpoint = process.env.MCP_URL ?? 'http://localhost:3000/mcp';
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'smoke-test', version: '1.0.0' } } }),
});
if (!response.ok) throw new Error(`MCP endpoint returned ${response.status}`);
const body = await response.text();
if (!body.includes('logfare_list_models')) throw new Error('MCP initialize response did not advertise tools');
console.log('MCP endpoint initialized and advertised Logfare tools.');
