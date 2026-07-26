import { describe, it, expect, beforeEach } from 'vitest';
import { loadFromStorage, STORAGE_KEY } from '../state';

describe('loadFromStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(loadFromStorage()).toBeNull();
  });

  it('parses the stored JSON correctly', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ product: { id: 'prod-002' } }));
    expect(loadFromStorage()).toEqual({ product: { id: 'prod-002' } });
  });

  it('returns null when the stored JSON is corrupted (catch branch)', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid-json---');
    expect(loadFromStorage()).toBeNull();
  });
});