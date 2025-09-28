// Analytics package main exports

export { 
  TelemetryCollector, 
  KPICalculator,
  type TelemetryEvent,
  type TelemetryConfig,
  type TelemetryKPIs,
} from './telemetry.js';

export {
  DashboardGenerator,
  type DashboardData,
} from './dashboard.js';

export {
  AutoTuningEngine,
  BalanceCodeGenerator,
  type BalanceParameter,
  type TuningRecommendation,
  type TuningReport,
} from './auto-tuning.js';

// Create default telemetry collector instance
let defaultCollector: TelemetryCollector | null = null;

/**
 * Get or create default telemetry collector
 */
export function getTelemetryCollector(): TelemetryCollector {
  if (!defaultCollector) {
    // Load config from localStorage or use defaults
    const defaultConfig = {
      enabled: false, // Disabled by default - requires opt-in
      consentGiven: false,
      dataRetentionDays: 30,
      bufferSize: 1000,
      autoFlush: true,
      flushInterval: 300000, // 5 minutes
    };

    defaultCollector = new TelemetryCollector(defaultConfig);
  }
  
  return defaultCollector;
}

/**
 * Initialize telemetry with user consent
 */
export function initializeTelemetry(consentGiven: boolean): TelemetryCollector {
  const collector = getTelemetryCollector();
  collector.updateConsent(consentGiven);
  
  if (consentGiven) {
    collector.startSession();
  }
  
  return collector;
}

/**
 * Disable telemetry completely
 */
export function disableTelemetry(): void {
  const collector = getTelemetryCollector();
  collector.disable();
  defaultCollector = null;
}

/**
 * Export telemetry data for user
 */
export function exportTelemetryData(): string {
  const collector = getTelemetryCollector();
  return collector.exportData();
}

/**
 * Clear all telemetry data
 */
export function clearTelemetryData(): void {
  const collector = getTelemetryCollector();
  collector.clearData();
}
