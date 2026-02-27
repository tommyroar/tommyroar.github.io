import { createServer } from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PORT = 3001;
const ALLOWED_USER = 'tommyroar'; // Adjust this to your Tailscale username

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

    try {
      // Run tailscale whois on the client IP
      const { stdout } = await execAsync(`tailscale whois --json ${clientIp}`);
      const data = JSON.parse(stdout);

      const loginName = data.UserProfile?.LoginName || '';
      const isAuthorized = loginName.includes(ALLOWED_USER);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        authorized: isAuthorized,
        user: loginName,
        device: data.Node?.ComputedName || 'unknown'
      }));
    } catch (error) {
      console.error('Tailscale whois error:', error.message);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        authorized: false,
        error: 'Could not verify Tailscale identity. Ensure you are on the tailnet.'
      }));
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Tailscale Auth Server running on port ${PORT}`);
});
