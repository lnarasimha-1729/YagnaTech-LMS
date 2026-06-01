import { jest } from '@jest/globals';
import {
  CODE_LENGTH,
  CODE_PATTERN,
  generateCollegeCode,
  generateUniqueCollegeCode,
  isValidCollegeCode,
  normalizeCollegeCode,
} from './collegeCode.js';

describe('generateCollegeCode (deterministic generation)', () => {
  test('produces a 4-char [A-Z0-9] code', () => {
    const code = generateCollegeCode('clg_abc123');
    expect(code).toHaveLength(CODE_LENGTH);
    expect(CODE_PATTERN.test(code)).toBe(true);
  });

  test('same clgId always yields the same code', () => {
    const a = generateCollegeCode('clg_abc123');
    const b = generateCollegeCode('clg_abc123');
    const c = generateCollegeCode('clg_abc123');
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  test('different clgIds generally yield different codes', () => {
    const a = generateCollegeCode('clg_one');
    const b = generateCollegeCode('clg_two');
    expect(a).not.toBe(b);
  });

  test('accepts numeric clgId by coercing to string', () => {
    expect(generateCollegeCode(12345)).toBe(generateCollegeCode('12345'));
  });

  test('throws on empty/missing clgId', () => {
    expect(() => generateCollegeCode('')).toThrow();
    expect(() => generateCollegeCode(null)).toThrow();
    expect(() => generateCollegeCode(undefined)).toThrow();
  });
});

describe('generateUniqueCollegeCode (collision handling)', () => {
  test('returns the deterministic base code when no collision', async () => {
    const base = generateCollegeCode('clg_nocollide');
    const code = await generateUniqueCollegeCode('clg_nocollide', () => false);
    expect(code).toBe(base);
  });

  test('appends a retry counter to resolve a collision, deterministically', async () => {
    const base = generateCollegeCode('clg_collide');
    const taken = new Set([base]);

    const first = await generateUniqueCollegeCode('clg_collide', (c) => taken.has(c));
    expect(first).not.toBe(base);
    expect(CODE_PATTERN.test(first)).toBe(true);

    // Same starting condition → same resolved code (collision handling is
    // deterministic, not random).
    const again = await generateUniqueCollegeCode('clg_collide', (c) => taken.has(c));
    expect(again).toBe(first);
  });

  test('walks multiple attempts until a free code is found', async () => {
    const base = generateCollegeCode('clg_multi');
    const seen = [];
    // Reject the first 3 candidates, accept the 4th. isTaken records each
    // candidate so we can assert it actually advanced the counter.
    let rejects = 3;
    const isTaken = (c) => {
      seen.push(c);
      if (rejects > 0) {
        rejects -= 1;
        return true;
      }
      return false;
    };
    const code = await generateUniqueCollegeCode('clg_multi', isTaken);
    expect(seen[0]).toBe(base); // attempt 0 is the base code
    expect(seen).toHaveLength(4);
    expect(code).toBe(seen[3]);
    expect(CODE_PATTERN.test(code)).toBe(true);
  });

  test('supports async isTaken callbacks', async () => {
    const taken = new Set([generateCollegeCode('clg_async')]);
    const isTaken = async (c) => taken.has(c);
    const code = await generateUniqueCollegeCode('clg_async', isTaken);
    expect(taken.has(code)).toBe(false);
  });

  test('throws after exhausting maxAttempts', async () => {
    await expect(
      generateUniqueCollegeCode('clg_exhaust', () => true, 5)
    ).rejects.toThrow(/unique college code/i);
  });

  test('requires an isTaken callback', async () => {
    await expect(generateUniqueCollegeCode('clg_x')).rejects.toThrow();
  });
});

describe('uniqueness across a batch (simulated)', () => {
  test('assigning codes to many colleges yields no duplicates', async () => {
    const assigned = new Set();
    const isTaken = (c) => assigned.has(c);
    for (let i = 0; i < 500; i++) {
      // eslint-disable-next-line no-await-in-loop
      const code = await generateUniqueCollegeCode(`clg_${i}`, isTaken);
      expect(assigned.has(code)).toBe(false);
      assigned.add(code);
    }
    expect(assigned.size).toBe(500);
  });
});

describe('isValidCollegeCode / normalizeCollegeCode (invalid code validation)', () => {
  test('accepts a well-formed 4-char code', () => {
    expect(isValidCollegeCode('AB12')).toBe(true);
    expect(isValidCollegeCode('0000')).toBe(true);
    expect(isValidCollegeCode('ZZZZ')).toBe(true);
  });

  test('normalizes case and surrounding whitespace before validating', () => {
    expect(isValidCollegeCode('  ab12 ')).toBe(true);
    expect(normalizeCollegeCode('  ab12 ')).toBe('AB12');
  });

  test('rejects wrong length', () => {
    expect(isValidCollegeCode('ABC')).toBe(false);
    expect(isValidCollegeCode('ABCDE')).toBe(false);
    expect(isValidCollegeCode('')).toBe(false);
  });

  test('rejects disallowed characters', () => {
    expect(isValidCollegeCode('AB1-')).toBe(false);
    expect(isValidCollegeCode('AB 1')).toBe(false);
    expect(isValidCollegeCode('AB_1')).toBe(false);
    expect(isValidCollegeCode('é123')).toBe(false);
  });

  test('rejects non-string input', () => {
    expect(isValidCollegeCode(1234)).toBe(false);
    expect(isValidCollegeCode(null)).toBe(false);
    expect(isValidCollegeCode(undefined)).toBe(false);
    expect(isValidCollegeCode({})).toBe(false);
  });

  test('every generated code passes validation', () => {
    for (let i = 0; i < 200; i++) {
      expect(isValidCollegeCode(generateCollegeCode(`clg_validate_${i}`))).toBe(true);
    }
  });
});
