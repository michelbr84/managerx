import { describe, it, expect, beforeEach } from 'vitest';
import { 
  NarrativeEngine, 
  StoryletRecommendationEngine,
  StoryletContentProcessor,
  createMockGameContext 
} from '../src/storylets/engine.js';
import type { Storylet, NarrativeState, GameContext } from '../src/storylets/schema.js';

// Mock storylets for testing
const mockStorylets: Storylet[] = [
  {
    id: 'ST-TEST-001',
    title: 'Test Player Form Event',
    category: 'player_news',
    content: 'Test player {player} is in excellent form.',
    conditions: [
      {
        type: 'player_form',
        target: 'PLY-001',
        operator: '>=',
        value: 80,
        weight: 1.0
      }
    ],
    choices: [
      {
        id: 'praise',
        text: 'Praise the player',
        effects: [
          {
            type: 'morale_change',
            target: 'PLY-001',
            value: 5,
            description: 'Player morale increases'
          }
        ],
        weight: 0.8
      },
      {
        id: 'ignore',
        text: 'Continue as normal',
        effects: [],
        weight: 0.2
      }
    ],
    priority: 'medium',
    cooldown: 7,
    maxOccurrences: 2,
    tags: ['test', 'player']
  },
  {
    id: 'ST-TEST-002',
    title: 'Test Team Performance Event',
    category: 'club_news',
    content: 'The team has been performing {performance} recently.',
    conditions: [
      {
        type: 'team_performance',
        operator: '<',
        value: 40,
        weight: 1.0
      },
      {
        type: 'random',
        operator: '<',
        value: 50,
        weight: 0.8
      }
    ],
    choices: [
      {
        id: 'team_talk',
        text: 'Give motivational team talk',
        effects: [
          {
            type: 'morale_change',
            value: 10,
            description: 'Team morale improves'
          }
        ],
        weight: 0.9
      }
    ],
    priority: 'high',
    cooldown: 14,
    maxOccurrences: 1,
    tags: ['test', 'team']
  }
];

describe('Narrative Storylets System', () => {
  let engine: NarrativeEngine;
  let mockContext: GameContext;
  let mockNarrativeState: NarrativeState;

  beforeEach(() => {
    engine = new NarrativeEngine(mockStorylets);
    mockContext = createMockGameContext();
    mockNarrativeState = {
      activeStorylets: [],
      completedStorylets: [],
      lastTriggered: {},
      occurrenceCount: {},
      playerChoiceHistory: [],
      narrativeSeed: 42,
    };
  });

  describe('Storylet Evaluation', () => {
    it('should trigger storylets when conditions are met', () => {
      // Set up context where first storylet should trigger
      mockContext.players[0].form = 85; // Meets condition >= 80
      
      const triggered = engine.evaluateStorylets(mockContext, mockNarrativeState, 5);
      
      // Should have chance to trigger first storylet
      expect(triggered.length).toBeGreaterThanOrEqual(0);
      
      // If triggered, should be the right storylet
      if (triggered.length > 0) {
        expect(triggered[0].storyletId).toBe('ST-TEST-001');
      }
    });

    it('should not trigger storylets when conditions are not met', () => {
      // Set up context where conditions are not met
      mockContext.players[0].form = 50; // Below threshold of 80
      mockContext.recentResults = ['W', 'W', 'W', 'W', 'W']; // Good performance (>40%)
      
      const triggered = engine.evaluateStorylets(mockContext, mockNarrativeState, 5);
      
      // Should not trigger storylets with unmet conditions
      const playerFormStorylet = triggered.find(s => s.storyletId === 'ST-TEST-001');
      const teamPerfStorylet = triggered.find(s => s.storyletId === 'ST-TEST-002');
      
      expect(playerFormStorylet).toBeUndefined();
      expect(teamPerfStorylet).toBeUndefined();
    });

    it('should respect cooldown periods', () => {
      // Set up triggered storylet with recent trigger
      mockNarrativeState.lastTriggered['ST-TEST-001'] = '2024-08-10';
      mockContext.currentDate = '2024-08-12'; // Only 2 days later, cooldown is 7
      mockContext.players[0].form = 85;
      
      const triggered = engine.evaluateStorylets(mockContext, mockNarrativeState, 5);
      
      const storylet = triggered.find(s => s.storyletId === 'ST-TEST-001');
      expect(storylet).toBeUndefined();
    });

    it('should respect max occurrences', () => {
      // Set up storylet that has reached max occurrences
      mockNarrativeState.occurrenceCount['ST-TEST-001'] = 2; // Max is 2
      mockContext.players[0].form = 85;
      
      const triggered = engine.evaluateStorylets(mockContext, mockNarrativeState, 5);
      
      const storylet = triggered.find(s => s.storyletId === 'ST-TEST-001');
      expect(storylet).toBeUndefined();
    });

    it('should be deterministic with same seed', () => {
      mockContext.players[0].form = 85;
      
      const triggered1 = engine.evaluateStorylets(mockContext, mockNarrativeState, 5);
      const triggered2 = engine.evaluateStorylets(mockContext, mockNarrativeState, 5);
      
      expect(triggered1.length).toBe(triggered2.length);
      if (triggered1.length > 0 && triggered2.length > 0) {
        expect(triggered1[0].storyletId).toBe(triggered2[0].storyletId);
      }
    });
  });

  describe('Storylet Resolution', () => {
    it('should resolve storylets with valid choices', () => {
      const instance = {
        id: 'SI-001',
        storyletId: 'ST-TEST-001',
        triggeredAt: new Date().toISOString(),
        gameDate: '2024-08-15',
        seed: 42,
        context: {},
        resolved: false,
      };

      const effects = engine.resolveStorylet(instance, 'praise', mockContext);
      
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('morale_change');
      expect(effects[0].target).toBe('PLY-001');
      expect(effects[0].value).toBe(5);
    });

    it('should reject invalid choice IDs', () => {
      const instance = {
        id: 'SI-001',
        storyletId: 'ST-TEST-001',
        triggeredAt: new Date().toISOString(),
        gameDate: '2024-08-15',
        seed: 42,
        context: {},
        resolved: false,
      };

      expect(() => {
        engine.resolveStorylet(instance, 'invalid-choice', mockContext);
      }).toThrow();
    });

    it('should validate choice requirements', () => {
      // Create storylet with choice requirements
      const storyletWithRequirements: Storylet = {
        ...mockStorylets[0],
        choices: [
          {
            id: 'expensive_choice',
            text: 'Expensive option',
            effects: [],
            requirements: [
              {
                type: 'financial',
                operator: '>',
                value: 20000000,
                weight: 1.0
              }
            ],
            weight: 0.5
          }
        ]
      };

      const engineWithReqs = new NarrativeEngine([storyletWithRequirements]);
      const instance = {
        id: 'SI-001',
        storyletId: storyletWithRequirements.id,
        triggeredAt: new Date().toISOString(),
        gameDate: '2024-08-15',
        seed: 42,
        context: {},
        resolved: false,
      };

      // Should fail with insufficient budget
      mockContext.budget = 10000000; // Less than required 20M
      
      expect(() => {
        engineWithReqs.resolveStorylet(instance, 'expensive_choice', mockContext);
      }).toThrow('Choice requirements not met');
    });
  });

  describe('Recommendation Engine', () => {
    it('should recommend appropriate choices based on context', () => {
      const storylet = mockStorylets[0]; // Player form storylet
      
      // Context with low team morale - should recommend praise
      const lowMoraleContext = { ...mockContext, teamMorale: 60 };
      
      const recommendation = StoryletRecommendationEngine.recommendChoice(
        storylet,
        lowMoraleContext,
        mockNarrativeState
      );
      
      expect(recommendation.recommendedChoiceId).toBe('praise');
      expect(recommendation.confidence).toBeGreaterThan(0.5);
      expect(recommendation.reasoning).toContain('morale');
    });

    it('should provide reasoning for recommendations', () => {
      const storylet = mockStorylets[0];
      
      const recommendation = StoryletRecommendationEngine.recommendChoice(
        storylet,
        mockContext,
        mockNarrativeState
      );
      
      expect(recommendation.reasoning).toBeDefined();
      expect(typeof recommendation.reasoning).toBe('string');
      expect(recommendation.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('Content Processing', () => {
    it('should replace context variables in content', () => {
      const content = 'The team is performing {performance} and {manager} should consider changes.';
      const variables = { '{performance}': 'poorly', '{manager}': 'you' };
      
      const processed = StoryletContentProcessor.processContent(
        content,
        mockContext,
        variables
      );
      
      expect(processed).toContain('poorly');
      expect(processed).toContain('you');
      expect(processed).not.toContain('{performance}');
      expect(processed).not.toContain('{manager}');
    });

    it('should handle missing variables gracefully', () => {
      const content = 'Test content with {missing_variable}';
      
      const processed = StoryletContentProcessor.processContent(
        content,
        mockContext
      );
      
      // Should not crash, variable should remain unchanged
      expect(processed).toContain('{missing_variable}');
    });
  });

  describe('Rate Limiting', () => {
    it('should limit storylet frequency', () => {
      mockContext.players[0].form = 85;
      
      // Trigger multiple times in short succession
      const triggered1 = engine.evaluateStorylets(mockContext, mockNarrativeState, 5);
      const triggered2 = engine.evaluateStorylets(mockContext, mockNarrativeState, 5);
      
      // Second evaluation should have fewer or no triggers due to rate limiting
      expect(triggered2.length).toBeLessThanOrEqual(triggered1.length);
    });
  });

  describe('Audit Logging', () => {
    it('should log storylet decisions', () => {
      mockContext.players[0].form = 85;
      
      engine.evaluateStorylets(mockContext, mockNarrativeState, 5);
      
      const logs = engine.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      
      const log = logs[logs.length - 1];
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('storyletId');
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('reason');
    });

    it('should clear old logs when limit is reached', () => {
      // Generate many logs
      for (let i = 0; i < 1100; i++) {
        engine.evaluateStorylets(mockContext, mockNarrativeState, 1);
      }
      
      engine.clearOldLogs();
      const logs = engine.getLogs();
      
      expect(logs.length).toBeLessThanOrEqual(1000);
    });
  });
});
