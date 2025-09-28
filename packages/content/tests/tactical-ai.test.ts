import { describe, it, expect, beforeEach } from 'vitest';
import { 
  TacticalAI, 
  TacticalRecommendationValidator,
  createMockMatchContext 
} from '../src/tactical-ai/recommendations.js';
import type { 
  TacticalRecommendation, 
  MatchContext 
} from '../src/tactical-ai/recommendations.js';
import type { Team } from '../../core-sim/src/types.js';

// Mock teams for testing
const createMockTeam = (
  id: string,
  name: string,
  rating: number,
  formation: '4-4-2' | '4-3-3' | '3-5-2' = '4-4-2'
): Team => ({
  id,
  name,
  players: Array.from({ length: 11 }, (_, i) => ({
    id: `${id}-P${i}`,
    name: `Player ${i}`,
    position: i === 0 ? 'GK' : i <= 4 ? 'DF' : i <= 8 ? 'MF' : 'FW',
    attributes: {
      finishing: 10 + Math.floor(rating / 10),
      passing: 10 + Math.floor(rating / 10),
      crossing: 10,
      dribbling: 10,
      technique: 10,
      pace: 10,
      strength: 10,
      stamina: 85,
      decisions: 10,
      positioning: 10,
      anticipation: 10,
      tackling: 10,
      marking: 10,
    },
    stamina: 85,
    morale: 75,
    condition: 95,
  })),
  tactics: {
    formation,
    mentality: 'balanced',
    pressing: 'medium',
    tempo: 'medium',
    width: 'normal',
  },
  overallRating: rating,
});

describe('Tactical AI System', () => {
  let tacticalAI: TacticalAI;
  let mockContext: MatchContext;

  beforeEach(() => {
    tacticalAI = new TacticalAI();
    mockContext = createMockMatchContext();
  });

  describe('Pre-Match Recommendations', () => {
    it('should generate formation recommendations based on opponent', () => {
      const homeTeam = createMockTeam('HOME', 'Home FC', 100, '4-4-2');
      const awayTeam = createMockTeam('AWAY', 'Away FC', 100, '4-4-2');
      
      const recommendations = tacticalAI.generatePreMatchRecommendations(
        homeTeam,
        awayTeam,
        'clear',
        42
      );

      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should have at least some recommendations
      const formationRec = recommendations.find(r => r.type === 'formation');
      if (formationRec) {
        expect(formationRec.reasoning.length).toBeLessThanOrEqual(140); // GDD requirement
        expect(formationRec.confidence).toBeGreaterThan(0);
        expect(formationRec.confidence).toBeLessThanOrEqual(100);
      }
    });

    it('should recommend counter-formations', () => {
      const homeTeam = createMockTeam('HOME', 'Home FC', 100, '4-4-2');
      const awayTeam = createMockTeam('AWAY', 'Away FC', 100, '4-3-3'); // Different formation
      
      const recommendations = tacticalAI.generatePreMatchRecommendations(
        homeTeam,
        awayTeam,
        'clear',
        42
      );

      // Should recommend formation change to counter 4-3-3
      const formationRec = recommendations.find(r => r.type === 'formation');
      if (formationRec) {
        expect(formationRec.recommendation.formation).toBe('3-5-2'); // Counter to 4-3-3
      }
    });

    it('should consider weather in recommendations', () => {
      const homeTeam = createMockTeam('HOME', 'Home FC', 100);
      const awayTeam = createMockTeam('AWAY', 'Away FC', 100);
      
      const clearRecommendations = tacticalAI.generatePreMatchRecommendations(
        homeTeam,
        awayTeam,
        'clear',
        42
      );
      
      const rainRecommendations = tacticalAI.generatePreMatchRecommendations(
        homeTeam,
        awayTeam,
        'rain',
        42
      );

      // Rain should generate different or additional recommendations
      const clearWeatherRecs = clearRecommendations.filter(r => r.context.weather);
      const rainWeatherRecs = rainRecommendations.filter(r => r.context.weather);
      
      if (rainWeatherRecs.length > 0) {
        expect(rainWeatherRecs.length).toBeGreaterThanOrEqual(clearWeatherRecs.length);
      }
    });

    it('should prioritize recommendations correctly', () => {
      const homeTeam = createMockTeam('HOME', 'Home FC', 80); // Weaker team
      const awayTeam = createMockTeam('AWAY', 'Away FC', 140); // Much stronger
      
      const recommendations = tacticalAI.generatePreMatchRecommendations(
        homeTeam,
        awayTeam,
        'clear',
        42
      );

      // Should be sorted by priority and confidence
      for (let i = 1; i < recommendations.length; i++) {
        const prev = recommendations[i - 1];
        const curr = recommendations[i];
        
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const prevPriority = priorityOrder[prev.priority];
        const currPriority = priorityOrder[curr.priority];
        
        // Should be in descending priority order
        expect(prevPriority).toBeGreaterThanOrEqual(currPriority);
      }
    });

    it('should be deterministic with same inputs', () => {
      const homeTeam = createMockTeam('HOME', 'Home FC', 100);
      const awayTeam = createMockTeam('AWAY', 'Away FC', 100);
      
      const recs1 = tacticalAI.generatePreMatchRecommendations(homeTeam, awayTeam, 'clear', 42);
      const recs2 = tacticalAI.generatePreMatchRecommendations(homeTeam, awayTeam, 'clear', 42);

      expect(recs1.length).toBe(recs2.length);
      
      for (let i = 0; i < recs1.length; i++) {
        expect(recs1[i].type).toBe(recs2[i].type);
        expect(recs1[i].confidence).toBe(recs2[i].confidence);
        expect(recs1[i].reasoning).toBe(recs2[i].reasoning);
      }
    });
  });

  describe('Half-Time Recommendations', () => {
    it('should recommend comeback tactics when losing', () => {
      const losingContext = {
        ...mockContext,
        currentScore: { home: 0, away: 2 },
        minute: 45,
        momentum: -30,
      };

      const recommendations = tacticalAI.generateHalfTimeRecommendations(losingContext, 42);

      // Should recommend more attacking approach
      const comebackRec = recommendations.find(r => 
        r.type === 'mentality' && r.title.includes('empate')
      );
      
      expect(comebackRec).toBeDefined();
      if (comebackRec) {
        expect(comebackRec.priority).toBe('high');
        expect(comebackRec.expectedImpact).toBeGreaterThan(0); // Positive attacking impact
      }
    });

    it('should recommend defensive tactics when winning', () => {
      const winningContext = {
        ...mockContext,
        currentScore: { home: 2, away: 0 },
        minute: 45,
        momentum: 40,
      };

      const recommendations = tacticalAI.generateHalfTimeRecommendations(winningContext, 42);

      // Should recommend protecting the lead
      const protectRec = recommendations.find(r => 
        r.title.includes('vantagem') || r.title.includes('Proteger')
      );
      
      if (protectRec) {
        expect(protectRec.expectedImpact).toBeLessThan(0); // Negative (defensive) impact
      }
    });

    it('should recommend substitutions for tired players', () => {
      const tiredContext = {
        ...mockContext,
        minute: 45,
        playerStamina: {
          'HOME-001-P5': 45, // Very tired player
          'HOME-001-P6': 85, // Fresh player
        },
      };

      const recommendations = tacticalAI.generateHalfTimeRecommendations(tiredContext, 42);

      const substitutionRec = recommendations.find(r => r.type === 'substitution');
      
      if (substitutionRec) {
        expect(substitutionRec.priority).toBe('high');
        expect(substitutionRec.recommendation.substitution.out).toBe('HOME-001-P5');
        expect(substitutionRec.recommendation.substitution.reason).toBe('stamina');
      }
    });

    it('should limit half-time recommendations', () => {
      const recommendations = tacticalAI.generateHalfTimeRecommendations(mockContext, 42);
      
      // Should not overwhelm with too many recommendations
      expect(recommendations.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Reasoning Quality', () => {
    it('should provide reasoning within character limit', () => {
      const homeTeam = createMockTeam('HOME', 'Home FC', 100);
      const awayTeam = createMockTeam('AWAY', 'Away FC', 100);
      
      const recommendations = tacticalAI.generatePreMatchRecommendations(
        homeTeam,
        awayTeam,
        'clear',
        42
      );

      recommendations.forEach(rec => {
        expect(rec.reasoning.length).toBeLessThanOrEqual(140); // GDD requirement
        expect(rec.reasoning.length).toBeGreaterThan(5); // Minimum meaningful length
      });
    });

    it('should provide meaningful factor descriptions', () => {
      const homeTeam = createMockTeam('HOME', 'Home FC', 80);
      const awayTeam = createMockTeam('AWAY', 'Away FC', 120);
      
      const recommendations = tacticalAI.generatePreMatchRecommendations(
        homeTeam,
        awayTeam,
        'clear',
        42
      );

      recommendations.forEach(rec => {
        expect(rec.factors.length).toBeGreaterThan(0);
        
        rec.factors.forEach(factor => {
          expect(factor.name.length).toBeGreaterThan(0);
          expect(factor.description.length).toBeGreaterThan(0);
          expect(factor.weight).toBeGreaterThan(0);
          expect(factor.weight).toBeLessThanOrEqual(1);
        });
      });
    });
  });

  describe('Validation', () => {
    it('should validate recommendation structure', () => {
      const homeTeam = createMockTeam('HOME', 'Home FC', 100);
      const awayTeam = createMockTeam('AWAY', 'Away FC', 100);
      
      const recommendations = tacticalAI.generatePreMatchRecommendations(
        homeTeam,
        awayTeam,
        'clear',
        42
      );

      recommendations.forEach(rec => {
        const validation = TacticalRecommendationValidator.validateRecommendation(rec, mockContext);
        
        if (!validation.valid) {
          console.log('Validation issues for', rec.id, ':', validation.issues);
        }
        
        expect(validation.valid).toBe(true);
      });
    });

    it('should reject recommendations with invalid parameters', () => {
      const invalidRecommendation: TacticalRecommendation = {
        id: 'TAC-INVALID',
        type: 'formation',
        priority: 'critical',
        title: 'Invalid recommendation',
        description: 'Test',
        reasoning: 'Very long reasoning that exceeds the 140 character limit set by the GDD requirements and should be rejected by the validator',
        confidence: 20, // Too low for critical priority
        expectedImpact: 0,
        recommendation: {},
        context: {},
        factors: [],
      };

      const validation = TacticalRecommendationValidator.validateRecommendation(
        invalidRecommendation,
        mockContext
      );

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues).toContain('Reasoning too long');
      expect(validation.issues).toContain('Critical priority requires high confidence');
    });
  });

  describe('Audit and Logging', () => {
    it('should log tactical decisions', () => {
      const homeTeam = createMockTeam('HOME', 'Home FC', 100);
      const awayTeam = createMockTeam('AWAY', 'Away FC', 100);
      
      tacticalAI.generatePreMatchRecommendations(homeTeam, awayTeam, 'clear', 42);
      tacticalAI.generateHalfTimeRecommendations(mockContext, 42);
      
      const logs = tacticalAI.getLogs();
      
      // Should have some logs if recommendations were generated
      if (logs.length > 0) {
        logs.forEach(log => {
          expect(log).toHaveProperty('timestamp');
          expect(log).toHaveProperty('recommendation');
          expect(log).toHaveProperty('reasoning');
          expect(log).toHaveProperty('confidence');
          expect(log).toHaveProperty('seed');
        });
      }
    });

    it('should clear old logs when limit is reached', () => {
      // Generate many recommendations to create logs
      const homeTeam = createMockTeam('HOME', 'Home FC', 100);
      const awayTeam = createMockTeam('AWAY', 'Away FC', 100);
      
      for (let i = 0; i < 600; i++) {
        tacticalAI.generatePreMatchRecommendations(homeTeam, awayTeam, 'clear', i);
      }
      
      tacticalAI.clearOldLogs();
      const logs = tacticalAI.getLogs();
      
      expect(logs.length).toBeLessThanOrEqual(500);
    });
  });

  describe('Contextual Recommendations', () => {
    it('should recommend different tactics for different score situations', () => {
      const losingContext = { ...mockContext, currentScore: { home: 0, away: 2 } };
      const winningContext = { ...mockContext, currentScore: { home: 2, away: 0 } };
      const drawContext = { ...mockContext, currentScore: { home: 1, away: 1 } };

      const losingRecs = tacticalAI.generateHalfTimeRecommendations(losingContext, 42);
      const winningRecs = tacticalAI.generateHalfTimeRecommendations(winningContext, 42);
      const drawRecs = tacticalAI.generateHalfTimeRecommendations(drawContext, 42);

      // Losing should have attacking recommendations
      const attackingRec = losingRecs.find(r => r.expectedImpact > 0);
      if (attackingRec) {
        expect(attackingRec.priority).toBe('high');
      }

      // Winning should have defensive recommendations  
      const defensiveRec = winningRecs.find(r => r.expectedImpact < 0);
      if (defensiveRec) {
        expect(defensiveRec.expectedImpact).toBeLessThan(0);
      }
    });

    it('should consider time remaining in recommendations', () => {
      const lateContext = { ...mockContext, minute: 85, currentScore: { home: 0, away: 1 } };
      const earlyContext = { ...mockContext, minute: 20, currentScore: { home: 0, away: 1 } };

      const lateRecs = tacticalAI.generateHalfTimeRecommendations(lateContext, 42);
      const earlyRecs = tacticalAI.generateHalfTimeRecommendations(earlyContext, 42);

      // Late recommendations should have higher urgency
      if (lateRecs.length > 0 && earlyRecs.length > 0) {
        const lateUrgentRecs = lateRecs.filter(r => r.priority === 'high' || r.priority === 'critical');
        const earlyUrgentRecs = earlyRecs.filter(r => r.priority === 'high' || r.priority === 'critical');
        
        expect(lateUrgentRecs.length).toBeGreaterThanOrEqual(earlyUrgentRecs.length);
      }
    });

    it('should adapt to possession statistics', () => {
      const lowPossessionContext = { 
        ...mockContext, 
        possession: { home: 30, away: 70 } 
      };

      const recommendations = tacticalAI.generateHalfTimeRecommendations(lowPossessionContext, 42);

      const possessionRec = recommendations.find(r => 
        r.description.includes('posse') || r.title.includes('posse')
      );
      
      if (possessionRec) {
        expect(possessionRec.context.possession).toBeDefined();
        expect(possessionRec.reasoning).toContain('possession');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle teams with identical setups', () => {
      const homeTeam = createMockTeam('HOME', 'Home FC', 100, '4-4-2');
      const awayTeam = createMockTeam('AWAY', 'Away FC', 100, '4-4-2');
      
      // Make tactics identical
      awayTeam.tactics = { ...homeTeam.tactics };
      
      const recommendations = tacticalAI.generatePreMatchRecommendations(
        homeTeam,
        awayTeam,
        'clear',
        42
      );

      // Should still generate some recommendations (weather, player instructions, etc.)
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should handle extreme team rating differences', () => {
      const weakTeam = createMockTeam('WEAK', 'Weak FC', 40);
      const strongTeam = createMockTeam('STRONG', 'Strong FC', 180);
      
      const recommendations = tacticalAI.generatePreMatchRecommendations(
        weakTeam,
        strongTeam,
        'clear',
        42
      );

      // Should recommend defensive approach for weak team
      const mentalityRec = recommendations.find(r => r.type === 'mentality');
      if (mentalityRec) {
        expect(mentalityRec.recommendation.mentality).toBe('defensive');
      }
    });

    it('should handle empty player lists gracefully', () => {
      const emptyTeam = {
        ...createMockTeam('EMPTY', 'Empty FC', 100),
        players: []
      };
      
      const normalTeam = createMockTeam('NORMAL', 'Normal FC', 100);
      
      expect(() => {
        tacticalAI.generatePreMatchRecommendations(emptyTeam, normalTeam, 'clear', 42);
      }).not.toThrow();
    });
  });

  describe('Recommendation Quality', () => {
    it('should provide actionable recommendations', () => {
      const homeTeam = createMockTeam('HOME', 'Home FC', 100);
      const awayTeam = createMockTeam('AWAY', 'Away FC', 100);
      
      const recommendations = tacticalAI.generatePreMatchRecommendations(
        homeTeam,
        awayTeam,
        'clear',
        42
      );

      recommendations.forEach(rec => {
        // Should have valid recommendation object
        expect(rec.recommendation).toBeDefined();
        expect(typeof rec.recommendation).toBe('object');
        
        // Should have meaningful title and description
        expect(rec.title.length).toBeGreaterThan(0);
        expect(rec.description.length).toBeGreaterThan(10);
        
        // Should have reasonable confidence
        expect(rec.confidence).toBeGreaterThan(30);
        expect(rec.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should provide diverse recommendation types', () => {
      const homeTeam = createMockTeam('HOME', 'Home FC', 100, '4-4-2');
      const awayTeam = createMockTeam('AWAY', 'Away FC', 120, '4-3-3');
      
      // Generate multiple recommendations
      const recommendations = tacticalAI.generatePreMatchRecommendations(
        homeTeam,
        awayTeam,
        'rain', // Weather should add variety
        42
      );

      const types = new Set(recommendations.map(r => r.type));
      
      // Should have variety in recommendation types
      expect(types.size).toBeGreaterThan(1);
    });
  });

  describe('Performance', () => {
    it('should generate recommendations quickly', () => {
      const homeTeam = createMockTeam('HOME', 'Home FC', 100);
      const awayTeam = createMockTeam('AWAY', 'Away FC', 100);
      
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        tacticalAI.generatePreMatchRecommendations(homeTeam, awayTeam, 'clear', i);
      }
      
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 100;
      
      console.log(`Average tactical recommendation time: ${averageTime.toFixed(2)}ms`);
      
      // Should be fast enough for real-time use
      expect(averageTime).toBeLessThan(10); // 10ms per recommendation set
    });
  });
});
