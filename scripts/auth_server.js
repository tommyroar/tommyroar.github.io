import { createServer } from 'http';
import { handleWhois } from './auth_logic.js';

const PORT = 3001;

const server = createServer(async (req, res) => {
  // Add CORS headers for local development and tailnet access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/whois') {
    // Get client IP. Handle potential proxies.
    const clientIp = req.socket.remoteAddress.replace(/^.*:/, '');
    const data = await handleWhois(clientIp);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Tailscale Auth Server running on port ${PORT}`);
});
