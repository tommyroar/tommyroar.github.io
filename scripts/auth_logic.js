import { exec as defaultExec } from 'node:child_process';

const ALLOWED_USER = 'tommyroar';

export const handleWhois = async (clientIp, exec = defaultExec) => {
  const execAsync = (command) => {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ stdout, stderr });
      });
    });
  };

  try {
    // Run tailscale whois on the client IP
    const { stdout } = await execAsync(`tailscale whois --json ${clientIp}`);
    const data = JSON.parse(stdout);

    const loginName = data.UserProfile?.LoginName || '';
    const isAuthorized = loginName.includes(ALLOWED_USER);

    return {
      authorized: isAuthorized,
      user: loginName,
      device: data.Node?.ComputedName || 'unknown'
    };
  } catch (error) {
    console.error('Tailscale whois error:', error.message);
    return {
      authorized: false,
      error: 'Could not verify Tailscale identity. Ensure you are on the tailnet.'
    };
  }
};
