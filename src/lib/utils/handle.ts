import type { HandleValidation } from '$lib/types.js';

const HANDLE_REGEX = /^[a-z0-9]([a-z0-9-]{1,22}[a-z0-9])?$/;

export function validateHandle(handle: string): HandleValidation {
  if (!handle) {
    return { valid: false, error: 'Handle is required' };
  }

  if (handle.length < 3) {
    return { valid: false, error: 'At least 3 characters' };
  }

  if (handle.length > 24) {
    return { valid: false, error: 'Maximum 24 characters' };
  }

  if (handle !== handle.toLowerCase()) {
    return { valid: false, error: 'Lowercase only' };
  }

  if (handle.startsWith('-') || handle.endsWith('-')) {
    return { valid: false, error: 'Cannot start or end with a hyphen' };
  }

  if (handle.includes('--')) {
    return { valid: false, error: 'Cannot contain consecutive hyphens' };
  }

  if (!HANDLE_REGEX.test(handle)) {
    return {
      valid: false,
      error: 'Only lowercase letters, numbers, and hyphens',
    };
  }

  return { valid: true };
}
