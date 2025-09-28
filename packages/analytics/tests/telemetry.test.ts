import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TelemetryCollector, KPICalculator } from '../src/telemetry.js';
import type { TelemetryConfig, TelemetryEvent } from '../src/telemetry.js';

// Mock localStorage for testing
const mockLocalStorage = {
  data: new Map<string, string>(),
  getItem: (key: string) => mockLocalStorage.data.get(key) || null,
  setItem: (key: string, value: string) => mockLocalStorage.data.set(key, value),
  removeItem: (key: string) => mockLocalStorage.data.delete(key),
  clear: () => mockLocalStorage.data.clear(),
};

// @ts-ignore
global.localStorage = mockLocalStorage;

describe('Telemetry System', () => {
  let collector: TelemetryCollector;
  
  beforeEach(() => {
    mockLocalStorage.clear();
    
    const config: TelemetryConfig = {
      enabled: true,
      consentGiven: true,
      dataRetentionDays: 30,
      bufferSize: 10,
      autoFlush: false, // Disable for testing
      flushInterval: 300000,
    };
    
    collector = new TelemetryCollector(config);
  });

  afterEach(() => {
    collector.disable();
    mockLocalStorage.clear();
  });

  describe('Privacy and Consent', () => {
    it('should not record events without consent', () => {
      const noConsentConfig: TelemetryConfig = {
        enabled: true,
        consentGiven: false,
        dataRetentionDays: 30,
        bufferSize: 10,
        autoFlush: false,
        flushInterval: 300000,
      };
      
      const noConsentCollector = new TelemetryCollector(noConsentConfig);
      noConsentCollector.recordEvent('app_start', { test: 'data' });
      
      const buffer = noConsentCollector.getBuffer();
      expect(buffer).toHaveLength(0);
    });

    it('should not record events when disabled', () => {
      const disabledConfig: TelemetryConfig = {
        enabled: false,
        consentGiven: true,
        dataRetentionDays: 30,
        bufferSize: 10,
        autoFlush: false,
        flushInterval: 300000,
      };
      
      const disabledCollector = new TelemetryCollector(disabledConfig);
      disabledCollector.recordEvent('app_start', { test: 'data' });
      
      const buffer = disabledCollector.getBuffer();
      expect(buffer).toHaveLength(0);
    });

    it('should allow consent updates', () => {
      collector.recordEvent('app_start', { test: 'before' });
      expect(collector.getBuffer()).toHaveLength(1);
      
      collector.updateConsent(false);
      collector.recordEvent('app_start', { test: 'after' });
      
      // Should not record after consent withdrawn
      expect(collector.getBuffer()).toHaveLength(0); // Buffer cleared
    });

    it('should completely disable telemetry', () => {
      collector.recordEvent('app_start', { test: 'data' });
      expect(collector.getBuffer()).toHaveLength(1);
      
      collector.disable();
      collector.recordEvent('app_start', { test: 'after_disable' });
      
      expect(collector.getBuffer()).toHaveLength(0);
    });
  });

  describe('Data Collection', () => {
    it('should record basic events', () => {
      collector.recordEvent('app_start', { version: '1.0.0' });
      
      const buffer = collector.getBuffer();
      expect(buffer).toHaveLength(1);
      
      const event = buffer[0];
      expect(event.type).toBe('app_start');
      expect(event.data.version).toBe('1.0.0');
      expect(event.timestamp).toBeDefined();
      expect(event.sessionId).toBeDefined();
    });

    it('should sanitize sensitive data', () => {
      collector.recordEvent('game_created', {
        managerName: 'Sensitive Name',
        clubId: 'CLB-0001',
        normalData: 'safe',
      });
      
      const buffer = collector.getBuffer();
      const event = buffer[0];
      
      // Should sanitize name
      expect(event.data.managerName).toBe('[LENGTH:14]');
      
      // Should hash ID
      expect(event.data.clubId).not.toBe('CLB-0001');
      expect(typeof event.data.clubId).toBe('string');
      expect(event.data.clubId).toHaveLength(8); // Hash length
      
      // Should keep normal data
      expect(event.data.normalData).toBe('safe');
    });

    it('should generate unique event IDs', () => {
      collector.recordEvent('app_start');
      collector.recordEvent('app_start');
      
      const buffer = collector.getBuffer();
      expect(buffer[0].id).not.toBe(buffer[1].id);
    });

    it('should maintain session ID consistency', () => {
      collector.recordEvent('session_start');
      collector.recordEvent('screen_viewed');
      collector.recordEvent('session_end');
      
      const buffer = collector.getBuffer();
      const sessionIds = buffer.map(e => e.sessionId);
      
      // All events in same session should have same session ID
      expect(new Set(sessionIds).size).toBe(1);
    });
  });

  describe('Specialized Event Recording', () => {
    it('should record game creation events', () => {
      collector.recordGameCreated('Test Manager', 'CLB-0001');
      
      const buffer = collector.getBuffer();
      expect(buffer).toHaveLength(1);
      expect(buffer[0].type).toBe('game_created');
      expect(buffer[0].data.managerNameLength).toBe(12);
    });

    it('should record match simulation events', () => {
      collector.recordMatchSimulated(2500, 2, 1, 15);
      
      const buffer = collector.getBuffer();
      expect(buffer).toHaveLength(1);
      
      const event = buffer[0];
      expect(event.type).toBe('match_simulated');
      expect(event.data.simulationDuration).toBe(2500);
      expect(event.data.homeScore).toBe(2);
      expect(event.data.awayScore).toBe(1);
      expect(event.data.eventCount).toBe(15);
      expect(event.data.totalGoals).toBe(3);
    });

    it('should record tactic changes', () => {
      const fromTactics = { formation: '4-4-2', mentality: 'balanced' };
      const toTactics = { formation: '4-3-3', mentality: 'attacking' };
      
      collector.recordTacticChanged(fromTactics, toTactics);
      
      const buffer = collector.getBuffer();
      expect(buffer).toHaveLength(1);
      
      const event = buffer[0];
      expect(event.type).toBe('tactic_changed');
      expect(event.data.fromFormation).toBe('4-4-2');
      expect(event.data.toFormation).toBe('4-3-3');
      expect(event.data.changed).toContain('formation');
      expect(event.data.changed).toContain('mentality');
    });

    it('should record errors with sanitized stack traces', () => {
      const error = new Error('Test error message');
      error.stack = 'Very long stack trace that should be truncated...'.repeat(10);
      
      collector.recordError(error, { context: 'test' });
      
      const buffer = collector.getBuffer();
      expect(buffer).toHaveLength(1);
      
      const event = buffer[0];
      expect(event.type).toBe('error_occurred');
      expect(event.data.errorType).toBe('Error');
      expect(event.data.errorMessage).toBe('Test error message');
      expect(event.data.stack.length).toBeLessThanOrEqual(200); // Truncated
    });

    it('should record performance metrics', () => {
      collector.recordPerformance('screen_load', 1250, 'ms');
      
      const buffer = collector.getBuffer();
      expect(buffer).toHaveLength(1);
      
      const event = buffer[0];
      expect(event.type).toBe('performance_metric');
      expect(event.data.metric).toBe('screen_load');
      expect(event.data.value).toBe(1250);
      expect(event.data.unit).toBe('ms');
    });
  });

  describe('Buffer Management', () => {
    it('should auto-flush when buffer is full', () => {
      const smallBufferConfig: TelemetryConfig = {
        enabled: true,
        consentGiven: true,
        dataRetentionDays: 30,
        bufferSize: 3, // Small buffer
        autoFlush: false,
        flushInterval: 300000,
      };
      
      const smallBufferCollector = new TelemetryCollector(smallBufferConfig);
      
      // Fill buffer
      smallBufferCollector.recordEvent('app_start');
      smallBufferCollector.recordEvent('screen_viewed');
      smallBufferCollector.recordEvent('match_simulated');
      
      expect(smallBufferCollector.getBuffer()).toHaveLength(0); // Should auto-flush
    });

    it('should export data correctly', () => {
      collector.recordEvent('app_start', { test: 'data' });
      collector.recordEvent('session_end', { duration: 1800 });
      
      const exported = collector.exportData();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveProperty('config');
      expect(parsed).toHaveProperty('events');
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed.config.userId).toBe('[ANONYMIZED]');
      expect(Array.isArray(parsed.events)).toBe(true);
    });

    it('should clear data when requested', () => {
      collector.recordEvent('app_start');
      expect(collector.getBuffer()).toHaveLength(1);
      
      collector.clearData();
      expect(collector.getBuffer()).toHaveLength(0);
    });
  });

  describe('Session Tracking', () => {
    it('should track session metrics', () => {
      collector.startSession();
      collector.recordScreenView('calendar', 1200);
      collector.recordMatchSimulated(2000, 2, 1, 12);
      collector.recordTacticChanged({ formation: '4-4-2' }, { formation: '4-3-3' });
      collector.endSession();
      
      const buffer = collector.getBuffer();
      
      // Should have session start, screen view, match, tactic change, session end
      expect(buffer.length).toBeGreaterThanOrEqual(5);
      
      const sessionEnd = buffer.find(e => e.type === 'session_end');
      expect(sessionEnd).toBeDefined();
      expect(sessionEnd?.data.screenViews).toBe(1);
      expect(sessionEnd?.data.matchesSimulated).toBe(1);
      expect(sessionEnd?.data.tacticsChanged).toBe(1);
    });
  });
});

describe('KPI Calculator', () => {
  let sampleEvents: TelemetryEvent[];

  beforeEach(() => {
    // Generate sample events for testing
    sampleEvents = [
      {
        id: 'evt1',
        type: 'session_start',
        timestamp: '2024-08-01T10:00:00Z',
        sessionId: 'sess1',
        userId: 'user1',
        data: {},
        version: '1.0.0',
      },
      {
        id: 'evt2',
        type: 'session_end',
        timestamp: '2024-08-01T10:30:00Z',
        sessionId: 'sess1',
        userId: 'user1',
        data: { duration: 1800, screenViews: 5, matchesSimulated: 2 },
        version: '1.0.0',
      },
      {
        id: 'evt3',
        type: 'session_start',
        timestamp: '2024-08-02T10:00:00Z',
        sessionId: 'sess2',
        userId: 'user1', // Same user returns next day
        data: {},
        version: '1.0.0',
      },
      {
        id: 'evt4',
        type: 'match_simulated',
        timestamp: '2024-08-01T10:15:00Z',
        sessionId: 'sess1',
        userId: 'user1',
        data: { homeScore: 2, awayScore: 1 },
        version: '1.0.0',
      },
      {
        id: 'evt5',
        type: 'error_occurred',
        timestamp: '2024-08-01T10:20:00Z',
        sessionId: 'sess1',
        userId: 'user1',
        data: { errorType: 'TypeError' },
        version: '1.0.0',
      },
    ];
  });

  describe('Retention Calculation', () => {
    it('should calculate D1 retention correctly', () => {
      const retention = KPICalculator.calculateRetention(sampleEvents);
      
      // User1 returns after 1 day, so D1 retention should be 100%
      expect(retention.d1).toBe(100);
    });

    it('should handle users with single session', () => {
      const singleSessionEvents = sampleEvents.filter(e => e.sessionId === 'sess1');
      const retention = KPICalculator.calculateRetention(singleSessionEvents);
      
      // No return sessions, so retention should be 0
      expect(retention.d1).toBe(0);
      expect(retention.d7).toBe(0);
      expect(retention.d30).toBe(0);
    });

    it('should handle empty events array', () => {
      const retention = KPICalculator.calculateRetention([]);
      
      expect(retention.d1).toBe(0);
      expect(retention.d7).toBe(0);
      expect(retention.d30).toBe(0);
    });
  });

  describe('Session Metrics', () => {
    it('should calculate session duration correctly', () => {
      const sessionMetrics = KPICalculator.calculateSessionMetrics(sampleEvents);
      
      // Session 1: 30 minutes (1800 seconds)
      expect(sessionMetrics.averageDuration).toBe(30);
      expect(sessionMetrics.totalSessions).toBe(1); // Only one completed session
    });

    it('should handle incomplete sessions', () => {
      const incompleteEvents = sampleEvents.filter(e => e.type !== 'session_end');
      const sessionMetrics = KPICalculator.calculateSessionMetrics(incompleteEvents);
      
      expect(sessionMetrics.totalSessions).toBe(0);
      expect(sessionMetrics.averageDuration).toBe(0);
    });
  });

  describe('Engagement Metrics', () => {
    it('should calculate matches per session', () => {
      const engagement = KPICalculator.calculateEngagementMetrics(sampleEvents);
      
      // 1 match in 1 session = 1 match per session
      expect(engagement.matchesPerSession).toBe(1);
    });

    it('should calculate screen views per session', () => {
      // Add screen view events
      const eventsWithScreens = [
        ...sampleEvents,
        {
          id: 'evt6',
          type: 'screen_viewed',
          timestamp: '2024-08-01T10:05:00Z',
          sessionId: 'sess1',
          userId: 'user1',
          data: { screen: 'calendar' },
          version: '1.0.0',
        },
        {
          id: 'evt7',
          type: 'screen_viewed',
          timestamp: '2024-08-01T10:10:00Z',
          sessionId: 'sess1',
          userId: 'user1',
          data: { screen: 'squad' },
          version: '1.0.0',
        },
      ];
      
      const engagement = KPICalculator.calculateEngagementMetrics(eventsWithScreens);
      expect(engagement.screensViewedPerSession).toBe(2);
    });
  });

  describe('Technical Metrics', () => {
    it('should calculate crash rate correctly', () => {
      const technical = KPICalculator.calculateTechnicalMetrics(sampleEvents);
      
      // 1 session with 1 error = 100% crash rate
      expect(technical.crashRate).toBe(100);
    });

    it('should calculate performance score', () => {
      const technical = KPICalculator.calculateTechnicalMetrics(sampleEvents);
      
      // Should penalize for high crash rate
      expect(technical.performanceScore).toBeLessThan(100);
    });

    it('should handle sessions without errors', () => {
      const cleanEvents = sampleEvents.filter(e => e.type !== 'error_occurred');
      const technical = KPICalculator.calculateTechnicalMetrics(cleanEvents);
      
      expect(technical.crashRate).toBe(0);
      expect(technical.performanceScore).toBe(100);
    });
  });

  describe('Complete KPI Calculation', () => {
    it('should calculate all KPIs without errors', () => {
      const kpis = KPICalculator.calculateAllKPIs(sampleEvents);
      
      expect(kpis).toHaveProperty('d1Retention');
      expect(kpis).toHaveProperty('d7Retention');
      expect(kpis).toHaveProperty('d30Retention');
      expect(kpis).toHaveProperty('averageSessionDuration');
      expect(kpis).toHaveProperty('sessionsPerUser');
      expect(kpis).toHaveProperty('matchesPerSession');
      expect(kpis).toHaveProperty('tacticsChangesPerSession');
      expect(kpis).toHaveProperty('screensViewedPerSession');
      expect(kpis).toHaveProperty('crashRate');
      expect(kpis).toHaveProperty('averageLoadTime');
      expect(kpis).toHaveProperty('performanceScore');
      
      // All values should be numbers
      Object.values(kpis).forEach(value => {
        expect(typeof value).toBe('number');
        expect(isNaN(value)).toBe(false);
      });
    });

    it('should handle edge cases gracefully', () => {
      expect(() => KPICalculator.calculateAllKPIs([])).not.toThrow();
      
      const emptyKPIs = KPICalculator.calculateAllKPIs([]);
      Object.values(emptyKPIs).forEach(value => {
        expect(typeof value).toBe('number');
        expect(isNaN(value)).toBe(false);
      });
    });
  });

  describe('Data Export and Privacy', () => {
    it('should export data with privacy protection', () => {
      collector.recordEvent('game_created', { 
        managerName: 'Secret Name',
        clubId: 'CLB-0001' 
      });
      
      const exported = collector.exportData();
      const parsed = JSON.parse(exported);
      
      expect(parsed.config.userId).toBe('[ANONYMIZED]');
      expect(parsed.events[0].data.managerName).toBe('[LENGTH:11]');
      expect(parsed.events[0].data.clubId).not.toBe('CLB-0001');
    });

    it('should include metadata in export', () => {
      collector.recordEvent('app_start');
      
      const exported = collector.exportData();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('totalEvents');
      expect(parsed.totalEvents).toBe(1);
    });
  });
});
