// React hook for telemetry integration

import { useEffect, useRef } from 'react';
import { getTelemetryCollector } from '@managerx/analytics';
import type { TelemetryCollector } from '@managerx/analytics';

export function useTelemetry() {
  const collectorRef = useRef<TelemetryCollector | null>(null);

  useEffect(() => {
    collectorRef.current = getTelemetryCollector();
    
    // Record app start
    collectorRef.current.recordEvent('app_start', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
    });

    // Set up error handling
    const handleError = (event: ErrorEvent) => {
      collectorRef.current?.recordError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      collectorRef.current?.recordError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        type: 'unhandled_promise_rejection',
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Record app close on beforeunload
    const handleBeforeUnload = () => {
      collectorRef.current?.recordEvent('app_close');
      collectorRef.current?.endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      collectorRef.current?.endSession();
    };
  }, []);

  return {
    recordEvent: (type: any, data?: any) => {
      collectorRef.current?.recordEvent(type, data);
    },
    
    recordScreenView: (screenName: string, loadTime?: number) => {
      collectorRef.current?.recordScreenView(screenName, loadTime);
    },
    
    recordMatchSimulated: (duration: number, homeScore: number, awayScore: number, events: number) => {
      collectorRef.current?.recordMatchSimulated(duration, homeScore, awayScore, events);
    },
    
    recordTacticChanged: (from: any, to: any) => {
      collectorRef.current?.recordTacticChanged(from, to);
    },
    
    recordPerformance: (metric: string, value: number, unit?: string) => {
      collectorRef.current?.recordPerformance(metric, value, unit);
    },
    
    recordError: (error: Error, context?: any) => {
      collectorRef.current?.recordError(error, context);
    },
  };
}

/**
 * Hook for tracking screen view performance
 */
export function useScreenViewTracking(screenName: string) {
  const { recordScreenView, recordPerformance } = useTelemetry();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    
    return () => {
      const loadTime = Date.now() - startTimeRef.current;
      recordScreenView(screenName, loadTime);
      recordPerformance(`screen_load_${screenName}`, loadTime, 'ms');
    };
  }, [screenName, recordScreenView, recordPerformance]);
}

/**
 * Hook for tracking user actions
 */
export function useActionTracking() {
  const { recordEvent } = useTelemetry();

  return {
    trackClick: (element: string, method: 'mouse' | 'keyboard' = 'mouse') => {
      recordEvent('user_action', {
        action: 'click',
        element,
        method,
      });
    },
    
    trackNavigation: (from: string, to: string, method: 'mouse' | 'keyboard' = 'mouse') => {
      recordEvent('user_action', {
        action: 'navigation',
        from,
        to,
        method,
      });
    },
    
    trackFeatureUsage: (feature: string, context?: any) => {
      recordEvent('user_action', {
        action: 'feature_usage',
        feature,
        context,
      });
    },
  };
}
