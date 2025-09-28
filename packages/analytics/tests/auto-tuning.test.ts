import { describe, it, expect } from 'vitest';
import { AutoTuningEngine, BalanceCodeGenerator } from '../src/auto-tuning.js';
import type { TelemetryEvent, TelemetryKPIs } from '../src/telemetry.js';

// Sample telemetry data for testing
const createSampleEvents = (overrides: Partial<TelemetryKPIs> = {}): TelemetryEvent[] => {
  const baseKPIs: TelemetryKPIs = {
    d1Retention: 60,
    d7Retention: 40,
    d30Retention: 25,
    averageSessionDuration: 25,
    sessionsPerUser: 3,
    matchesPerSession: 2.5,
    tacticsChangesPerSession: 2,
    screensViewedPerSession: 6,
    crashRate: 2,
    averageLoadTime: 1200,
    performanceScore: 85,
    assistantUsageRate: 45,
    keyboardShortcutUsage: 35,
    saveGameFrequency: 1.2,
    ...overrides,
  };

  // Generate events that would produce these KPIs
  const events: TelemetryEvent[] = [];
  const now = new Date();
  
  // Generate sessions for 30 days
  for (let day = 0; day < 30; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    
    // Generate 2-3 users per day
    for (let user = 0; user < 3; user++) {
      const userId = `user_${user}`;
      const sessionId = `sess_${day}_${user}`;
      
      // Session start
      events.push({
        id: `evt_${events.length}`,
        type: 'session_start',
        timestamp: date.toISOString(),
        sessionId,
        userId,
        data: {},
        version: '1.0.0',
      });
      
      // Matches based on target KPI
      const matchCount = Math.floor(baseKPIs.matchesPerSession + (Math.random() - 0.5));
      for (let i = 0; i < matchCount; i++) {
        events.push({
          id: `evt_${events.length}`,
          type: 'match_simulated',
          timestamp: date.toISOString(),
          sessionId,
          userId,
          data: { homeScore: 1, awayScore: 1, eventCount: 15 },
          version: '1.0.0',
        });
      }
      
      // Errors based on crash rate
      if (Math.random() * 100 < baseKPIs.crashRate) {
        events.push({
          id: `evt_${events.length}`,
          type: 'error_occurred',
          timestamp: date.toISOString(),
          sessionId,
          userId,
          data: { errorType: 'TestError' },
          version: '1.0.0',
        });
      }
      
      // Session end
      events.push({
        id: `evt_${events.length}`,
        type: 'session_end',
        timestamp: date.toISOString(),
        sessionId,
        userId,
        data: {
          duration: baseKPIs.averageSessionDuration * 60,
          matchesSimulated: matchCount,
          screenViews: Math.floor(baseKPIs.screensViewedPerSession),
          tacticsChanged: Math.floor(baseKPIs.tacticsChangesPerSession),
        },
        version: '1.0.0',
      });
    }
  }
  
  return events;
};

describe('Auto-Tuning System', () => {
  let engine: AutoTuningEngine;

  beforeEach(() => {
    engine = new AutoTuningEngine();
  });

  describe('Recommendation Generation', () => {
    it('should generate recommendations for poor retention', () => {
      const poorRetentionEvents = createSampleEvents({
        d1Retention: 25, // Poor retention
        d7Retention: 15,
      });
      
      const report = engine.generateTuningRecommendations(poorRetentionEvents);
      
      expect(report.recommendations.length).toBeGreaterThan(0);
      
      // Should recommend changes to improve retention
      const retentionRecs = report.recommendations.filter(r => 
        r.reasoning.toLowerCase().includes('retention') ||
        r.reasoning.toLowerCase().includes('engagement')
      );
      
      expect(retentionRecs.length).toBeGreaterThan(0);
    });

    it('should generate recommendations for high crash rate', () => {
      const highCrashEvents = createSampleEvents({
        crashRate: 15, // High crash rate
      });
      
      const report = engine.generateTuningRecommendations(highCrashEvents);
      
      const crashRecs = report.recommendations.filter(r => 
        r.reasoning.toLowerCase().includes('crash') ||
        r.reasoning.toLowerCase().includes('save')
      );
      
      expect(crashRecs.length).toBeGreaterThan(0);
      
      // Should recommend more frequent saves
      const saveRec = crashRecs.find(r => r.parameterId.includes('save'));
      if (saveRec) {
        expect(saveRec.priority).toBe('high');
        expect(saveRec.confidence).toBeGreaterThan(80);
      }
    });

    it('should generate recommendations for poor performance', () => {
      const slowPerformanceEvents = createSampleEvents({
        averageLoadTime: 4000, // Slow loading
        performanceScore: 45,
      });
      
      const report = engine.generateTuningRecommendations(slowPerformanceEvents);
      
      const perfRecs = report.recommendations.filter(r => 
        r.reasoning.toLowerCase().includes('performance') ||
        r.reasoning.toLowerCase().includes('load')
      );
      
      expect(perfRecs.length).toBeGreaterThan(0);
    });

    it('should not generate recommendations for good metrics', () => {
      const goodMetricsEvents = createSampleEvents({
        d1Retention: 80,
        d7Retention: 60,
        crashRate: 0,
        averageLoadTime: 800,
        performanceScore: 95,
      });
      
      const report = engine.generateTuningRecommendations(goodMetricsEvents);
      
      // Should have few or no recommendations for good performance
      expect(report.recommendations.length).toBeLessThan(3);
    });

    it('should prioritize recommendations correctly', () => {
      const mixedEvents = createSampleEvents({
        crashRate: 20, // Critical issue
        d1Retention: 30, // Medium issue
        averageLoadTime: 2200, // Low issue
      });
      
      const report = engine.generateTuningRecommendations(mixedEvents);
      
      // Should be sorted by priority
      const priorities = report.recommendations.map(r => r.priority);
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      
      for (let i = 1; i < priorities.length; i++) {
        expect(priorityOrder[priorities[i - 1]]).toBeGreaterThanOrEqual(priorityOrder[priorities[i]]);
      }
    });
  });

  describe('Data Quality Assessment', () => {
    it('should assess high quality data correctly', () => {
      const highQualityEvents = Array.from({ length: 2000 }, (_, i) => ({
        id: `evt_${i}`,
        type: 'session_start' as const,
        timestamp: new Date().toISOString(),
        sessionId: `sess_${Math.floor(i / 10)}`,
        userId: `user_${i % 50}`, // 50 unique users
        data: {},
        version: '1.0.0',
      }));
      
      const report = engine.generateTuningRecommendations(highQualityEvents);
      
      expect(report.dataQuality.confidence).toBe('high');
      expect(report.dataQuality.totalEvents).toBe(2000);
      expect(report.dataQuality.uniqueUsers).toBe(50);
    });

    it('should assess low quality data correctly', () => {
      const lowQualityEvents = Array.from({ length: 10 }, (_, i) => ({
        id: `evt_${i}`,
        type: 'session_start' as const,
        timestamp: new Date().toISOString(),
        sessionId: `sess_${i}`,
        userId: `user_${i % 2}`, // Only 2 users
        data: {},
        version: '1.0.0',
      }));
      
      const report = engine.generateTuningRecommendations(lowQualityEvents);
      
      expect(report.dataQuality.confidence).toBe('low');
      expect(report.recommendations.length).toBe(0); // No recommendations for low quality data
    });
  });

  describe('Automatic Application', () => {
    it('should apply high-confidence, low-risk changes', () => {
      const recommendations = [
        {
          parameterId: 'ui_assistant_suggestion_frequency',
          currentValue: 0.3,
          recommendedValue: 0.35,
          confidence: 85, // High confidence
          reasoning: 'Test recommendation',
          expectedImpact: 'Positive',
          priority: 'low' as const, // Low risk
          dataPoints: 100,
        },
        {
          parameterId: 'sim_base_event_probability',
          currentValue: 0.15,
          recommendedValue: 0.18,
          confidence: 60, // Low confidence
          reasoning: 'Test recommendation',
          expectedImpact: 'Uncertain',
          priority: 'medium' as const,
          dataPoints: 50,
        },
      ];
      
      const { applied, skipped } = engine.applyAutomaticTuning(recommendations);
      
      expect(applied).toHaveLength(1);
      expect(applied[0].parameterId).toBe('ui_assistant_suggestion_frequency');
      
      expect(skipped).toHaveLength(1);
      expect(skipped[0].reason).toContain('Low confidence');
    });

    it('should not apply changes outside parameter bounds', () => {
      const recommendations = [
        {
          parameterId: 'ui_assistant_suggestion_frequency',
          currentValue: 0.3,
          recommendedValue: 0.8, // Outside max bound of 0.6
          confidence: 90,
          reasoning: 'Test recommendation',
          expectedImpact: 'Positive',
          priority: 'low' as const,
          dataPoints: 100,
        },
      ];
      
      const { applied, skipped } = engine.applyAutomaticTuning(recommendations);
      
      expect(applied).toHaveLength(0);
      expect(skipped).toHaveLength(1);
      expect(skipped[0].reason).toContain('outside allowed bounds');
    });

    it('should not apply high-priority changes automatically', () => {
      const recommendations = [
        {
          parameterId: 'ui_auto_save_interval',
          currentValue: 300000,
          recommendedValue: 180000,
          confidence: 95,
          reasoning: 'Critical change needed',
          expectedImpact: 'High impact',
          priority: 'high' as const, // High priority = manual review required
          dataPoints: 200,
        },
      ];
      
      const { applied, skipped } = engine.applyAutomaticTuning(recommendations);
      
      expect(applied).toHaveLength(0);
      expect(skipped).toHaveLength(1);
      expect(skipped[0].reason).toContain('high priority');
    });
  });

  describe('Parameter Management', () => {
    it('should get current parameter values', () => {
      const values = engine.getParameterValues();
      
      expect(values).toHaveProperty('sim_base_event_probability');
      expect(values).toHaveProperty('ui_auto_save_interval');
      expect(typeof values.sim_base_event_probability).toBe('number');
    });

    it('should update parameter values within bounds', () => {
      const success = engine.updateParameter('sim_base_event_probability', 0.18);
      expect(success).toBe(true);
      
      const values = engine.getParameterValues();
      expect(values.sim_base_event_probability).toBe(0.18);
    });

    it('should reject parameter updates outside bounds', () => {
      const success = engine.updateParameter('sim_base_event_probability', 0.5); // Outside max of 0.25
      expect(success).toBe(false);
      
      // Value should remain unchanged
      const values = engine.getParameterValues();
      expect(values.sim_base_event_probability).toBe(0.15); // Original value
    });

    it('should reject updates to non-existent parameters', () => {
      const success = engine.updateParameter('non_existent_param', 0.5);
      expect(success).toBe(false);
    });
  });

  describe('PR Content Generation', () => {
    it('should generate PR content for applied changes', () => {
      const appliedChanges = [
        {
          parameterId: 'sim_base_event_probability',
          currentValue: 0.15,
          recommendedValue: 0.17,
          confidence: 85,
          reasoning: 'Improve match engagement',
          expectedImpact: 'More exciting matches',
          priority: 'low' as const,
          dataPoints: 150,
        },
      ];
      
      const report = {
        generatedAt: new Date().toISOString(),
        period: { start: '2024-08-01', end: '2024-08-07' },
        dataQuality: { totalEvents: 1000, uniqueUsers: 25, sessionsAnalyzed: 100, confidence: 'high' as const },
        recommendations: appliedChanges,
        appliedChanges: [],
        kpiTrends: { current: {} as TelemetryKPIs, changes: {} },
      };
      
      const prContent = engine.generatePRContent(report, appliedChanges);
      
      expect(prContent.title).toContain('chore(balance): weekly tuning');
      expect(prContent.body).toContain('Weekly Auto-Tuning Report');
      expect(prContent.body).toContain('sim_base_event_probability');
      expect(prContent.body).toContain('0.15 → 0.17');
      expect(prContent.branch).toMatch(/chore\/balance-weekly-tuning-\d{4}-\d{2}-\d{2}/);
    });

    it('should handle no changes scenario', () => {
      const report = {
        generatedAt: new Date().toISOString(),
        period: { start: '2024-08-01', end: '2024-08-07' },
        dataQuality: { totalEvents: 100, uniqueUsers: 5, sessionsAnalyzed: 20, confidence: 'low' as const },
        recommendations: [],
        appliedChanges: [],
        kpiTrends: { current: {} as TelemetryKPIs, changes: {} },
      };
      
      const prContent = engine.generatePRContent(report, []);
      
      expect(prContent.body).toContain('Nenhuma mudança automática aplicada');
    });
  });

  describe('Code Generation', () => {
    it('should generate parameter update code', () => {
      const appliedChanges = [
        {
          parameterId: 'sim_base_event_probability',
          currentValue: 0.15,
          recommendedValue: 0.17,
          confidence: 85,
          reasoning: 'Test change',
          expectedImpact: 'Test impact',
          priority: 'low' as const,
          dataPoints: 100,
        },
      ];
      
      const codeChanges = BalanceCodeGenerator.generateParameterUpdates(appliedChanges, engine);
      
      expect(codeChanges.length).toBeGreaterThan(0);
      expect(codeChanges[0].file).toContain('engine.ts');
      expect(codeChanges[0].changes[0].oldValue).toBe('0.15');
      expect(codeChanges[0].changes[0].newValue).toBe('0.17');
    });

    it('should generate appropriate commit messages', () => {
      const appliedChanges = [
        {
          parameterId: 'sim_base_event_probability',
          currentValue: 0.15,
          recommendedValue: 0.17,
          confidence: 85,
          reasoning: 'Improve engagement',
          expectedImpact: 'Better matches',
          priority: 'low' as const,
          dataPoints: 100,
        },
        {
          parameterId: 'ui_auto_save_interval',
          currentValue: 300000,
          recommendedValue: 240000,
          confidence: 80,
          reasoning: 'Reduce data loss',
          expectedImpact: 'Better UX',
          priority: 'medium' as const,
          dataPoints: 75,
        },
      ];
      
      const commitMessage = BalanceCodeGenerator.generateCommitMessage(appliedChanges);
      
      expect(commitMessage).toContain('chore(balance): weekly tuning');
      expect(commitMessage).toContain('Applied 2 automatic balance changes');
      expect(commitMessage).toContain('sim_base_event_probability');
      expect(commitMessage).toContain('ui_auto_save_interval');
      expect(commitMessage).toContain('175 data points'); // Sum of dataPoints
    });

    it('should handle no changes in commit message', () => {
      const commitMessage = BalanceCodeGenerator.generateCommitMessage([]);
      
      expect(commitMessage).toBe('chore(balance): weekly tuning - no changes applied');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty telemetry data', () => {
      const report = engine.generateTuningRecommendations([]);
      
      expect(report.dataQuality.confidence).toBe('low');
      expect(report.recommendations).toHaveLength(0);
    });

    it('should handle malformed telemetry events', () => {
      const malformedEvents = [
        {
          id: 'evt1',
          type: 'session_start' as const,
          timestamp: 'invalid-date',
          sessionId: 'sess1',
          data: {},
          version: '1.0.0',
        },
      ];
      
      expect(() => {
        engine.generateTuningRecommendations(malformedEvents as TelemetryEvent[]);
      }).not.toThrow();
    });

    it('should handle missing parameter IDs', () => {
      const invalidRecommendations = [
        {
          parameterId: 'non_existent_parameter',
          currentValue: 0.5,
          recommendedValue: 0.6,
          confidence: 90,
          reasoning: 'Test',
          expectedImpact: 'Test',
          priority: 'low' as const,
          dataPoints: 100,
        },
      ];
      
      const { applied, skipped } = engine.applyAutomaticTuning(invalidRecommendations);
      
      expect(applied).toHaveLength(0);
      expect(skipped).toHaveLength(1);
      expect(skipped[0].reason).toBe('Parameter not found');
    });
  });

  describe('KPI Trend Analysis', () => {
    it('should calculate KPI changes correctly', () => {
      const currentEvents = createSampleEvents({ d1Retention: 70 });
      const previousKPIs: TelemetryKPIs = {
        d1Retention: 60, // Improved by 10
        d7Retention: 40,
        d30Retention: 25,
        averageSessionDuration: 25,
        sessionsPerUser: 3,
        matchesPerSession: 2.5,
        tacticsChangesPerSession: 2,
        screensViewedPerSession: 6,
        crashRate: 2,
        averageLoadTime: 1200,
        performanceScore: 85,
        assistantUsageRate: 45,
        keyboardShortcutUsage: 35,
        saveGameFrequency: 1.2,
      };
      
      const report = engine.generateTuningRecommendations(currentEvents, previousKPIs);
      
      expect(report.kpiTrends.previous).toEqual(previousKPIs);
      expect(report.kpiTrends.changes.d1Retention).toBeCloseTo(10, 1); // Should show improvement
    });
  });

  describe('Performance', () => {
    it('should process large datasets efficiently', () => {
      const largeEventSet = Array.from({ length: 10000 }, (_, i) => ({
        id: `evt_${i}`,
        type: 'session_start' as const,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        sessionId: `sess_${Math.floor(i / 10)}`,
        userId: `user_${i % 100}`,
        data: {},
        version: '1.0.0',
      }));
      
      const startTime = performance.now();
      const report = engine.generateTuningRecommendations(largeEventSet);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      console.log(`Processed 10k events in ${processingTime.toFixed(2)}ms`);
      
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(report).toBeDefined();
    });
  });
});
