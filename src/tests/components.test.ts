import { describe, it, expect } from 'vitest';
import { FREE_COMPONENT_LIMIT, FREE_LINK_LIMIT } from '$lib/types.js';

// ─── Constants ───────────────────────────────────────────────

describe('Component plan limits', () => {
  it('FREE_COMPONENT_LIMIT is 6', () => {
    expect(FREE_COMPONENT_LIMIT).toBe(6);
  });

  it('FREE_LINK_LIMIT is 25', () => {
    expect(FREE_LINK_LIMIT).toBe(25);
  });
});

// ─── Component limit enforcement (logic unit tests) ──────────

/**
 * Simulates the server-side check for component limits.
 * Mirrors the logic in convex/components.ts `add` handler.
 */
function canAddComponent(plan: 'FREE' | 'PRO', currentCount: number): boolean {
  if (plan === 'PRO') return true;
  return currentCount < FREE_COMPONENT_LIMIT;
}

describe('canAddComponent', () => {
  it('PRO user can always add components regardless of count', () => {
    expect(canAddComponent('PRO', 0)).toBe(true);
    expect(canAddComponent('PRO', FREE_COMPONENT_LIMIT)).toBe(true);
    expect(canAddComponent('PRO', FREE_COMPONENT_LIMIT + 10)).toBe(true);
  });

  it('FREE user can add when below limit', () => {
    expect(canAddComponent('FREE', 0)).toBe(true);
    expect(canAddComponent('FREE', FREE_COMPONENT_LIMIT - 1)).toBe(true);
  });

  it('FREE user cannot add when at limit', () => {
    expect(canAddComponent('FREE', FREE_COMPONENT_LIMIT)).toBe(false);
  });

  it('FREE user cannot add when above limit', () => {
    expect(canAddComponent('FREE', FREE_COMPONENT_LIMIT + 1)).toBe(false);
  });
});

// ─── Reorder logic ───────────────────────────────────────────

interface MinimalComponent {
  id: string;
  orderIndex: number;
}

/**
 * Simulates the reorder mutation from convex/components.ts.
 * Returns a new array with updated orderIndexes in the given order.
 */
function applyReorder(
  components: MinimalComponent[],
  order: string[],
): MinimalComponent[] {
  return order.map((id, i) => {
    const comp = components.find((c) => c.id === id);
    if (!comp) throw new Error(`Component ${id} not found`);
    return { ...comp, orderIndex: i };
  });
}

describe('Component reorder', () => {
  const initialComponents: MinimalComponent[] = [
    { id: 'a', orderIndex: 0 },
    { id: 'b', orderIndex: 1 },
    { id: 'c', orderIndex: 2 },
  ];

  it('reorder assigns sequential orderIndexes in given order', () => {
    const result = applyReorder(initialComponents, ['c', 'a', 'b']);
    expect(result.find((c) => c.id === 'c')?.orderIndex).toBe(0);
    expect(result.find((c) => c.id === 'a')?.orderIndex).toBe(1);
    expect(result.find((c) => c.id === 'b')?.orderIndex).toBe(2);
  });

  it('reorder is idempotent when same order is applied', () => {
    const result = applyReorder(initialComponents, ['a', 'b', 'c']);
    expect(result.find((c) => c.id === 'a')?.orderIndex).toBe(0);
    expect(result.find((c) => c.id === 'b')?.orderIndex).toBe(1);
    expect(result.find((c) => c.id === 'c')?.orderIndex).toBe(2);
  });

  it('reorder with two elements swaps correctly', () => {
    const twoComps: MinimalComponent[] = [
      { id: 'x', orderIndex: 0 },
      { id: 'y', orderIndex: 1 },
    ];
    const result = applyReorder(twoComps, ['y', 'x']);
    expect(result.find((c) => c.id === 'y')?.orderIndex).toBe(0);
    expect(result.find((c) => c.id === 'x')?.orderIndex).toBe(1);
  });
});

// ─── moveUp / moveDown logic ─────────────────────────────────

function applyMoveUp(
  components: MinimalComponent[],
  targetId: string,
): MinimalComponent[] {
  const sorted = [...components].sort((a, b) => a.orderIndex - b.orderIndex);
  const idx = sorted.findIndex((c) => c.id === targetId);
  if (idx <= 0) return components; // already first
  const result = sorted.map((c) => ({ ...c }));
  const prev = result[idx - 1];
  const curr = result[idx];
  const tmp = prev.orderIndex;
  prev.orderIndex = curr.orderIndex;
  curr.orderIndex = tmp;
  return result;
}

function applyMoveDown(
  components: MinimalComponent[],
  targetId: string,
): MinimalComponent[] {
  const sorted = [...components].sort((a, b) => a.orderIndex - b.orderIndex);
  const idx = sorted.findIndex((c) => c.id === targetId);
  if (idx < 0 || idx >= sorted.length - 1) return components; // already last
  const result = sorted.map((c) => ({ ...c }));
  const next = result[idx + 1];
  const curr = result[idx];
  const tmp = next.orderIndex;
  next.orderIndex = curr.orderIndex;
  curr.orderIndex = tmp;
  return result;
}

describe('moveUp', () => {
  const comps: MinimalComponent[] = [
    { id: 'a', orderIndex: 0 },
    { id: 'b', orderIndex: 1 },
    { id: 'c', orderIndex: 2 },
  ];

  it('moves second item to first position', () => {
    const result = applyMoveUp(comps, 'b');
    expect(result.find((c) => c.id === 'b')?.orderIndex).toBe(0);
    expect(result.find((c) => c.id === 'a')?.orderIndex).toBe(1);
  });

  it('does nothing when already first', () => {
    const result = applyMoveUp(comps, 'a');
    expect(result.find((c) => c.id === 'a')?.orderIndex).toBe(0);
  });
});

describe('moveDown', () => {
  const comps: MinimalComponent[] = [
    { id: 'a', orderIndex: 0 },
    { id: 'b', orderIndex: 1 },
    { id: 'c', orderIndex: 2 },
  ];

  it('moves second item to last position', () => {
    const result = applyMoveDown(comps, 'b');
    expect(result.find((c) => c.id === 'b')?.orderIndex).toBe(2);
    expect(result.find((c) => c.id === 'c')?.orderIndex).toBe(1);
  });

  it('does nothing when already last', () => {
    const result = applyMoveDown(comps, 'c');
    expect(result.find((c) => c.id === 'c')?.orderIndex).toBe(2);
  });
});

// ─── config validation logic ─────────────────────────────────

function validateLinksConfig(config: unknown): { layout: string } {
  const validLayouts = ['LIST_ICON', 'GRID_ICON', 'GRID_IMAGE', 'LIST_IMAGE'];
  const c = config as Record<string, unknown> | null | undefined;
  return {
    layout: validLayouts.includes(c?.layout as string)
      ? (c!.layout as string)
      : 'LIST_ICON',
  };
}

describe('validateLinksConfig', () => {
  it('accepts valid layout', () => {
    expect(validateLinksConfig({ layout: 'GRID_ICON' })).toEqual({ layout: 'GRID_ICON' });
  });

  it('falls back to LIST_ICON for invalid layout', () => {
    expect(validateLinksConfig({ layout: 'INVALID' })).toEqual({ layout: 'LIST_ICON' });
    expect(validateLinksConfig(null)).toEqual({ layout: 'LIST_ICON' });
    expect(validateLinksConfig({})).toEqual({ layout: 'LIST_ICON' });
  });
});
