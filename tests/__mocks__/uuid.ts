// tests/__mocks__/uuid.ts
// CJS-compatible mock for uuid v13 (ESM-only) to work with Jest

let counter = 0;

export function v4(): string {
  counter++;
  return `mock-uuid-${counter.toString().padStart(4, '0')}`;
}

export default { v4 };
