import { describe, it, expect, vi } from 'vitest';
import { handleWhois } from './auth_logic';

describe('handleWhois', () => {
  it('should return authorized for a valid user', async () => {
    const mockOutput = JSON.stringify({
      UserProfile: { LoginName: 'tommyroar@tailscale.com' },
      Node: { ComputedName: 'ipad-mini' }
    });

    const mockExec = vi.fn((cmd, callback) => {
      callback(null, mockOutput, '');
    });

    const result = await handleWhois('100.64.0.1', mockExec);

    expect(result).toEqual({
      authorized: true,
      user: 'tommyroar@tailscale.com',
      device: 'ipad-mini'
    });
    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('100.64.0.1'), expect.any(Function));
  });

  it('should return unauthorized for an unknown user', async () => {
    const mockOutput = JSON.stringify({
      UserProfile: { LoginName: 'random-user@gmail.com' },
      Node: { ComputedName: 'unknown-device' }
    });

    const mockExec = vi.fn((cmd, callback) => {
      callback(null, mockOutput, '');
    });

    const result = await handleWhois('100.64.0.2', mockExec);

    expect(result).toEqual({
      authorized: false,
      user: 'random-user@gmail.com',
      device: 'unknown-device'
    });
  });

  it('should handle errors gracefully when tailscale whois fails', async () => {
    const mockExec = vi.fn((cmd, callback) => {
      callback(new Error('Tailscale command failed'), '', '');
    });

    const result = await handleWhois('192.168.1.1', mockExec);

    expect(result).toEqual({
      authorized: false,
      error: 'Could not verify Tailscale identity. Ensure you are on the tailnet.'
    });
  });
});
