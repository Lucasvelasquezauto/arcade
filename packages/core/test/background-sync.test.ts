import { describe, expect, it, vi } from 'vitest';
import { RECORDS_SYNC_TAG, registerBackgroundSync } from '../src/records/background-sync.js';

describe('registerBackgroundSync (spec §8.7 — opportunistic only)', () => {
  it('is a no-op with no registration', () => {
    expect(() => registerBackgroundSync(null)).not.toThrow();
    expect(() => registerBackgroundSync(undefined)).not.toThrow();
  });

  it('is a no-op when the registration has no sync API (e.g. iOS Safari)', () => {
    expect(() => registerBackgroundSync({})).not.toThrow();
  });

  it('registers the records sync tag when the API exists', () => {
    const register = vi.fn().mockResolvedValue(undefined);
    registerBackgroundSync({ sync: { register } });
    expect(register).toHaveBeenCalledWith(RECORDS_SYNC_TAG);
  });

  it('a registration failure never throws or rejects uncaught', async () => {
    const register = vi.fn().mockRejectedValue(new Error('permission dismissed'));
    expect(() => registerBackgroundSync({ sync: { register } })).not.toThrow();
    await Promise.resolve(); // let the swallowed rejection settle
    await Promise.resolve();
  });
});
