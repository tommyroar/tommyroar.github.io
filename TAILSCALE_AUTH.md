# Tailscale Authentication for Monitoring Page

This project uses **Tailscale Whois** to authorize access to the `/monitoring` route. Access is restricted to specific Tailscale users.

## How it Works
1.  **Frontend:** The `Monitoring` component attempts to fetch identity information from a local auth server.
2.  **Backend:** A small Node.js server (`scripts/auth_server.js`) runs on the Mac Mini.
3.  **Verification:** The server identifies the requester's IP and runs `tailscale whois --json [ip]` to retrieve their Tailscale identity.
4.  **Authorization:** If the identity matches `tommyroar`, access is granted.

## Setup & Execution

### 1. Start the Auth Server
Before accessing the monitoring page, start the local authentication service on the Mac Mini:

```bash
node scripts/auth_server.js
```

The server will listen on port **3001**.

### 2. Configure Tailscale
Ensure **Tailscale** is running on both the Mac Mini and the device you are using to access the site (e.g., your iPad).

### 3. Accessing the Page
- Navigate to the `/monitoring` route.
- The UI will show a loading indicator while it verifies your identity.
- Upon success, the page content is revealed.

## Security Note
This method provides "zero-touch" authentication by leveraging the cryptographically verified identity provided by your private Tailscale network. It does **not** require passwords or biometric prompts once you are connected to the tailnet.
