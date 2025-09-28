import { describe, it, expect, beforeEach } from 'vitest';
import { ScoutingAI } from '../src/scouting/recommendations.js';
import type { 
  ScoutingCriteria, 
  ScoutingContext, 
  ScoutingRecommendation 
} from '../src/scouting/recommendations.js';
import type { Player } from '../src/schema.js';

// Mock players for testing
const mockPlayers: Player[] = [
  {
    id: 'PLY-001',
    clubId: 'CLB-0002', // Different club
    name: 'Test Striker',
    age: 22,
    nationality: 'ALX',
    position: 'ST',
    foot: 'R',
    attributes: {
      finishing: 16,
      firstTouch: 14,
      dribbling: 13,
      technique: 12,
      crossing: 8,
      passing: 10,
      heading: 12,
      tackling: 6,
      pace: 15,
      acceleration: 14,
      agility: 13,
      balance: 12,
      strength: 11,
      stamina: 14,
      jumpingReach: 10,
      decisions: 13,
      anticipation: 12,
      positioning: 15,
      offTheBall: 16,
      vision: 11,
      workRate: 14,
      bravery: 12,
      composure: 13,
      determination: 14
    },
    ca: 125,
    pa: 160,
    morale: 75,
    condition: 95,
    contract: {
      wage: 8500,
      expires: '2025-06-30', // Expiring soon
    }
  },
  {
    id: 'PLY-002',
    clubId: 'CLB-0003',
    name: 'Test Midfielder',
    age: 28,
    nationality: 'LUX',
    position: 'MC',
    foot: 'Both',
    attributes: {
      finishing: 10,
      firstTouch: 15,
      dribbling: 14,
      technique: 16,
      crossing: 12,
      passing: 18,
      heading: 11,
      tackling: 13,
      pace: 12,
      acceleration: 12,
      agility: 14,
      balance: 15,
      strength: 13,
      stamina: 16,
      jumpingReach: 10,
      decisions: 17,
      anticipation: 15,
      positioning: 16,
      offTheBall: 12,
      vision: 17,
      workRate: 16,
      bravery: 13,
      composure: 15,
      determination: 16
    },
    ca: 140,
    pa: 150,
    morale: 80,
    condition: 92,
    contract: {
      wage: 12000,
      expires: '2027-06-30', // Long contract
    }
  },
  {
    id: 'PLY-003',
    clubId: 'CLB-0004',
    name: 'Test Defender',
    age: 32,
    nationality: 'IBE',
    position: 'DC',
    foot: 'L',
    attributes: {
      finishing: 5,
      firstTouch: 11,
      dribbling: 8,
      technique: 10,
      crossing: 7,
      passing: 13,
      heading: 16,
      tackling: 18,
      pace: 10,
      acceleration: 9,
      agility: 10,
      balance: 12,
      strength: 17,
      stamina: 12,
      jumpingReach: 16,
      decisions: 16,
      anticipation: 17,
      positioning: 18,
      offTheBall: 8,
      vision: 12,
      workRate: 15,
      bravery: 18,
      composure: 15,
      determination: 17
    },
    ca: 130,
    pa: 135, // Limited growth potential
    morale: 70,
    condition: 88,
    contract: {
      wage: 9500,
      expires: '2025-01-31', // Expiring very soon
    }
  }
];

describe('Scouting AI System', () => {
  let scoutingAI: ScoutingAI;
  let mockContext: ScoutingContext;
  let mockCriteria: ScoutingCriteria;

  beforeEach(() => {
    scoutingAI = new ScoutingAI();
    
    mockContext = {
      clubId: 'CLB-0001',
      budget: 15000000,
      currentSquad: [], // Empty squad for testing
      leaguePosition: 8,
      seasonPhase: 'mid',
      transferWindow: true,
      managerPreferences: {
        preferredFormation: '4-4-2',
        playingStyle: 'balanced',
        agePolicy: 'mixed',
        budgetPolicy: 'moderate',
      },
    };

    mockCriteria = {
      position: ['ST', 'MC'],
      maxAge: 30,
      minAge: 18,
      maxValue: 20000000,
      minPotential: 140,
      priority: 'immediate',
    };
  });

  describe('Player Recommendations', () => {
    it('should generate recommendations based on criteria', () => {
      const recommendations = scoutingAI.generateRecommendations(
        mockPlayers,
        mockCriteria,
        mockContext,
        42,
        10
      );

      expect(recommendations.length).toBeGreaterThan(0);
      
      recommendations.forEach(rec => {
        expect(rec.score).toBeGreaterThan(30); // Minimum threshold
        expect(rec.confidence).toBeGreaterThanOrEqual(10);
        expect(rec.confidence).toBeLessThanOrEqual(95);
        expect(rec.reasoning.length).toBeGreaterThan(0);
        expect(rec.factors.length).toBeGreaterThan(0);
      });
    });

    it('should filter players correctly', () => {
      const strictCriteria: ScoutingCriteria = {
        position: ['GK'], // No goalkeepers in mock data
        maxAge: 25,
        priority: 'immediate',
      };

      const recommendations = scoutingAI.generateRecommendations(
        mockPlayers,
        strictCriteria,
        mockContext,
        42,
        10
      );

      expect(recommendations.length).toBe(0);
    });

    it('should prioritize young players with high potential', () => {
      const youthCriteria: ScoutingCriteria = {
        position: ['ST'],
        maxAge: 25,
        minPotential: 150,
        priority: 'future',
      };

      const recommendations = scoutingAI.generateRecommendations(
        mockPlayers,
        youthCriteria,
        mockContext,
        42,
        10
      );

      const youngStriker = recommendations.find(r => r.playerId === 'PLY-001');
      expect(youngStriker).toBeDefined();
      expect(youngStriker?.score).toBeGreaterThan(60); // Should score well for potential
    });

    it('should consider budget constraints', () => {
      const lowBudgetContext = { ...mockContext, budget: 1000000 }; // Very low budget
      
      const recommendations = scoutingAI.generateRecommendations(
        mockPlayers,
        mockCriteria,
        lowBudgetContext,
        42,
        10
      );

      // Should still generate recommendations but with lower value scores
      recommendations.forEach(rec => {
        const valueFactor = rec.factors.find(f => f.name === 'value');
        expect(valueFactor).toBeDefined();
      });
    });

    it('should be deterministic with same seed', () => {
      const recs1 = scoutingAI.generateRecommendations(mockPlayers, mockCriteria, mockContext, 42, 10);
      const recs2 = scoutingAI.generateRecommendations(mockPlayers, mockCriteria, mockContext, 42, 10);

      expect(recs1.length).toBe(recs2.length);
      if (recs1.length > 0) {
        expect(recs1[0].score).toBe(recs2[0].score);
        expect(recs1[0].confidence).toBe(recs2[0].confidence);
      }
    });
  });

  describe('Scouting Reports', () => {
    it('should generate detailed markdown reports', () => {
      const player = mockPlayers[0];
      const report = scoutingAI.generateScoutingReport(
        player,
        'SCT-001',
        mockContext,
        42
      );

      expect(report.content).toContain('# Relatório de Scouting');
      expect(report.content).toContain(player.name);
      expect(report.content).toContain('## Informações Básicas');
      expect(report.content).toContain('## Avaliação Geral');
      expect(report.content).toContain('## Pontos Fortes');
      expect(report.content).toContain('## Recomendação');
      
      expect(report.rating).toBeGreaterThanOrEqual(1);
      expect(report.rating).toBeLessThanOrEqual(100);
      expect(report.uncertainty).toBeGreaterThanOrEqual(3);
      expect(report.uncertainty).toBeLessThanOrEqual(15);
    });

    it('should assess attributes with confidence levels', () => {
      const player = mockPlayers[0];
      const report = scoutingAI.generateScoutingReport(
        player,
        'SCT-001',
        mockContext,
        42
      );

      Object.values(report.attributes).forEach(attr => {
        expect(attr.value).toBeGreaterThanOrEqual(1);
        expect(attr.value).toBeLessThanOrEqual(20);
        expect(attr.confidence).toBeGreaterThanOrEqual(60);
        expect(attr.confidence).toBeLessThanOrEqual(95);
      });
    });

    it('should generate appropriate tags', () => {
      const player = mockPlayers[0]; // Young striker
      const report = scoutingAI.generateScoutingReport(
        player,
        'SCT-001',
        mockContext,
        42
      );

      expect(report.tags).toContain('ST');
      expect(report.tags).toContain('ALX');
      expect(report.tags).toContain('youth'); // Age 22
    });

    it('should provide different recommendations based on rating', () => {
      const reports = mockPlayers.map(player => 
        scoutingAI.generateScoutingReport(player, 'SCT-001', mockContext, 42)
      );

      const recommendations = reports.map(r => r.recommendation);
      const uniqueRecommendations = new Set(recommendations);
      
      // Should have variety in recommendations
      expect(uniqueRecommendations.size).toBeGreaterThan(1);
    });
  });

  describe('Multi-Factor Analysis', () => {
    it('should weight factors correctly for different priorities', () => {
      const futureCriteria: ScoutingCriteria = {
        position: ['ST'],
        priority: 'future',
      };

      const immediateCriteria: ScoutingCriteria = {
        position: ['ST'],
        priority: 'immediate',
      };

      const futureRecs = scoutingAI.generateRecommendations(mockPlayers, futureCriteria, mockContext, 42);
      const immediateRecs = scoutingAI.generateRecommendations(mockPlayers, immediateCriteria, mockContext, 42);

      // Young high-potential player should score better for future
      const youngPlayer = futureRecs.find(r => r.playerId === 'PLY-001');
      const youngPlayerImmediate = immediateRecs.find(r => r.playerId === 'PLY-001');

      if (youngPlayer && youngPlayerImmediate) {
        const futurePotentialWeight = youngPlayer.factors.find(f => f.name === 'potential')?.weight || 0;
        const immediatePotentialWeight = youngPlayerImmediate.factors.find(f => f.name === 'potential')?.weight || 0;
        
        expect(futurePotentialWeight).toBeGreaterThan(immediatePotentialWeight);
      }
    });

    it('should consider squad fit in recommendations', () => {
      // Create context with many strikers already
      const squadWithStrikers = Array.from({ length: 4 }, (_, i) => ({
        ...mockPlayers[0],
        id: `PLY-SQUAD-${i}`,
        clubId: mockContext.clubId,
        position: 'ST'
      }));

      const contextWithStrikers = {
        ...mockContext,
        currentSquad: squadWithStrikers as Player[],
      };

      const recommendations = scoutingAI.generateRecommendations(
        mockPlayers,
        { position: ['ST'], priority: 'immediate' },
        contextWithStrikers,
        42
      );

      // Should have lower squad fit scores due to position saturation
      recommendations.forEach(rec => {
        const squadFitFactor = rec.factors.find(f => f.name === 'squad_fit');
        if (squadFitFactor) {
          expect(squadFitFactor.value).toBeLessThan(70); // Lower fit due to position saturation
        }
      });
    });
  });

  describe('Audit and Logging', () => {
    it('should log scouting decisions', () => {
      scoutingAI.generateRecommendations(mockPlayers, mockCriteria, mockContext, 42);
      
      const logs = scoutingAI.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      
      logs.forEach(log => {
        expect(log).toHaveProperty('timestamp');
        expect(log).toHaveProperty('action');
        expect(log).toHaveProperty('playerId');
        expect(log).toHaveProperty('reasoning');
        expect(log).toHaveProperty('score');
        expect(log).toHaveProperty('seed');
      });
    });

    it('should provide explainable recommendations', () => {
      const recommendations = scoutingAI.generateRecommendations(
        mockPlayers,
        mockCriteria,
        mockContext,
        42
      );

      recommendations.forEach(rec => {
        expect(rec.reasoning.length).toBeGreaterThan(5);
        expect(rec.reasoning.length).toBeLessThan(200);
        expect(rec.factors.length).toBeGreaterThan(0);
        
        // Each factor should have meaningful description
        rec.factors.forEach(factor => {
          expect(factor.description.length).toBeGreaterThan(0);
          expect(factor.weight).toBeGreaterThan(0);
          expect(factor.weight).toBeLessThanOrEqual(1);
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty player list', () => {
      const recommendations = scoutingAI.generateRecommendations(
        [],
        mockCriteria,
        mockContext,
        42
      );

      expect(recommendations).toEqual([]);
    });

    it('should handle players from same club', () => {
      const sameClubPlayers = mockPlayers.map(p => ({
        ...p,
        clubId: mockContext.clubId // Same club as context
      }));

      const recommendations = scoutingAI.generateRecommendations(
        sameClubPlayers as Player[],
        mockCriteria,
        mockContext,
        42
      );

      expect(recommendations).toEqual([]); // Should filter out same club players
    });

    it('should handle extreme budget constraints', () => {
      const poorContext = { ...mockContext, budget: 100000 }; // Very low budget
      
      const recommendations = scoutingAI.generateRecommendations(
        mockPlayers,
        mockCriteria,
        poorContext,
        42
      );

      // Should still generate recommendations but with realistic value assessments
      recommendations.forEach(rec => {
        const valueFactor = rec.factors.find(f => f.name === 'value');
        expect(valueFactor).toBeDefined();
        // Value scores should be very low due to budget constraints
      });
    });
  });

  describe('Contract Analysis', () => {
    it('should prioritize players with expiring contracts', () => {
      const recommendations = scoutingAI.generateRecommendations(
        mockPlayers,
        mockCriteria,
        mockContext,
        42
      );

      const expiringContractPlayer = recommendations.find(r => r.playerId === 'PLY-001');
      const longContractPlayer = recommendations.find(r => r.playerId === 'PLY-002');

      if (expiringContractPlayer && longContractPlayer) {
        const expiringContractScore = expiringContractPlayer.factors.find(f => f.name === 'contract')?.value || 0;
        const longContractScore = longContractPlayer.factors.find(f => f.name === 'contract')?.value || 0;
        
        expect(expiringContractScore).toBeGreaterThan(longContractScore);
      }
    });

    it('should assess transfer urgency correctly', () => {
      const recommendations = scoutingAI.generateRecommendations(
        mockPlayers,
        { ...mockCriteria, priority: 'immediate' },
        mockContext,
        42
      );

      recommendations.forEach(rec => {
        expect(['low', 'medium', 'high']).toContain(rec.urgency);
        expect(['low', 'medium', 'high']).toContain(rec.risk);
      });
    });
  });

  describe('Report Generation', () => {
    it('should generate markdown reports with proper structure', () => {
      const player = mockPlayers[0];
      const report = scoutingAI.generateScoutingReport(player, 'SCT-001', mockContext, 42);

      // Check markdown structure
      expect(report.content).toMatch(/^# Relatório de Scouting:/);
      expect(report.content).toContain('## Informações Básicas');
      expect(report.content).toContain('## Avaliação Geral');
      expect(report.content).toContain('## Pontos Fortes');
      expect(report.content).toContain('## Áreas de Melhoria');
      expect(report.content).toContain('## Recomendação');
      
      // Check content quality
      expect(report.summary.length).toBeGreaterThan(10);
      expect(report.summary.length).toBeLessThan(200);
    });

    it('should be deterministic with same seed', () => {
      const player = mockPlayers[0];
      const report1 = scoutingAI.generateScoutingReport(player, 'SCT-001', mockContext, 42);
      const report2 = scoutingAI.generateScoutingReport(player, 'SCT-001', mockContext, 42);

      expect(report1.rating).toBe(report2.rating);
      expect(report1.uncertainty).toBe(report2.uncertainty);
      expect(report1.recommendation).toBe(report2.recommendation);
      
      // Attribute assessments should be identical
      Object.keys(report1.attributes).forEach(attr => {
        expect(report1.attributes[attr].value).toBe(report2.attributes[attr].value);
        expect(report1.attributes[attr].confidence).toBe(report2.attributes[attr].confidence);
      });
    });

    it('should vary uncertainty based on scouting quality', () => {
      const player = mockPlayers[0];
      
      // Multiple reports should show some variation in uncertainty
      const reports = Array.from({ length: 5 }, (_, i) => 
        scoutingAI.generateScoutingReport(player, 'SCT-001', mockContext, i)
      );

      const uncertainties = reports.map(r => r.uncertainty);
      const uniqueUncertainties = new Set(uncertainties);
      
      expect(uniqueUncertainties.size).toBeGreaterThan(1); // Should have variation
      uncertainties.forEach(u => {
        expect(u).toBeGreaterThanOrEqual(3);
        expect(u).toBeLessThanOrEqual(15);
      });
    });
  });
});
