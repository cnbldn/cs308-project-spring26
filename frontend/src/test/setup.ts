import '@testing-library/jest-dom';
import { vi } from 'vitest';

let store: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => {
    return store[key] || null;
  }),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    store = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});