import { describe, it, expect } from 'vitest';
import { validateHandle } from '$lib/utils/handle.js';

describe('validateHandle', () => {
  it('rejects empty handle', () => {
    expect(validateHandle('')).toEqual({
      valid: false,
      error: 'Handle is required',
    });
  });

  it('rejects handles shorter than 3 characters', () => {
    expect(validateHandle('ab')).toEqual({
      valid: false,
      error: 'At least 3 characters',
    });
  });

  it('rejects handles longer than 24 characters', () => {
    expect(validateHandle('a'.repeat(25))).toEqual({
      valid: false,
      error: 'Maximum 24 characters',
    });
  });

  it('rejects uppercase characters', () => {
    expect(validateHandle('Hello')).toEqual({
      valid: false,
      error: 'Lowercase only',
    });
  });

  it('rejects handles starting with hyphen', () => {
    expect(validateHandle('-abc')).toEqual({
      valid: false,
      error: 'Cannot start or end with a hyphen',
    });
  });

  it('rejects handles ending with hyphen', () => {
    expect(validateHandle('abc-')).toEqual({
      valid: false,
      error: 'Cannot start or end with a hyphen',
    });
  });

  it('rejects consecutive hyphens', () => {
    expect(validateHandle('ab--cd')).toEqual({
      valid: false,
      error: 'Cannot contain consecutive hyphens',
    });
  });

  it('rejects special characters', () => {
    expect(validateHandle('abc_def')).toEqual({
      valid: false,
      error: 'Only lowercase letters, numbers, and hyphens',
    });
  });

  it('rejects spaces', () => {
    expect(validateHandle('abc def')).toEqual({
      valid: false,
      error: 'Only lowercase letters, numbers, and hyphens',
    });
  });

  it('accepts valid handles', () => {
    expect(validateHandle('abc')).toEqual({ valid: true });
    expect(validateHandle('my-site')).toEqual({ valid: true });
    expect(validateHandle('user123')).toEqual({ valid: true });
    expect(validateHandle('a1b2c3')).toEqual({ valid: true });
    expect(validateHandle('my-cool-page')).toEqual({ valid: true });
  });

  it('accepts exact 3 character handles', () => {
    expect(validateHandle('abc')).toEqual({ valid: true });
  });

  it('accepts exact 24 character handles', () => {
    const h = 'abcdefghijklmnopqrstuvwx'; // 24 chars
    expect(validateHandle(h)).toEqual({ valid: true });
  });
});
