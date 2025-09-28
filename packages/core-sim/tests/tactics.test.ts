import { describe, it, expect } from 'vitest';
import {
  FORMATION_MODIFIERS,
  MENTALITY_MODIFIERS,
  PRESSING_MODIFIERS,
  TEMPO_MODIFIERS,
  WIDTH_MODIFIERS,
  calculateAttackRating,
  calculateDefenseRating,
  calculateMidfieldRating,
  calculateStaminaDrain,
  calculatePossessionTendency,
  getTacticalMatchup,
  getTacticalXGModifier,
  getDefaultTactics,
  validateTactics,
} from '../src/tactics.js';
import type { Team, TacticalSetup } from '../src/types.js';

// Mock team factory
const createMockTeam = (
  id: string,
  rating: number,
  tactics: Partial<TacticalSetup> = {}
): Team => ({
  id,
  name: `${id} FC`,
  players: [],
  overallRating: rating,
  tactics: {
    formation: '4-4-2',
    mentality: 'balanced',
    pressing: 'medium',
    tempo: 'medium',
    width: 'normal',
    ...tactics,
  },
});

describe('Tactical System', () => {
  describe('Formation Modifiers', () => {
    it('should have correct formation modifiers', () => {
      expect(FORMATION_MODIFIERS['4-4-2']).toBeDefined();
      expect(FORMATION_MODIFIERS['4-3-3']).toBeDefined();
      expect(FORMATION_MODIFIERS['3-5-2']).toBeDefined();
      
      // 4-3-3 should be more attacking than 4-4-2
      expect(FORMATION_MODIFIERS['4-3-3'].attack).toBeGreaterThan(FORMATION_MODIFIERS['4-4-2'].attack);
      
      // 4-4-2 should be more defensive than 4-3-3
      expect(FORMATION_MODIFIERS['4-4-2'].defense).toBeGreaterThan(FORMATION_MODIFIERS['4-3-3'].defense);
      
      // 3-5-2 should have strongest midfield
      expect(FORMATION_MODIFIERS['3-5-2'].midfield).toBeGreaterThan(FORMATION_MODIFIERS['4-4-2'].midfield);
      expect(FORMATION_MODIFIERS['3-5-2'].midfield).toBeGreaterThan(FORMATION_MODIFIERS['4-3-3'].midfield);
    });

    it('should have balanced formation modifiers', () => {
      Object.values(FORMATION_MODIFIERS).forEach(modifier => {
        // No single modifier should be too extreme
        expect(modifier.attack).toBeGreaterThanOrEqual(-0.3);
        expect(modifier.attack).toBeLessThanOrEqual(0.3);
        expect(modifier.defense).toBeGreaterThanOrEqual(-0.3);
        expect(modifier.defense).toBeLessThanOrEqual(0.3);
      });
    });
  });

  describe('Rating Calculations', () => {
    it('should calculate attack rating with formation and mentality modifiers', () => {
      const baseTeam = createMockTeam('TEST', 100);
      const attackingTeam = createMockTeam('ATT', 100, { 
        formation: '4-3-3', 
        mentality: 'attacking' 
      });
      const defensiveTeam = createMockTeam('DEF', 100, { 
        mentality: 'defensive' 
      });

      const baseAttack = calculateAttackRating(baseTeam);
      const attackingAttack = calculateAttackRating(attackingTeam);
      const defensiveAttack = calculateAttackRating(defensiveTeam);

      expect(attackingAttack).toBeGreaterThan(baseAttack);
      expect(defensiveAttack).toBeLessThan(baseAttack);
      
      // Ratings should be within reasonable bounds
      [baseAttack, attackingAttack, defensiveAttack].forEach(rating => {
        expect(rating).toBeGreaterThanOrEqual(20);
        expect(rating).toBeLessThanOrEqual(200);
      });
    });

    it('should calculate defense rating correctly', () => {
      const defensiveTeam = createMockTeam('DEF', 100, { 
        formation: '4-4-2', 
        mentality: 'defensive',
        pressing: 'high'
      });
      const attackingTeam = createMockTeam('ATT', 100, { 
        mentality: 'attacking' 
      });

      const defensiveRating = calculateDefenseRating(defensiveTeam);
      const attackingRating = calculateDefenseRating(attackingTeam);

      expect(defensiveRating).toBeGreaterThan(attackingRating);
    });

    it('should calculate midfield rating with formation effects', () => {
      const midfield352 = createMockTeam('MID352', 100, { formation: '3-5-2' });
      const midfield442 = createMockTeam('MID442', 100, { formation: '4-4-2' });

      const rating352 = calculateMidfieldRating(midfield352);
      const rating442 = calculateMidfieldRating(midfield442);

      // 3-5-2 should have stronger midfield
      expect(rating352).toBeGreaterThan(rating442);
    });
  });

  describe('Stamina Calculations', () => {
    it('should calculate stamina drain based on tactics', () => {
      const highPressTeam = createMockTeam('PRESS', 100, { 
        pressing: 'high',
        tempo: 'fast',
        mentality: 'attacking'
      });
      const lowPressTeam = createMockTeam('LOW', 100, { 
        pressing: 'low',
        tempo: 'slow',
        mentality: 'defensive'
      });

      const highDrain = calculateStaminaDrain(highPressTeam, 45, 70);
      const lowDrain = calculateStaminaDrain(lowPressTeam, 45, 70);

      expect(highDrain).toBeGreaterThan(lowDrain);
    });

    it('should increase stamina drain over time', () => {
      const team = createMockTeam('TEST', 100);
      
      const earlyDrain = calculateStaminaDrain(team, 30, 50);
      const lateDrain = calculateStaminaDrain(team, 80, 50);

      expect(lateDrain).toBeGreaterThan(earlyDrain);
    });

    it('should factor intensity into stamina drain', () => {
      const team = createMockTeam('TEST', 100);
      
      const lowIntensity = calculateStaminaDrain(team, 45, 30);
      const highIntensity = calculateStaminaDrain(team, 45, 90);

      expect(highIntensity).toBeGreaterThan(lowIntensity);
    });
  });

  describe('Possession Calculations', () => {
    it('should calculate possession tendency based on tactics', () => {
      const possessionTeam = createMockTeam('POSS', 100, { 
        tempo: 'slow',
        formation: '3-5-2'
      });
      const directTeam = createMockTeam('DIRECT', 100, { 
        tempo: 'fast'
      });

      const possessionTendency = calculatePossessionTendency(possessionTeam);
      const directTendency = calculatePossessionTendency(directTeam);

      expect(possessionTendency).toBeGreaterThan(directTendency);
      
      // Should be within valid probability range
      expect(possessionTendency).toBeGreaterThanOrEqual(0.2);
      expect(possessionTendency).toBeLessThanOrEqual(0.8);
      expect(directTendency).toBeGreaterThanOrEqual(0.2);
      expect(directTendency).toBeLessThanOrEqual(0.8);
    });
  });

  describe('Tactical Matchups', () => {
    it('should calculate tactical advantages correctly', () => {
      const team433 = createMockTeam('433', 100, { formation: '4-3-3' });
      const team442 = createMockTeam('442', 100, { formation: '4-4-2' });

      const matchup = getTacticalMatchup(team433, team442);

      // 4-3-3 should have advantage over 4-4-2
      expect(matchup.homeAdvantage).toBeGreaterThan(0);
      expect(matchup.awayAdvantage).toBe(0);
    });

    it('should consider mentality in matchups', () => {
      const attackingTeam = createMockTeam('ATT', 100, { mentality: 'attacking' });
      const defensiveTeam = createMockTeam('DEF', 100, { mentality: 'defensive' });

      const matchup = getTacticalMatchup(attackingTeam, defensiveTeam);

      expect(matchup.homeAdvantage).toBeGreaterThan(0);
    });

    it('should consider pressing vs tempo matchups', () => {
      const highPressTeam = createMockTeam('PRESS', 100, { pressing: 'high' });
      const slowTeam = createMockTeam('SLOW', 100, { tempo: 'slow' });

      const matchup = getTacticalMatchup(highPressTeam, slowTeam);

      expect(matchup.homeAdvantage).toBeGreaterThan(0);
    });
  });

  describe('xG Modifiers', () => {
    it('should apply tactical xG modifiers correctly', () => {
      const attackingTeam = createMockTeam('ATT', 100, { 
        formation: '4-3-3',
        mentality: 'attacking'
      });
      const defensiveTeam = createMockTeam('DEF', 100, { 
        mentality: 'defensive'
      });

      const attackingModifier = getTacticalXGModifier(attackingTeam, 'shot');
      const defensiveModifier = getTacticalXGModifier(defensiveTeam, 'shot');

      expect(attackingModifier).toBeGreaterThan(defensiveModifier);
      
      // Modifiers should be within reasonable range
      expect(attackingModifier).toBeGreaterThanOrEqual(0.5);
      expect(attackingModifier).toBeLessThanOrEqual(2.0);
    });

    it('should apply different modifiers for shot types', () => {
      const wideTeam = createMockTeam('WIDE', 100, { width: 'wide' });

      const shotModifier = getTacticalXGModifier(wideTeam, 'shot');
      const headerModifier = getTacticalXGModifier(wideTeam, 'header');

      // Wide teams should get bonus for headers (from crosses)
      expect(headerModifier).toBeGreaterThanOrEqual(shotModifier);
    });
  });

  describe('Default Tactics', () => {
    it('should provide valid default tactics for each formation', () => {
      const formations: Array<'4-4-2' | '4-3-3' | '3-5-2'> = ['4-4-2', '4-3-3', '3-5-2'];
      
      formations.forEach(formation => {
        const defaults = getDefaultTactics(formation);
        
        expect(defaults.formation).toBe(formation);
        expect(defaults.mentality).toBe('balanced');
        expect(defaults.pressing).toBe('medium');
        expect(defaults.tempo).toBe('medium');
        expect(defaults.width).toBe('normal');
      });
    });
  });

  describe('Tactics Validation', () => {
    it('should validate correct tactics', () => {
      const validTactics: TacticalSetup = {
        formation: '4-4-2',
        mentality: 'balanced',
        pressing: 'medium',
        tempo: 'medium',
        width: 'normal',
      };

      expect(validateTactics(validTactics)).toBe(true);
    });

    it('should reject invalid tactics', () => {
      const invalidTactics = {
        formation: 'invalid' as any,
        mentality: 'balanced',
        pressing: 'medium',
        tempo: 'medium',
        width: 'normal',
      };

      expect(validateTactics(invalidTactics)).toBe(false);
    });

    it('should validate all tactical options', () => {
      const validFormations = ['4-4-2', '4-3-3', '3-5-2'];
      const validMentalities = ['defensive', 'balanced', 'attacking'];
      const validPressing = ['low', 'medium', 'high'];
      const validTempo = ['slow', 'medium', 'fast'];
      const validWidth = ['narrow', 'normal', 'wide'];

      validFormations.forEach(formation => {
        validMentalities.forEach(mentality => {
          validPressing.forEach(pressing => {
            validTempo.forEach(tempo => {
              validWidth.forEach(width => {
                const tactics: TacticalSetup = {
                  formation: formation as any,
                  mentality: mentality as any,
                  pressing: pressing as any,
                  tempo: tempo as any,
                  width: width as any,
                };
                
                expect(validateTactics(tactics)).toBe(true);
              });
            });
          });
        });
      });
    });
  });

  describe('Modifier Constants', () => {
    it('should have all required modifier tables', () => {
      expect(FORMATION_MODIFIERS).toBeDefined();
      expect(MENTALITY_MODIFIERS).toBeDefined();
      expect(PRESSING_MODIFIERS).toBeDefined();
      expect(TEMPO_MODIFIERS).toBeDefined();
      expect(WIDTH_MODIFIERS).toBeDefined();
    });

    it('should have consistent modifier structure', () => {
      Object.values(FORMATION_MODIFIERS).forEach(modifier => {
        expect(modifier).toHaveProperty('attack');
        expect(modifier).toHaveProperty('defense');
        expect(modifier).toHaveProperty('midfield');
        expect(modifier).toHaveProperty('width');
        expect(modifier).toHaveProperty('pressing');
      });

      Object.values(MENTALITY_MODIFIERS).forEach(modifier => {
        expect(modifier).toHaveProperty('attack');
        expect(modifier).toHaveProperty('defense');
        expect(modifier).toHaveProperty('possession');
        expect(modifier).toHaveProperty('pressing');
      });
    });

    it('should have balanced mentality as neutral', () => {
      const balanced = MENTALITY_MODIFIERS.balanced;
      
      expect(balanced.attack).toBe(0);
      expect(balanced.defense).toBe(0);
      expect(balanced.possession).toBe(0);
      expect(balanced.pressing).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme team ratings', () => {
      const weakTeam = createMockTeam('WEAK', 20);
      const strongTeam = createMockTeam('STRONG', 200);

      const weakAttack = calculateAttackRating(weakTeam);
      const strongAttack = calculateAttackRating(strongTeam);

      expect(weakAttack).toBeGreaterThanOrEqual(20);
      expect(strongAttack).toBeLessThanOrEqual(200);
      expect(strongAttack).toBeGreaterThan(weakAttack);
    });

    it('should handle negative modifiers correctly', () => {
      const team = createMockTeam('TEST', 100, { 
        formation: '4-3-3', // Has negative defense modifier
        mentality: 'defensive' // Has negative attack modifier
      });

      const attack = calculateAttackRating(team);
      const defense = calculateDefenseRating(team);

      expect(attack).toBeGreaterThan(0);
      expect(defense).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should produce consistent ratings across multiple calculations', () => {
      const team = createMockTeam('CONSISTENT', 100);

      const attack1 = calculateAttackRating(team);
      const attack2 = calculateAttackRating(team);
      const defense1 = calculateDefenseRating(team);
      const defense2 = calculateDefenseRating(team);

      expect(attack1).toBe(attack2);
      expect(defense1).toBe(defense2);
    });

    it('should handle all tactical combinations without errors', () => {
      const formations: Array<'4-4-2' | '4-3-3' | '3-5-2'> = ['4-4-2', '4-3-3', '3-5-2'];
      const mentalities: Array<'defensive' | 'balanced' | 'attacking'> = ['defensive', 'balanced', 'attacking'];

      formations.forEach(formation => {
        mentalities.forEach(mentality => {
          const team = createMockTeam('TEST', 100, { formation, mentality });
          
          expect(() => {
            calculateAttackRating(team);
            calculateDefenseRating(team);
            calculateMidfieldRating(team);
            calculatePossessionTendency(team);
          }).not.toThrow();
        });
      });
    });
  });
});
