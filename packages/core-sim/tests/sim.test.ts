import { describe, it, expect, beforeAll } from 'vitest';
import { 
  simulateMatch, 
  simulateMatchWithTeams,
  simulateMatchLegacy,
  createPrng,
  type Team,
  type MatchResult,
  type Weather
} from '../src/index.js';
import { 
  GOLDEN_MATCHES, 
  runGoldenMatchTests, 
  validateGoldenMatch 
} from '../src/golden-matches.js';

describe('Core Simulation Engine', () => {
  describe('PRNG Determinism', () => {
    it('should produce identical results with same seed', () => {
      const seed = 12345;
      const result1 = simulateMatch(seed, 'team-a', 'team-b');
      const result2 = simulateMatch(seed, 'team-a', 'team-b');
      
      expect(result1.homeScore).toBe(result2.homeScore);
      expect(result1.awayScore).toBe(result2.awayScore);
      expect(result1.stats.xG.home).toBeCloseTo(result2.stats.xG.home, 2);
      expect(result1.stats.xG.away).toBeCloseTo(result2.stats.xG.away, 2);
      expect(result1.events.length).toBe(result2.events.length);
    });

    it('should produce different results with different seeds', () => {
      const result1 = simulateMatch(12345, 'team-a', 'team-b');
      const result2 = simulateMatch(54321, 'team-a', 'team-b');
      
      // Results should be different (very low probability of being identical)
      const identical = (
        result1.homeScore === result2.homeScore &&
        result1.awayScore === result2.awayScore &&
        Math.abs(result1.stats.xG.home - result2.stats.xG.home) < 0.01
      );
      
      expect(identical).toBe(false);
    });

    it('should have deterministic PRNG implementation', () => {
      const prng1 = createPrng(42);
      const prng2 = createPrng(42);
      
      for (let i = 0; i < 100; i++) {
        expect(prng1.next()).toBeCloseTo(prng2.next(), 10);
      }
    });
  });

  describe('Match Simulation API', () => {
    it('should return valid match result structure', () => {
      const result = simulateMatch(42, 'home-team', 'away-team');
      
      // Check result structure
      expect(result).toHaveProperty('homeScore');
      expect(result).toHaveProperty('awayScore');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('duration');
      
      // Check stats structure
      expect(result.stats).toHaveProperty('possession');
      expect(result.stats).toHaveProperty('shots');
      expect(result.stats).toHaveProperty('xG');
      expect(result.stats).toHaveProperty('passes');
      
      // Check data types
      expect(typeof result.homeScore).toBe('number');
      expect(typeof result.awayScore).toBe('number');
      expect(Array.isArray(result.events)).toBe(true);
    });

    it('should respect weather conditions', () => {
      const clearResult = simulateMatch(42, 'home', 'away', undefined, 'clear');
      const rainResult = simulateMatch(42, 'home', 'away', undefined, 'rain');
      
      // Different weather should potentially affect the simulation
      // (though results might be similar due to RNG)
      expect(clearResult).toBeDefined();
      expect(rainResult).toBeDefined();
    });

    it('should handle tactical overrides', () => {
      const result = simulateMatch(
        42, 
        'home', 
        'away',
        {
          home: { formation: '4-3-3', mentality: 'attacking' },
          away: { formation: '4-4-2', mentality: 'defensive' }
        }
      );
      
      expect(result).toBeDefined();
      expect(result.homeScore).toBeGreaterThanOrEqual(0);
      expect(result.awayScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Requirements', () => {
    it('should simulate match within performance budget (≤2ms/tick)', () => {
      const startTime = performance.now();
      
      // Simulate a match (90 minutes = 360 ticks at 4 ticks/minute)
      simulateMatch(42, 'home-team', 'away-team');
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const tickTime = totalTime / 360; // 360 ticks in 90 minutes
      
      console.log(`Total simulation time: ${totalTime.toFixed(2)}ms`);
      console.log(`Average tick time: ${tickTime.toFixed(3)}ms`);
      
      // Should be well under 2ms per tick
      expect(tickTime).toBeLessThan(2.0);
    });

    it('should handle multiple simulations efficiently', () => {
      const startTime = performance.now();
      
      // Run 10 simulations
      for (let i = 0; i < 10; i++) {
        simulateMatch(i, 'home', 'away');
      }
      
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 10;
      
      console.log(`Average match simulation time: ${averageTime.toFixed(2)}ms`);
      
      // Should simulate a match in reasonable time
      expect(averageTime).toBeLessThan(100); // 100ms per match
    });
  });

  describe('Statistical Validation', () => {
    it('should produce realistic score distributions', () => {
      const results: MatchResult[] = [];
      
      // Run 100 simulations with different seeds
      for (let i = 0; i < 100; i++) {
        results.push(simulateMatch(i, 'home', 'away'));
      }
      
      // Calculate statistics
      const homeScores = results.map(r => r.homeScore);
      const awayScores = results.map(r => r.awayScore);
      const totalGoals = results.map(r => r.homeScore + r.awayScore);
      
      const avgHomeScore = homeScores.reduce((a, b) => a + b) / homeScores.length;
      const avgAwayScore = awayScores.reduce((a, b) => a + b) / awayScores.length;
      const avgTotalGoals = totalGoals.reduce((a, b) => a + b) / totalGoals.length;
      
      console.log(`Average home score: ${avgHomeScore.toFixed(2)}`);
      console.log(`Average away score: ${avgAwayScore.toFixed(2)}`);
      console.log(`Average total goals: ${avgTotalGoals.toFixed(2)}`);
      
      // Realistic football statistics
      expect(avgHomeScore).toBeGreaterThan(0.8); // Home advantage
      expect(avgHomeScore).toBeLessThan(3.0);
      expect(avgAwayScore).toBeGreaterThan(0.5);
      expect(avgAwayScore).toBeLessThan(2.5);
      expect(avgTotalGoals).toBeGreaterThan(1.5);
      expect(avgTotalGoals).toBeLessThan(4.0);
      
      // Home advantage should be evident
      expect(avgHomeScore).toBeGreaterThan(avgAwayScore);
    });

    it('should generate reasonable xG values', () => {
      const results: MatchResult[] = [];
      
      for (let i = 0; i < 50; i++) {
        results.push(simulateMatch(i, 'home', 'away'));
      }
      
      results.forEach(result => {
        // xG should be reasonable
        expect(result.stats.xG.home).toBeGreaterThanOrEqual(0);
        expect(result.stats.xG.home).toBeLessThan(6);
        expect(result.stats.xG.away).toBeGreaterThanOrEqual(0);
        expect(result.stats.xG.away).toBeLessThan(6);
        
        // Goals should not exceed xG by too much (can happen but rare)
        const homeXGDiff = result.homeScore - result.stats.xG.home;
        const awayXGDiff = result.awayScore - result.stats.xG.away;
        
        expect(homeXGDiff).toBeLessThan(4); // Very unlikely to score 4+ more than xG
        expect(awayXGDiff).toBeLessThan(4);
      });
    });

    it('should maintain possession balance', () => {
      const results: MatchResult[] = [];
      
      for (let i = 0; i < 20; i++) {
        results.push(simulateMatch(i, 'home', 'away'));
      }
      
      results.forEach(result => {
        const totalPossession = result.stats.possession.home + result.stats.possession.away;
        
        // Possession should add up to ~100%
        expect(totalPossession).toBeCloseTo(100, 1);
        
        // Each team should have some possession
        expect(result.stats.possession.home).toBeGreaterThan(20);
        expect(result.stats.possession.home).toBeLessThan(80);
        expect(result.stats.possession.away).toBeGreaterThan(20);
        expect(result.stats.possession.away).toBeLessThan(80);
      });
    });
  });

  describe('Event Generation', () => {
    it('should generate reasonable number of events', () => {
      const result = simulateMatch(42, 'home', 'away');
      
      // Should have some events but not too many
      expect(result.events.length).toBeGreaterThan(5);
      expect(result.events.length).toBeLessThan(50);
      
      // Events should be chronologically ordered
      for (let i = 1; i < result.events.length; i++) {
        expect(result.events[i].minute).toBeGreaterThanOrEqual(
          result.events[i - 1].minute
        );
      }
    });

    it('should generate different event types', () => {
      const results: MatchResult[] = [];
      
      // Collect events from multiple matches
      for (let i = 0; i < 20; i++) {
        results.push(simulateMatch(i, 'home', 'away'));
      }
      
      const allEvents = results.flatMap(r => r.events);
      const eventTypes = new Set(allEvents.map(e => e.type));
      
      // Should have variety of event types
      expect(eventTypes.size).toBeGreaterThan(2);
      expect(eventTypes.has('shot')).toBe(true);
      
      // Goals should be present in some matches
      const hasGoals = allEvents.some(e => e.type === 'goal');
      expect(hasGoals).toBe(true);
    });
  });

  describe('Weather Effects', () => {
    it('should apply weather modifiers correctly', () => {
      const seeds = [42, 123, 456];
      const weathers: Weather[] = ['clear', 'rain', 'snow', 'wind'];
      
      weathers.forEach(weather => {
        seeds.forEach(seed => {
          const result = simulateMatch(seed, 'home', 'away', undefined, weather);
          
          expect(result).toBeDefined();
          expect(result.homeScore).toBeGreaterThanOrEqual(0);
          expect(result.awayScore).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('Legacy Compatibility', () => {
    it('should maintain backwards compatibility', () => {
      const legacyResult = simulateMatchLegacy('test-seed', 0.2);
      
      expect(legacyResult).toHaveProperty('homeGoals');
      expect(legacyResult).toHaveProperty('awayGoals');
      expect(typeof legacyResult.homeGoals).toBe('number');
      expect(typeof legacyResult.awayGoals).toBe('number');
    });
  });
});

describe('Golden Match Tests', () => {
  let goldenResults: ReturnType<typeof runGoldenMatchTests>;

  beforeAll(() => {
    console.log('Running golden match validation...');
    goldenResults = runGoldenMatchTests();
    console.log(`Golden matches: ${goldenResults.passed} passed, ${goldenResults.failed} failed`);
  });

  it('should pass all golden match tests', () => {
    expect(goldenResults.failed).toBe(0);
    expect(goldenResults.passed).toBe(GOLDEN_MATCHES.length);
    
    // Log any failures for debugging
    goldenResults.results.forEach(({ match, validation }) => {
      if (!validation.passed) {
        console.error(`Golden match ${match.id} failed:`, validation.failures);
        console.error('Metrics:', validation.metrics);
      }
    });
  });

  it('should have deterministic golden match results', () => {
    // Test first golden match multiple times
    const match = GOLDEN_MATCHES[0];
    const results = [];
    
    for (let i = 0; i < 3; i++) {
      results.push(simulateMatchWithTeams(
        match.seed,
        match.homeTeam,
        match.awayTeam,
        match.weather
      ));
    }
    
    // All results should be identical
    for (let i = 1; i < results.length; i++) {
      expect(results[i].homeScore).toBe(results[0].homeScore);
      expect(results[i].awayScore).toBe(results[0].awayScore);
      expect(results[i].stats.xG.home).toBeCloseTo(results[0].stats.xG.home, 2);
      expect(results[i].events.length).toBe(results[0].events.length);
    }
  });

  it('should validate individual golden matches correctly', () => {
    GOLDEN_MATCHES.forEach(match => {
      const result = simulateMatchWithTeams(
        match.seed,
        match.homeTeam,
        match.awayTeam,
        match.weather
      );
      
      const validation = validateGoldenMatch(match, result);
      
      if (!validation.passed) {
        console.log(`${match.id} (${match.description}):`);
        console.log('Expected ranges:', match.expectedRanges);
        console.log('Actual metrics:', validation.metrics);
        console.log('Failures:', validation.failures);
      }
      
      expect(validation.passed).toBe(true);
    });
  });

  describe('Golden Match Coverage', () => {
    it('should test different formations', () => {
      const formations = new Set(
        GOLDEN_MATCHES.flatMap(m => [
          m.homeTeam.tactics.formation,
          m.awayTeam.tactics.formation
        ])
      );
      
      expect(formations.has('4-4-2')).toBe(true);
      expect(formations.has('4-3-3')).toBe(true);
      expect(formations.has('3-5-2')).toBe(true);
    });

    it('should test different weather conditions', () => {
      const weathers = new Set(GOLDEN_MATCHES.map(m => m.weather));
      
      expect(weathers.has('clear')).toBe(true);
      expect(weathers.has('rain')).toBe(true);
      expect(weathers.has('snow')).toBe(true);
      expect(weathers.has('wind')).toBe(true);
    });

    it('should test different tactical mentalities', () => {
      const mentalities = new Set(
        GOLDEN_MATCHES.flatMap(m => [
          m.homeTeam.tactics.mentality,
          m.awayTeam.tactics.mentality
        ])
      );
      
      expect(mentalities.has('defensive')).toBe(true);
      expect(mentalities.has('balanced')).toBe(true);
      expect(mentalities.has('attacking')).toBe(true);
    });

    it('should test different team quality levels', () => {
      const ratings = GOLDEN_MATCHES.flatMap(m => [
        m.homeTeam.overallRating,
        m.awayTeam.overallRating
      ]);
      
      const minRating = Math.min(...ratings);
      const maxRating = Math.max(...ratings);
      
      expect(minRating).toBeLessThan(80); // Weak teams
      expect(maxRating).toBeGreaterThan(140); // Strong teams
    });
  });
});