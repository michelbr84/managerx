import { describe, it, expect } from 'vitest';
import { simulateMatch } from '../src/engine.js';
import type { Team, Weather, MatchContext } from '../src/types.js';

// Mock team factory for engine testing
const createTestTeam = (id: string, rating: number): Team => ({
  id,
  name: `${id} FC`,
  players: Array.from({ length: 11 }, (_, i) => ({
    id: `${id}-P${i}`,
    name: `Player ${i}`,
    position: i === 0 ? 'GK' : i <= 4 ? 'DF' : i <= 8 ? 'MF' : 'FW',
    attributes: {
      finishing: 10,
      passing: 10,
      crossing: 10,
      dribbling: 10,
      technique: 10,
      pace: 10,
      strength: 10,
      stamina: 10,
      decisions: 10,
      positioning: 10,
      anticipation: 10,
      tackling: 10,
      marking: 10,
    },
    stamina: 90,
    morale: 75,
    condition: 95,
  })),
  tactics: {
    formation: '4-4-2',
    mentality: 'balanced',
    pressing: 'medium',
    tempo: 'medium',
    width: 'normal',
  },
  overallRating: rating,
});

describe('Match Engine', () => {
  describe('Core Simulation', () => {
    it('should simulate complete matches', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const result = simulateMatch(42, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('homeScore');
      expect(result).toHaveProperty('awayScore');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('duration');
      
      // Duration should be realistic (90+ minutes)
      expect(result.duration).toBeGreaterThanOrEqual(90);
      expect(result.duration).toBeLessThan(105);
    });

    it('should be deterministic with same inputs', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const result1 = simulateMatch(42, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear');
      const result2 = simulateMatch(42, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear');
      
      expect(result1.homeScore).toBe(result2.homeScore);
      expect(result1.awayScore).toBe(result2.awayScore);
      expect(result1.duration).toBe(result2.duration);
      expect(result1.events.length).toBe(result2.events.length);
    });

    it('should produce different results with different seeds', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(simulateMatch(i, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear'));
      }
      
      // Should have variety in results
      const scores = results.map(r => `${r.homeScore}-${r.awayScore}`);
      const uniqueScores = new Set(scores);
      
      expect(uniqueScores.size).toBeGreaterThan(1);
    });
  });

  describe('Team Quality Effects', () => {
    it('should favor stronger teams', () => {
      const strongTeam = createTestTeam('STRONG', 150);
      const weakTeam = createTestTeam('WEAK', 70);
      
      const results = [];
      for (let i = 0; i < 20; i++) {
        results.push(simulateMatch(i, 'STRONG', 'WEAK', strongTeam, weakTeam, 'clear'));
      }
      
      const avgHomeScore = results.reduce((sum, r) => sum + r.homeScore, 0) / results.length;
      const avgAwayScore = results.reduce((sum, r) => sum + r.awayScore, 0) / results.length;
      
      // Strong home team should score more on average
      expect(avgHomeScore).toBeGreaterThan(avgAwayScore);
      expect(avgHomeScore).toBeGreaterThan(1.5); // Should be clearly superior
    });

    it('should generate appropriate xG for team quality', () => {
      const strongTeam = createTestTeam('STRONG', 160);
      const weakTeam = createTestTeam('WEAK', 60);
      
      const result = simulateMatch(42, 'STRONG', 'WEAK', strongTeam, weakTeam, 'clear');
      
      // Strong team should have higher xG
      expect(result.stats.xG.home).toBeGreaterThan(result.stats.xG.away);
    });
  });

  describe('Weather Integration', () => {
    it('should apply weather effects to simulation', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const clearResult = simulateMatch(42, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear');
      const rainResult = simulateMatch(42, 'HOME', 'AWAY', homeTeam, awayTeam, 'rain');
      const snowResult = simulateMatch(42, 'HOME', 'AWAY', homeTeam, awayTeam, 'snow');
      
      // Results should be valid for all weather types
      [clearResult, rainResult, snowResult].forEach(result => {
        expect(result.homeScore).toBeGreaterThanOrEqual(0);
        expect(result.awayScore).toBeGreaterThanOrEqual(0);
        expect(result.events.length).toBeGreaterThan(0);
      });
    });

    it('should show weather impact on statistics', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const results = [];
      const weathers: Weather[] = ['clear', 'rain', 'snow', 'wind'];
      
      weathers.forEach(weather => {
        for (let i = 0; i < 5; i++) {
          results.push({
            weather,
            result: simulateMatch(i, 'HOME', 'AWAY', homeTeam, awayTeam, weather)
          });
        }
      });
      
      // Group by weather and calculate averages
      const weatherStats = weathers.map(weather => {
        const weatherResults = results.filter(r => r.weather === weather);
        const avgXG = weatherResults.reduce((sum, r) => sum + r.result.stats.xG.home + r.result.stats.xG.away, 0) / weatherResults.length;
        
        return { weather, avgXG };
      });
      
      // Should have some variation between weather types
      const xGValues = weatherStats.map(s => s.avgXG);
      const minXG = Math.min(...xGValues);
      const maxXG = Math.max(...xGValues);
      
      expect(maxXG - minXG).toBeGreaterThan(0); // Some variation expected
    });
  });

  describe('Event Generation', () => {
    it('should generate events throughout the match', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const result = simulateMatch(42, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear');
      
      // Should have events distributed across time
      const firstHalfEvents = result.events.filter(e => e.minute <= 45);
      const secondHalfEvents = result.events.filter(e => e.minute > 45);
      
      expect(firstHalfEvents.length).toBeGreaterThan(0);
      expect(secondHalfEvents.length).toBeGreaterThan(0);
    });

    it('should generate realistic event types', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(simulateMatch(i, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear'));
      }
      
      const allEvents = results.flatMap(r => r.events);
      const eventTypes = new Set(allEvents.map(e => e.type));
      
      // Should have variety of event types
      expect(eventTypes.size).toBeGreaterThan(1);
      
      // Common event types should be present
      const commonTypes = ['shot', 'chance'];
      const hasCommonTypes = commonTypes.some(type => eventTypes.has(type));
      expect(hasCommonTypes).toBe(true);
    });

    it('should maintain chronological order of events', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const result = simulateMatch(42, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear');
      
      for (let i = 1; i < result.events.length; i++) {
        expect(result.events[i].minute).toBeGreaterThanOrEqual(result.events[i - 1].minute);
      }
    });
  });

  describe('Statistics Generation', () => {
    it('should generate complete match statistics', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const result = simulateMatch(42, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear');
      
      const stats = result.stats;
      
      // Possession should add up to ~100%
      const totalPossession = stats.possession.home + stats.possession.away;
      expect(totalPossession).toBeCloseTo(100, 5);
      
      // xG should be reasonable
      expect(stats.xG.home).toBeGreaterThanOrEqual(0);
      expect(stats.xG.home).toBeLessThan(10);
      expect(stats.xG.away).toBeGreaterThanOrEqual(0);
      expect(stats.xG.away).toBeLessThan(10);
      
      // Shots on target should not exceed total shots
      expect(stats.shotsOnTarget.home).toBeLessThanOrEqual(stats.shots.home);
      expect(stats.shotsOnTarget.away).toBeLessThanOrEqual(stats.shots.away);
      
      // Pass accuracy should be percentage
      expect(stats.passAccuracy.home).toBeGreaterThanOrEqual(0);
      expect(stats.passAccuracy.home).toBeLessThanOrEqual(100);
      expect(stats.passAccuracy.away).toBeGreaterThanOrEqual(0);
      expect(stats.passAccuracy.away).toBeLessThanOrEqual(100);
    });

    it('should correlate goals with xG reasonably', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const results = [];
      for (let i = 0; i < 50; i++) {
        results.push(simulateMatch(i, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear'));
      }
      
      // Calculate correlation between goals and xG
      let totalGoals = 0;
      let totalXG = 0;
      
      results.forEach(result => {
        totalGoals += result.homeScore + result.awayScore;
        totalXG += result.stats.xG.home + result.stats.xG.away;
      });
      
      const avgGoals = totalGoals / results.length;
      const avgXG = totalXG / results.length;
      
      // Goals and xG should be reasonably correlated
      expect(Math.abs(avgGoals - avgXG)).toBeLessThan(1.0);
    });
  });

  describe('Performance', () => {
    it('should simulate matches efficiently', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        simulateMatch(i, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear');
      }
      
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 10;
      
      console.log(`Average engine simulation time: ${averageTime.toFixed(2)}ms`);
      
      // Should be fast enough for real-time use
      expect(averageTime).toBeLessThan(200); // 200ms per match
    });
  });

  describe('Edge Cases', () => {
    it('should handle teams with no players gracefully', () => {
      const emptyTeam: Team = {
        id: 'EMPTY',
        name: 'Empty FC',
        players: [],
        tactics: {
          formation: '4-4-2',
          mentality: 'balanced',
          pressing: 'medium',
          tempo: 'medium',
          width: 'normal',
        },
        overallRating: 50,
      };
      
      const normalTeam = createTestTeam('NORMAL', 100);
      
      expect(() => {
        simulateMatch(42, 'EMPTY', 'NORMAL', emptyTeam, normalTeam, 'clear');
      }).not.toThrow();
    });

    it('should handle extreme team ratings', () => {
      const superTeam = createTestTeam('SUPER', 200);
      const terribleTeam = createTestTeam('TERRIBLE', 20);
      
      const result = simulateMatch(42, 'SUPER', 'TERRIBLE', superTeam, terribleTeam, 'clear');
      
      expect(result).toBeDefined();
      expect(result.homeScore).toBeGreaterThanOrEqual(0);
      expect(result.awayScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle all weather conditions', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      const weathers: Weather[] = ['clear', 'rain', 'snow', 'wind'];
      
      weathers.forEach(weather => {
        expect(() => {
          const result = simulateMatch(42, 'HOME', 'AWAY', homeTeam, awayTeam, weather);
          expect(result).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('Stoppage Time', () => {
    it('should add appropriate stoppage time', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const results = [];
      for (let i = 0; i < 20; i++) {
        results.push(simulateMatch(i, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear'));
      }
      
      results.forEach(result => {
        const stoppageTime = result.duration - 90;
        
        // Stoppage time should be realistic
        expect(stoppageTime).toBeGreaterThanOrEqual(1);
        expect(stoppageTime).toBeLessThan(10);
      });
    });

    it('should vary stoppage time based on events', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(simulateMatch(i, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear'));
      }
      
      const stoppageTimes = results.map(r => r.duration - 90);
      const uniqueStoppageTimes = new Set(stoppageTimes);
      
      // Should have some variation in stoppage time
      expect(uniqueStoppageTimes.size).toBeGreaterThan(1);
    });
  });

  describe('Event Quality', () => {
    it('should generate events with proper structure', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const result = simulateMatch(42, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear');
      
      result.events.forEach(event => {
        expect(event).toHaveProperty('minute');
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('team');
        expect(event).toHaveProperty('description');
        
        expect(typeof event.minute).toBe('number');
        expect(typeof event.type).toBe('string');
        expect(['home', 'away']).toContain(event.team);
        expect(typeof event.description).toBe('string');
        expect(event.description.length).toBeGreaterThan(0);
        
        // Events with xG should have valid values
        if (event.xG !== undefined) {
          expect(event.xG).toBeGreaterThanOrEqual(0);
          expect(event.xG).toBeLessThanOrEqual(1);
        }
      });
    });

    it('should generate meaningful event descriptions', () => {
      const homeTeam = createTestTeam('HOME', 100);
      const awayTeam = createTestTeam('AWAY', 100);
      
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(simulateMatch(i, 'HOME', 'AWAY', homeTeam, awayTeam, 'clear'));
      }
      
      const allEvents = results.flatMap(r => r.events);
      
      allEvents.forEach(event => {
        expect(event.description.length).toBeGreaterThan(5);
        
        // Goal events should mention scoring
        if (event.type === 'goal') {
          expect(event.description.toLowerCase()).toMatch(/goal|score/);
        }
        
        // Shot events should mention shooting
        if (event.type === 'shot') {
          expect(event.description.toLowerCase()).toMatch(/shot|shoot|save|wide/);
        }
      });
    });
  });
});
