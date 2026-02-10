import { describe, it, expect } from 'vitest';
import { FREE_LINK_LIMIT } from '$lib/types.js';
import { isLinkVisible } from '$lib/utils/helpers.js';

describe('Free plan gating', () => {
  it('FREE_LINK_LIMIT is 25', () => {
    expect(FREE_LINK_LIMIT).toBe(25);
  });
});

describe('isLinkVisible', () => {
  it('returns true for active link without scheduling', () => {
    expect(
      isLinkVisible({
        is_active: true,
        start_at: null,
        end_at: null,
      })
    ).toBe(true);
  });

  it('returns false for inactive link', () => {
    expect(
      isLinkVisible({
        is_active: false,
        start_at: null,
        end_at: null,
      })
    ).toBe(false);
  });

  it('returns false for link not yet started', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    expect(
      isLinkVisible({
        is_active: true,
        start_at: future.toISOString(),
        end_at: null,
      })
    ).toBe(false);
  });

  it('returns true for link that has started', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(
      isLinkVisible({
        is_active: true,
        start_at: past.toISOString(),
        end_at: null,
      })
    ).toBe(true);
  });

  it('returns false for link that has ended', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(
      isLinkVisible({
        is_active: true,
        start_at: null,
        end_at: past.toISOString(),
      })
    ).toBe(false);
  });

  it('returns true for link within scheduling window', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const future = new Date();
    future.setDate(future.getDate() + 1);
    expect(
      isLinkVisible({
        is_active: true,
        start_at: past.toISOString(),
        end_at: future.toISOString(),
      })
    ).toBe(true);
  });
});
