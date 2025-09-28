// Opt-in telemetry system with privacy controls

import { z } from 'zod';
import CryptoJS from 'crypto-js';

// Event schemas for telemetry
export const TelemetryEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    'app_start',
    'app_close',
    'session_start',
    'session_end',
    'game_created',
    'game_loaded',
    'game_saved',
    'match_simulated',
    'tactic_changed',
    'screen_viewed',
    'error_occurred',
    'performance_metric',
    'user_action',
  ]),
  timestamp: z.string(),
  sessionId: z.string(),
  userId: z.string().optional(), // Anonymous hash
  data: z.record(z.any()),
  version: z.string(),
});

export const TelemetryConfigSchema = z.object({
  enabled: z.boolean(),
  userId: z.string().optional(),
  consentGiven: z.boolean(),
  consentDate: z.string().optional(),
  dataRetentionDays: z.number().default(30),
  bufferSize: z.number().default(1000),
  autoFlush: z.boolean().default(true),
  flushInterval: z.number().default(300000), // 5 minutes
});

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;
export type TelemetryConfig = z.infer<typeof TelemetryConfigSchema>;

export interface TelemetryKPIs {
  // Retention metrics
  d1Retention: number; // % of users who return after 1 day
  d7Retention: number; // % of users who return after 7 days
  d30Retention: number; // % of users who return after 30 days
  
  // Session metrics
  averageSessionDuration: number; // minutes
  sessionsPerUser: number;
  
  // Engagement metrics
  matchesPerSession: number;
  tacticsChangesPerSession: number;
  screensViewedPerSession: number;
  
  // Technical metrics
  crashRate: number; // % of sessions with errors
  averageLoadTime: number; // ms
  performanceScore: number; // 0-100
  
  // Feature adoption
  assistantUsageRate: number; // % of users who use assistant
  keyboardShortcutUsage: number; // % of actions via keyboard
  saveGameFrequency: number; // saves per session
}

export class TelemetryCollector {
  private config: TelemetryConfig;
  private buffer: TelemetryEvent[] = [];
  private sessionId: string;
  private currentSession: {
    startTime: Date;
    screenViews: number;
    matchesSimulated: number;
    tacticsChanged: number;
    errors: number;
  };
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: TelemetryConfig) {
    this.config = TelemetryConfigSchema.parse(config);
    this.sessionId = this.generateSessionId();
    this.currentSession = {
      startTime: new Date(),
      screenViews: 0,
      matchesSimulated: 0,
      tacticsChanged: 0,
      errors: 0,
    };

    if (this.config.enabled && this.config.autoFlush) {
      this.startAutoFlush();
    }
  }

  /**
   * Record a telemetry event (only if consent given)
   */
  recordEvent(type: TelemetryEvent['type'], data: Record<string, any> = {}): void {
    if (!this.config.enabled || !this.config.consentGiven) {
      return;
    }

    const event: TelemetryEvent = {
      id: this.generateEventId(),
      type,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.config.userId,
      data: this.sanitizeData(data),
      version: '1.0.0',
    };

    this.buffer.push(event);
    this.updateSessionMetrics(type, data);

    // Auto-flush if buffer is full
    if (this.buffer.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  /**
   * Record session start
   */
  startSession(): void {
    this.recordEvent('session_start', {
      platform: this.getPlatform(),
      locale: this.getLocale(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }

  /**
   * Record session end with metrics
   */
  endSession(): void {
    const duration = Date.now() - this.currentSession.startTime.getTime();
    
    this.recordEvent('session_end', {
      duration: Math.round(duration / 1000), // seconds
      screenViews: this.currentSession.screenViews,
      matchesSimulated: this.currentSession.matchesSimulated,
      tacticsChanged: this.currentSession.tacticsChanged,
      errors: this.currentSession.errors,
    });

    this.flush();
  }

  /**
   * Record game creation
   */
  recordGameCreated(managerName: string, clubId: string): void {
    this.recordEvent('game_created', {
      clubId: this.hashString(clubId), // Anonymize
      managerNameLength: managerName.length, // Don't store actual name
    });
  }

  /**
   * Record match simulation
   */
  recordMatchSimulated(duration: number, homeScore: number, awayScore: number, events: number): void {
    this.recordEvent('match_simulated', {
      simulationDuration: duration,
      homeScore,
      awayScore,
      eventCount: events,
      totalGoals: homeScore + awayScore,
    });

    this.currentSession.matchesSimulated++;
  }

  /**
   * Record tactic change
   */
  recordTacticChanged(from: any, to: any): void {
    this.recordEvent('tactic_changed', {
      fromFormation: from.formation,
      toFormation: to.formation,
      fromMentality: from.mentality,
      toMentality: to.mentality,
      changed: this.getTacticsChanges(from, to),
    });

    this.currentSession.tacticsChanged++;
  }

  /**
   * Record screen view
   */
  recordScreenView(screenName: string, loadTime?: number): void {
    this.recordEvent('screen_viewed', {
      screen: screenName,
      loadTime,
      navigationMethod: 'unknown', // Could track if via keyboard/mouse
    });

    this.currentSession.screenViews++;
  }

  /**
   * Record error/crash
   */
  recordError(error: Error, context: Record<string, any> = {}): void {
    this.recordEvent('error_occurred', {
      errorType: error.name,
      errorMessage: error.message.substring(0, 100), // Truncate for privacy
      stack: error.stack?.substring(0, 200), // Truncated stack trace
      context: this.sanitizeData(context),
    });

    this.currentSession.errors++;
  }

  /**
   * Record performance metric
   */
  recordPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.recordEvent('performance_metric', {
      metric,
      value,
      unit,
    });
  }

  /**
   * Get current buffer for manual export
   */
  getBuffer(): TelemetryEvent[] {
    return [...this.buffer];
  }

  /**
   * Flush buffer to storage/export
   */
  flush(): void {
    if (this.buffer.length === 0) return;

    // In a real implementation, this would send to analytics service
    // For now, we store locally for manual export
    this.saveToLocalStorage();
    this.buffer = [];
  }

  /**
   * Export telemetry data as JSON
   */
  exportData(): string {
    const exportData = {
      config: {
        ...this.config,
        userId: this.config.userId ? '[ANONYMIZED]' : undefined,
      },
      events: this.getStoredEvents(),
      exportedAt: new Date().toISOString(),
      totalEvents: this.getStoredEvents().length,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clear all stored telemetry data
   */
  clearData(): void {
    this.buffer = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('managerx-telemetry');
    }
  }

  /**
   * Update consent status
   */
  updateConsent(consentGiven: boolean): void {
    this.config.consentGiven = consentGiven;
    this.config.consentDate = new Date().toISOString();
    
    if (!consentGiven) {
      this.clearData();
    }
    
    this.saveConfig();
  }

  /**
   * Disable telemetry completely
   */
  disable(): void {
    this.config.enabled = false;
    this.config.consentGiven = false;
    this.clearData();
    this.saveConfig();
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  // Private methods

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashString(input: string): string {
    return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex).substring(0, 8);
  }

  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      // Remove potentially sensitive data
      if (key.toLowerCase().includes('name') && typeof value === 'string') {
        sanitized[key] = `[LENGTH:${value.length}]`;
      } else if (key.toLowerCase().includes('id') && typeof value === 'string') {
        sanitized[key] = this.hashString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }

  private updateSessionMetrics(type: string, data: any): void {
    switch (type) {
      case 'match_simulated':
        this.currentSession.matchesSimulated++;
        break;
      case 'tactic_changed':
        this.currentSession.tacticsChanged++;
        break;
      case 'screen_viewed':
        this.currentSession.screenViews++;
        break;
      case 'error_occurred':
        this.currentSession.errors++;
        break;
    }
  }

  private getTacticsChanges(from: any, to: any): string[] {
    const changes: string[] = [];
    
    Object.keys(from).forEach(key => {
      if (from[key] !== to[key]) {
        changes.push(key);
      }
    });
    
    return changes;
  }

  private getPlatform(): string {
    if (typeof window !== 'undefined') {
      return window.navigator.platform || 'unknown';
    }
    return 'desktop';
  }

  private getLocale(): string {
    if (typeof window !== 'undefined') {
      return window.navigator.language || 'unknown';
    }
    return 'pt-BR';
  }

  private saveToLocalStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const existing = this.getStoredEvents();
      const combined = [...existing, ...this.buffer];
      
      // Keep only recent events (respect retention period)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.dataRetentionDays);
      
      const filtered = combined.filter(event => 
        new Date(event.timestamp) > cutoffDate
      );

      localStorage.setItem('managerx-telemetry', JSON.stringify(filtered));
    } catch (error) {
      console.warn('Failed to save telemetry data:', error);
    }
  }

  private getStoredEvents(): TelemetryEvent[] {
    if (typeof localStorage === 'undefined') return [];

    try {
      const stored = localStorage.getItem('managerx-telemetry');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load telemetry data:', error);
      return [];
    }
  }

  private saveConfig(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem('managerx-telemetry-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save telemetry config:', error);
    }
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }
}

/**
 * KPI Calculator for analytics dashboard
 */
export class KPICalculator {
  /**
   * Calculate retention metrics
   */
  static calculateRetention(events: TelemetryEvent[]): {
    d1: number;
    d7: number;
    d30: number;
  } {
    const userSessions = new Map<string, Date[]>();
    
    // Group sessions by user
    events
      .filter(e => e.type === 'session_start' && e.userId)
      .forEach(event => {
        const userId = event.userId!;
        const date = new Date(event.timestamp);
        
        if (!userSessions.has(userId)) {
          userSessions.set(userId, []);
        }
        userSessions.get(userId)!.push(date);
      });

    let d1Retained = 0;
    let d7Retained = 0;
    let d30Retained = 0;
    let totalUsers = 0;

    userSessions.forEach((sessions, userId) => {
      if (sessions.length < 2) return; // Need at least 2 sessions
      
      totalUsers++;
      const sortedSessions = sessions.sort((a, b) => a.getTime() - b.getTime());
      const firstSession = sortedSessions[0];
      
      // Check if user returned within each period
      const hasD1Return = sortedSessions.some(session => 
        session.getTime() - firstSession.getTime() >= 24 * 60 * 60 * 1000 &&
        session.getTime() - firstSession.getTime() <= 48 * 60 * 60 * 1000
      );
      
      const hasD7Return = sortedSessions.some(session => 
        session.getTime() - firstSession.getTime() >= 7 * 24 * 60 * 60 * 1000 &&
        session.getTime() - firstSession.getTime() <= 14 * 24 * 60 * 60 * 1000
      );
      
      const hasD30Return = sortedSessions.some(session => 
        session.getTime() - firstSession.getTime() >= 30 * 24 * 60 * 60 * 1000
      );

      if (hasD1Return) d1Retained++;
      if (hasD7Return) d7Retained++;
      if (hasD30Return) d30Retained++;
    });

    return {
      d1: totalUsers > 0 ? (d1Retained / totalUsers) * 100 : 0,
      d7: totalUsers > 0 ? (d7Retained / totalUsers) * 100 : 0,
      d30: totalUsers > 0 ? (d30Retained / totalUsers) * 100 : 0,
    };
  }

  /**
   * Calculate session metrics
   */
  static calculateSessionMetrics(events: TelemetryEvent[]): {
    averageDuration: number;
    sessionsPerUser: number;
    totalSessions: number;
  } {
    const sessions = new Map<string, { start: Date; end?: Date; userId?: string }>();
    
    events.forEach(event => {
      if (event.type === 'session_start') {
        sessions.set(event.sessionId, {
          start: new Date(event.timestamp),
          userId: event.userId,
        });
      } else if (event.type === 'session_end') {
        const session = sessions.get(event.sessionId);
        if (session) {
          session.end = new Date(event.timestamp);
        }
      }
    });

    const completedSessions = Array.from(sessions.values()).filter(s => s.end);
    const durations = completedSessions.map(s => s.end!.getTime() - s.start.getTime());
    const averageDuration = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length / (1000 * 60) // minutes
      : 0;

    // Calculate sessions per user
    const userSessions = new Map<string, number>();
    completedSessions.forEach(session => {
      if (session.userId) {
        userSessions.set(session.userId, (userSessions.get(session.userId) || 0) + 1);
      }
    });

    const sessionsPerUser = userSessions.size > 0
      ? Array.from(userSessions.values()).reduce((sum, count) => sum + count, 0) / userSessions.size
      : 0;

    return {
      averageDuration,
      sessionsPerUser,
      totalSessions: completedSessions.length,
    };
  }

  /**
   * Calculate engagement metrics
   */
  static calculateEngagementMetrics(events: TelemetryEvent[]): {
    matchesPerSession: number;
    tacticsChangesPerSession: number;
    screensViewedPerSession: number;
  } {
    const sessionMetrics = new Map<string, {
      matches: number;
      tactics: number;
      screens: number;
    }>();

    events.forEach(event => {
      if (!sessionMetrics.has(event.sessionId)) {
        sessionMetrics.set(event.sessionId, { matches: 0, tactics: 0, screens: 0 });
      }

      const metrics = sessionMetrics.get(event.sessionId)!;
      
      switch (event.type) {
        case 'match_simulated':
          metrics.matches++;
          break;
        case 'tactic_changed':
          metrics.tactics++;
          break;
        case 'screen_viewed':
          metrics.screens++;
          break;
      }
    });

    const sessions = Array.from(sessionMetrics.values());
    const sessionCount = sessions.length;

    return {
      matchesPerSession: sessionCount > 0 
        ? sessions.reduce((sum, s) => sum + s.matches, 0) / sessionCount 
        : 0,
      tacticsChangesPerSession: sessionCount > 0 
        ? sessions.reduce((sum, s) => sum + s.tactics, 0) / sessionCount 
        : 0,
      screensViewedPerSession: sessionCount > 0 
        ? sessions.reduce((sum, s) => sum + s.screens, 0) / sessionCount 
        : 0,
    };
  }

  /**
   * Calculate technical metrics
   */
  static calculateTechnicalMetrics(events: TelemetryEvent[]): {
    crashRate: number;
    averageLoadTime: number;
    performanceScore: number;
  } {
    const sessions = new Set(events.map(e => e.sessionId));
    const sessionsWithErrors = new Set(
      events.filter(e => e.type === 'error_occurred').map(e => e.sessionId)
    );

    const crashRate = sessions.size > 0 
      ? (sessionsWithErrors.size / sessions.size) * 100 
      : 0;

    const loadTimeEvents = events.filter(e => 
      e.type === 'screen_viewed' && e.data.loadTime
    );
    const averageLoadTime = loadTimeEvents.length > 0
      ? loadTimeEvents.reduce((sum, e) => sum + e.data.loadTime, 0) / loadTimeEvents.length
      : 0;

    // Performance score based on load times and error rate
    let performanceScore = 100;
    if (averageLoadTime > 2000) performanceScore -= 20; // Slow loading
    if (averageLoadTime > 5000) performanceScore -= 30; // Very slow
    if (crashRate > 5) performanceScore -= 25; // High error rate
    if (crashRate > 15) performanceScore -= 40; // Very high error rate

    return {
      crashRate,
      averageLoadTime,
      performanceScore: Math.max(0, performanceScore),
    };
  }

  /**
   * Calculate all KPIs
   */
  static calculateAllKPIs(events: TelemetryEvent[]): TelemetryKPIs {
    const retention = this.calculateRetention(events);
    const sessionMetrics = this.calculateSessionMetrics(events);
    const engagement = this.calculateEngagementMetrics(events);
    const technical = this.calculateTechnicalMetrics(events);

    // Feature adoption metrics
    const totalSessions = sessionMetrics.totalSessions;
    const assistantUsageEvents = events.filter(e => 
      e.type === 'user_action' && e.data.action?.includes('assistant')
    ).length;
    const keyboardEvents = events.filter(e => 
      e.type === 'user_action' && e.data.method === 'keyboard'
    ).length;
    const saveEvents = events.filter(e => e.type === 'game_saved').length;

    return {
      d1Retention: retention.d1,
      d7Retention: retention.d7,
      d30Retention: retention.d30,
      averageSessionDuration: sessionMetrics.averageDuration,
      sessionsPerUser: sessionMetrics.sessionsPerUser,
      matchesPerSession: engagement.matchesPerSession,
      tacticsChangesPerSession: engagement.tacticsChangesPerSession,
      screensViewedPerSession: engagement.screensViewedPerSession,
      crashRate: technical.crashRate,
      averageLoadTime: technical.averageLoadTime,
      performanceScore: technical.performanceScore,
      assistantUsageRate: totalSessions > 0 ? (assistantUsageEvents / totalSessions) * 100 : 0,
      keyboardShortcutUsage: totalSessions > 0 ? (keyboardEvents / totalSessions) * 100 : 0,
      saveGameFrequency: totalSessions > 0 ? saveEvents / totalSessions : 0,
    };
  }
}
