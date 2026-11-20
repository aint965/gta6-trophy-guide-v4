import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const directory = resolve(import.meta.dirname, 'app');
const portFlag = process.argv.indexOf('--port');
const port = portFlag < 0 ? 8080 : Number(process.argv[portFlag + 1]);
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const path = resolve(directory, `.${pathname === '/' ? '/index.html' : pathname}`);
    const type = types[extname(path)];
    if (!path.startsWith(directory + sep) || !type) {
      response.writeHead(404).end();
      return;
    }
    const bytes = await readFile(path);
    response.writeHead(200, { 'Content-Type': type, 'Content-Length': bytes.length, 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch {
    response.writeHead(404).end();
  }
}).listen(port, '127.0.0.1', function () {
  const address = this.address();
  if (address && typeof address !== 'string') console.log(`http://127.0.0.1:${address.port}/`);
});
