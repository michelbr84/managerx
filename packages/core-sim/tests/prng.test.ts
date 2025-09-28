import { describe, it, expect } from 'vitest';
import { createPrng } from '../src/prng.js';

describe('PRNG System', () => {
  describe('Basic Functionality', () => {
    it('should create PRNG with string seed', () => {
      const prng = createPrng('test-seed');
      
      expect(prng).toBeDefined();
      expect(typeof prng.next).toBe('function');
      expect(typeof prng.int).toBe('function');
    });

    it('should create PRNG with number seed', () => {
      const prng = createPrng(42);
      
      expect(prng).toBeDefined();
      expect(typeof prng.next).toBe('function');
      expect(typeof prng.int).toBe('function');
    });

    it('should generate numbers in [0, 1) range', () => {
      const prng = createPrng(42);
      
      for (let i = 0; i < 1000; i++) {
        const value = prng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should generate integers in specified range', () => {
      const prng = createPrng(42);
      const min = 5;
      const max = 15;
      
      for (let i = 0; i < 1000; i++) {
        const value = prng.int(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThan(max);
        expect(Number.isInteger(value)).toBe(true);
      }
    });
  });

  describe('Determinism', () => {
    it('should be deterministic with same seed', () => {
      const prng1 = createPrng('test-seed');
      const prng2 = createPrng('test-seed');
      
      for (let i = 0; i < 100; i++) {
        expect(prng1.next()).toBe(prng2.next());
      }
    });

    it('should be deterministic with same numeric seed', () => {
      const prng1 = createPrng(12345);
      const prng2 = createPrng(12345);
      
      for (let i = 0; i < 100; i++) {
        expect(prng1.int(1, 100)).toBe(prng2.int(1, 100));
      }
    });

    it('should produce different sequences with different seeds', () => {
      const prng1 = createPrng('seed1');
      const prng2 = createPrng('seed2');
      
      let differences = 0;
      for (let i = 0; i < 100; i++) {
        if (prng1.next() !== prng2.next()) {
          differences++;
        }
      }
      
      // Should have many differences
      expect(differences).toBeGreaterThan(90);
    });

    it('should handle string vs number seed conversion consistently', () => {
      const prng1 = createPrng('42');
      const prng2 = createPrng(42);
      
      // Different representations should produce different sequences
      let differences = 0;
      for (let i = 0; i < 10; i++) {
        if (prng1.next() !== prng2.next()) {
          differences++;
        }
      }
      
      expect(differences).toBeGreaterThan(0);
    });
  });

  describe('Distribution Quality', () => {
    it('should have good distribution for next()', () => {
      const prng = createPrng(42);
      const buckets = new Array(10).fill(0);
      const samples = 10000;
      
      for (let i = 0; i < samples; i++) {
        const value = prng.next();
        const bucket = Math.floor(value * 10);
        buckets[bucket]++;
      }
      
      // Each bucket should have roughly 10% of samples (±20%)
      const expectedPerBucket = samples / 10;
      buckets.forEach(count => {
        expect(count).toBeGreaterThan(expectedPerBucket * 0.8);
        expect(count).toBeLessThan(expectedPerBucket * 1.2);
      });
    });

    it('should have good distribution for int()', () => {
      const prng = createPrng(42);
      const min = 1;
      const max = 11; // 1-10 inclusive
      const counts = new Map<number, number>();
      const samples = 10000;
      
      for (let i = 0; i < samples; i++) {
        const value = prng.int(min, max);
        counts.set(value, (counts.get(value) || 0) + 1);
      }
      
      // Should generate all values in range
      for (let i = min; i < max; i++) {
        expect(counts.has(i)).toBe(true);
      }
      
      // Distribution should be roughly uniform
      const expectedPerValue = samples / (max - min);
      counts.forEach(count => {
        expect(count).toBeGreaterThan(expectedPerValue * 0.8);
        expect(count).toBeLessThan(expectedPerValue * 1.2);
      });
    });

    it('should handle edge cases for int() bounds', () => {
      const prng = createPrng(42);
      
      // Single value range
      for (let i = 0; i < 10; i++) {
        expect(prng.int(5, 6)).toBe(5);
      }
      
      // Large range
      const largeValue = prng.int(1, 1000000);
      expect(largeValue).toBeGreaterThanOrEqual(1);
      expect(largeValue).toBeLessThan(1000000);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid bounds for int()', () => {
      const prng = createPrng(42);
      
      // maxExclusive <= minInclusive
      expect(() => prng.int(10, 10)).toThrow();
      expect(() => prng.int(10, 5)).toThrow();
      
      // Non-finite numbers
      expect(() => prng.int(NaN, 10)).toThrow();
      expect(() => prng.int(1, Infinity)).toThrow();
      expect(() => prng.int(-Infinity, 10)).toThrow();
    });

    it('should handle negative ranges correctly', () => {
      const prng = createPrng(42);
      
      for (let i = 0; i < 100; i++) {
        const value = prng.int(-10, 0);
        expect(value).toBeGreaterThanOrEqual(-10);
        expect(value).toBeLessThan(0);
      }
    });

    it('should handle floating point precision issues', () => {
      const prng = createPrng(42);
      
      // Test with decimal bounds that might cause precision issues
      for (let i = 0; i < 100; i++) {
        const value = prng.int(0, 3);
        expect([0, 1, 2]).toContain(value);
      }
    });
  });

  describe('Performance', () => {
    it('should generate numbers quickly', () => {
      const prng = createPrng(42);
      const iterations = 100000;
      
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        prng.next();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const timePerIteration = totalTime / iterations;
      
      console.log(`PRNG performance: ${timePerIteration.toFixed(6)}ms per call`);
      
      // Should be very fast
      expect(timePerIteration).toBeLessThan(0.001); // 1 microsecond per call
    });

    it('should generate integers quickly', () => {
      const prng = createPrng(42);
      const iterations = 50000;
      
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        prng.int(1, 100);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      console.log(`PRNG int() performance: ${totalTime.toFixed(2)}ms for ${iterations} calls`);
      
      // Should complete quickly
      expect(totalTime).toBeLessThan(100); // 100ms for 50k calls
    });
  });

  describe('Seed Handling', () => {
    it('should handle empty string seed', () => {
      const prng = createPrng('');
      
      expect(() => {
        for (let i = 0; i < 10; i++) {
          prng.next();
        }
      }).not.toThrow();
    });

    it('should handle very long string seeds', () => {
      const longSeed = 'a'.repeat(1000);
      const prng = createPrng(longSeed);
      
      expect(() => {
        for (let i = 0; i < 10; i++) {
          prng.next();
        }
      }).not.toThrow();
    });

    it('should handle special characters in seeds', () => {
      const specialSeed = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const prng = createPrng(specialSeed);
      
      expect(() => {
        for (let i = 0; i < 10; i++) {
          prng.next();
        }
      }).not.toThrow();
    });

    it('should handle zero seed', () => {
      const prng = createPrng(0);
      
      expect(() => {
        for (let i = 0; i < 10; i++) {
          prng.next();
        }
      }).not.toThrow();
    });

    it('should handle negative number seeds', () => {
      const prng = createPrng(-12345);
      
      expect(() => {
        for (let i = 0; i < 10; i++) {
          prng.next();
        }
      }).not.toThrow();
    });
  });

  describe('Statistical Properties', () => {
    it('should pass basic randomness tests', () => {
      const prng = createPrng(42);
      const values: number[] = [];
      
      // Generate sequence
      for (let i = 0; i < 1000; i++) {
        values.push(prng.next());
      }
      
      // Test 1: Mean should be around 0.5
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      expect(mean).toBeCloseTo(0.5, 1);
      
      // Test 2: No obvious patterns in consecutive values
      let consecutiveIdentical = 0;
      for (let i = 1; i < values.length; i++) {
        if (values[i] === values[i - 1]) {
          consecutiveIdentical++;
        }
      }
      
      // Should have very few identical consecutive values
      expect(consecutiveIdentical).toBeLessThan(10);
    });

    it('should have low autocorrelation', () => {
      const prng = createPrng(42);
      const values: number[] = [];
      
      for (let i = 0; i < 1000; i++) {
        values.push(prng.next());
      }
      
      // Simple autocorrelation test with lag 1
      let correlation = 0;
      for (let i = 1; i < values.length; i++) {
        correlation += values[i] * values[i - 1];
      }
      correlation /= (values.length - 1);
      
      // Autocorrelation should be low (close to 0.25 for independent uniform variables)
      expect(correlation).toBeCloseTo(0.25, 1);
    });
  });
});
