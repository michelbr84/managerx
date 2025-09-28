// Automated balancing and tuning system

import type { TelemetryEvent, TelemetryKPIs } from './telemetry.js';
import { KPICalculator } from './telemetry.js';

export interface BalanceParameter {
  id: string;
  name: string;
  currentValue: number;
  minValue: number;
  maxValue: number;
  step: number;
  category: 'simulation' | 'ui' | 'gameplay' | 'economy';
  description: string;
  impactMetrics: string[]; // Which KPIs this parameter affects
}

export interface TuningRecommendation {
  parameterId: string;
  currentValue: number;
  recommendedValue: number;
  confidence: number; // 0-100
  reasoning: string;
  expectedImpact: string;
  priority: 'low' | 'medium' | 'high';
  dataPoints: number; // How many data points support this change
}

export interface TuningReport {
  generatedAt: string;
  period: { start: string; end: string };
  dataQuality: {
    totalEvents: number;
    uniqueUsers: number;
    sessionsAnalyzed: number;
    confidence: 'low' | 'medium' | 'high';
  };
  recommendations: TuningRecommendation[];
  appliedChanges: Array<{
    parameter: string;
    oldValue: number;
    newValue: number;
    reason: string;
  }>;
  kpiTrends: {
    current: TelemetryKPIs;
    previous?: TelemetryKPIs;
    changes: Record<string, number>;
  };
}

export class AutoTuningEngine {
  private parameters: BalanceParameter[] = [
    // Simulation parameters
    {
      id: 'sim_base_event_probability',
      name: 'Base Event Probability',
      currentValue: 0.15,
      minValue: 0.10,
      maxValue: 0.25,
      step: 0.01,
      category: 'simulation',
      description: 'Base probability of events per simulation tick',
      impactMetrics: ['matchesPerSession', 'averageSessionDuration'],
    },
    {
      id: 'sim_goal_to_shot_ratio',
      name: 'Goal to Shot Ratio',
      currentValue: 0.12,
      minValue: 0.08,
      maxValue: 0.18,
      step: 0.01,
      category: 'simulation',
      description: 'Percentage of shots that result in goals',
      impactMetrics: ['matchesPerSession'],
    },
    {
      id: 'sim_home_advantage',
      name: 'Home Advantage',
      currentValue: 0.1,
      minValue: 0.05,
      maxValue: 0.2,
      step: 0.01,
      category: 'simulation',
      description: 'Home team advantage multiplier',
      impactMetrics: ['matchesPerSession'],
    },
    
    // UI parameters
    {
      id: 'ui_auto_save_interval',
      name: 'Auto Save Interval',
      currentValue: 300000, // 5 minutes
      minValue: 60000,   // 1 minute
      maxValue: 900000,  // 15 minutes
      step: 60000,       // 1 minute steps
      category: 'ui',
      description: 'Automatic save interval in milliseconds',
      impactMetrics: ['saveGameFrequency', 'crashRate'],
    },
    {
      id: 'ui_assistant_suggestion_frequency',
      name: 'Assistant Suggestion Frequency',
      currentValue: 0.3,
      minValue: 0.1,
      maxValue: 0.6,
      step: 0.05,
      category: 'ui',
      description: 'Frequency of assistant suggestions',
      impactMetrics: ['assistantUsageRate', 'averageSessionDuration'],
    },
    
    // Gameplay parameters
    {
      id: 'gameplay_stamina_drain_rate',
      name: 'Stamina Drain Rate',
      currentValue: 1.0,
      minValue: 0.7,
      maxValue: 1.5,
      step: 0.1,
      category: 'gameplay',
      description: 'Base stamina drain rate multiplier',
      impactMetrics: ['tacticsChangesPerSession'],
    },
    {
      id: 'gameplay_morale_impact',
      name: 'Morale Impact Factor',
      currentValue: 0.1,
      minValue: 0.05,
      maxValue: 0.2,
      step: 0.01,
      category: 'gameplay',
      description: 'How much morale affects player performance',
      impactMetrics: ['matchesPerSession'],
    },
  ];

  /**
   * Analyze telemetry data and generate tuning recommendations
   */
  generateTuningRecommendations(
    events: TelemetryEvent[],
    previousKPIs?: TelemetryKPIs
  ): TuningReport {
    const currentKPIs = KPICalculator.calculateAllKPIs(events);
    const dataQuality = this.assessDataQuality(events);
    
    const recommendations: TuningRecommendation[] = [];
    
    // Only generate recommendations if we have sufficient data
    if (dataQuality.confidence !== 'low') {
      recommendations.push(...this.analyzeRetentionMetrics(currentKPIs, previousKPIs));
      recommendations.push(...this.analyzeEngagementMetrics(currentKPIs, previousKPIs));
      recommendations.push(...this.analyzeTechnicalMetrics(currentKPIs, previousKPIs));
      recommendations.push(...this.analyzeFeatureAdoption(currentKPIs, previousKPIs));
    }

    // Calculate KPI changes
    const kpiChanges: Record<string, number> = {};
    if (previousKPIs) {
      Object.keys(currentKPIs).forEach(key => {
        const current = (currentKPIs as any)[key];
        const previous = (previousKPIs as any)[key];
        if (typeof current === 'number' && typeof previous === 'number') {
          kpiChanges[key] = current - previous;
        }
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      period: this.getAnalysisPeriod(events),
      dataQuality,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      appliedChanges: [], // Would be populated when changes are applied
      kpiTrends: {
        current: currentKPIs,
        previous: previousKPIs,
        changes: kpiChanges,
      },
    };
  }

  /**
   * Apply tuning recommendations automatically
   */
  applyAutomaticTuning(recommendations: TuningRecommendation[]): {
    applied: TuningRecommendation[];
    skipped: Array<{ recommendation: TuningRecommendation; reason: string }>;
  } {
    const applied: TuningRecommendation[] = [];
    const skipped: Array<{ recommendation: TuningRecommendation; reason: string }> = [];

    recommendations.forEach(rec => {
      // Only apply high-confidence, low-risk changes automatically
      if (rec.confidence > 80 && rec.priority !== 'high') {
        const parameter = this.parameters.find(p => p.id === rec.parameterId);
        
        if (parameter) {
          // Validate the change is within bounds
          if (rec.recommendedValue >= parameter.minValue && 
              rec.recommendedValue <= parameter.maxValue) {
            
            parameter.currentValue = rec.recommendedValue;
            applied.push(rec);
          } else {
            skipped.push({ 
              recommendation: rec, 
              reason: 'Value outside allowed bounds' 
            });
          }
        } else {
          skipped.push({ 
            recommendation: rec, 
            reason: 'Parameter not found' 
          });
        }
      } else {
        skipped.push({ 
          recommendation: rec, 
          reason: `Low confidence (${rec.confidence}%) or high priority` 
        });
      }
    });

    return { applied, skipped };
  }

  /**
   * Generate PR content for automatic tuning
   */
  generatePRContent(report: TuningReport, appliedChanges: TuningRecommendation[]): {
    title: string;
    body: string;
    branch: string;
  } {
    const date = new Date().toISOString().split('T')[0];
    const branch = `chore/balance-weekly-tuning-${date}`;
    
    const title = `chore(balance): weekly tuning ${date}`;
    
    const body = `# Weekly Auto-Tuning Report

**Período de Análise**: ${new Date(report.period.start).toLocaleDateString('pt-BR')} - ${new Date(report.period.end).toLocaleDateString('pt-BR')}  
**Qualidade dos Dados**: ${report.dataQuality.confidence} (${report.dataQuality.totalEvents} eventos, ${report.dataQuality.uniqueUsers} usuários)

## Mudanças Aplicadas

${appliedChanges.length > 0 ? appliedChanges.map(change => 
  `### ${this.parameters.find(p => p.id === change.parameterId)?.name || change.parameterId}
- **Valor anterior**: ${change.currentValue}
- **Novo valor**: ${change.recommendedValue}
- **Confiança**: ${change.confidence}%
- **Razão**: ${change.reasoning}
- **Impacto esperado**: ${change.expectedImpact}`
).join('\n\n') : '*Nenhuma mudança automática aplicada nesta semana*'}

## KPIs Atuais

| Métrica | Valor Atual | Mudança |
|---------|-------------|---------|
${Object.entries(report.kpiTrends.current).map(([key, value]) => {
  const change = report.kpiTrends.changes[key];
  const changeStr = change !== undefined ? 
    (change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1)) : 'N/A';
  const changeIcon = change !== undefined ?
    (change > 0 ? '📈' : change < 0 ? '📉' : '➡️') : '';
  
  return `| ${key} | ${typeof value === 'number' ? value.toFixed(1) : value} | ${changeStr} ${changeIcon} |`;
}).join('\n')}

## Recomendações Não Aplicadas

${report.recommendations.filter(r => !appliedChanges.find(a => a.parameterId === r.parameterId)).map(rec => 
  `- **${this.parameters.find(p => p.id === rec.parameterId)?.name}**: ${rec.reasoning} (Confiança: ${rec.confidence}%)`
).join('\n')}

## Próximos Passos

1. Monitorar impacto das mudanças nos próximos 7 dias
2. Revisar recomendações de alta prioridade manualmente
3. Considerar A/B testing para mudanças significativas

---

*Relatório gerado automaticamente pelo sistema de auto-tuning ManagerX*  
*Baseado em dados anonimizados e agregados de usuários que consentiram com telemetria*`;

    return { title, body, branch };
  }

  // Private analysis methods

  private analyzeRetentionMetrics(current: TelemetryKPIs, previous?: TelemetryKPIs): TuningRecommendation[] {
    const recommendations: TuningRecommendation[] = [];

    // Low D1 retention - make game more engaging initially
    if (current.d1Retention < 40) {
      recommendations.push({
        parameterId: 'ui_assistant_suggestion_frequency',
        currentValue: 0.3,
        recommendedValue: 0.4,
        confidence: 75,
        reasoning: 'Increase assistant help for new users',
        expectedImpact: 'Better initial experience, higher D1 retention',
        priority: 'medium',
        dataPoints: Math.floor(current.d1Retention * 10),
      });
    }

    // Low D7 retention - adjust core gameplay
    if (current.d7Retention < 30) {
      recommendations.push({
        parameterId: 'sim_base_event_probability',
        currentValue: 0.15,
        recommendedValue: 0.18,
        confidence: 70,
        reasoning: 'More match events for engagement',
        expectedImpact: 'More exciting matches, better retention',
        priority: 'medium',
        dataPoints: Math.floor(current.d7Retention * 10),
      });
    }

    return recommendations;
  }

  private analyzeEngagementMetrics(current: TelemetryKPIs, previous?: TelemetryKPIs): TuningRecommendation[] {
    const recommendations: TuningRecommendation[] = [];

    // Low matches per session
    if (current.matchesPerSession < 1.5) {
      recommendations.push({
        parameterId: 'sim_base_event_probability',
        currentValue: 0.15,
        recommendedValue: 0.17,
        confidence: 65,
        reasoning: 'Faster matches to encourage more play',
        expectedImpact: 'Shorter, more engaging matches',
        priority: 'low',
        dataPoints: Math.floor(current.matchesPerSession * 100),
      });
    }

    // Too many tactic changes (overwhelming)
    if (current.tacticsChangesPerSession > 5) {
      recommendations.push({
        parameterId: 'ui_assistant_suggestion_frequency',
        currentValue: 0.3,
        recommendedValue: 0.25,
        confidence: 60,
        reasoning: 'Reduce overwhelming tactical suggestions',
        expectedImpact: 'Less decision fatigue',
        priority: 'low',
        dataPoints: Math.floor(current.tacticsChangesPerSession * 20),
      });
    }

    return recommendations;
  }

  private analyzeTechnicalMetrics(current: TelemetryKPIs, previous?: TelemetryKPIs): TuningRecommendation[] {
    const recommendations: TuningRecommendation[] = [];

    // High crash rate
    if (current.crashRate > 5) {
      recommendations.push({
        parameterId: 'ui_auto_save_interval',
        currentValue: 300000,
        recommendedValue: 180000, // 3 minutes
        confidence: 90,
        reasoning: 'More frequent saves due to crashes',
        expectedImpact: 'Reduce data loss from crashes',
        priority: 'high',
        dataPoints: Math.floor(current.crashRate * 20),
      });
    }

    // Slow load times
    if (current.averageLoadTime > 2500) {
      // This would typically require code changes, not parameter tuning
      // But we can adjust UI behavior
      recommendations.push({
        parameterId: 'ui_assistant_suggestion_frequency',
        currentValue: 0.3,
        recommendedValue: 0.2,
        confidence: 70,
        reasoning: 'Reduce UI load to improve performance',
        expectedImpact: 'Faster screen transitions',
        priority: 'medium',
        dataPoints: Math.floor(current.averageLoadTime / 100),
      });
    }

    return recommendations;
  }

  private analyzeFeatureAdoption(current: TelemetryKPIs, previous?: TelemetryKPIs): TuningRecommendation[] {
    const recommendations: TuningRecommendation[] = [];

    // Low assistant usage
    if (current.assistantUsageRate < 30) {
      recommendations.push({
        parameterId: 'ui_assistant_suggestion_frequency',
        currentValue: 0.3,
        recommendedValue: 0.35,
        confidence: 65,
        reasoning: 'Increase visibility of assistant features',
        expectedImpact: 'Higher feature adoption',
        priority: 'low',
        dataPoints: Math.floor(current.assistantUsageRate * 5),
      });
    }

    return recommendations;
  }

  private assessDataQuality(events: TelemetryEvent[]): TuningReport['dataQuality'] {
    const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId)).size;
    const uniqueSessions = new Set(events.map(e => e.sessionId)).size;
    
    let confidence: 'low' | 'medium' | 'high' = 'low';
    
    if (events.length > 1000 && uniqueUsers > 10 && uniqueSessions > 50) {
      confidence = 'high';
    } else if (events.length > 500 && uniqueUsers > 5 && uniqueSessions > 20) {
      confidence = 'medium';
    }

    return {
      totalEvents: events.length,
      uniqueUsers,
      sessionsAnalyzed: uniqueSessions,
      confidence,
    };
  }

  private getAnalysisPeriod(events: TelemetryEvent[]): { start: string; end: string } {
    if (events.length === 0) {
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return {
        start: weekAgo.toISOString(),
        end: now.toISOString(),
      };
    }

    const timestamps = events.map(e => new Date(e.timestamp).getTime());
    return {
      start: new Date(Math.min(...timestamps)).toISOString(),
      end: new Date(Math.max(...timestamps)).toISOString(),
    };
  }

  /**
   * Get current parameter values for code generation
   */
  getParameterValues(): Record<string, number> {
    const values: Record<string, number> = {};
    this.parameters.forEach(param => {
      values[param.id] = param.currentValue;
    });
    return values;
  }

  /**
   * Update parameter value
   */
  updateParameter(id: string, value: number): boolean {
    const parameter = this.parameters.find(p => p.id === id);
    if (!parameter) return false;

    if (value < parameter.minValue || value > parameter.maxValue) {
      return false;
    }

    parameter.currentValue = value;
    return true;
  }

  /**
   * Get all parameters
   */
  getParameters(): BalanceParameter[] {
    return [...this.parameters];
  }
}

/**
 * Code generator for applying balance changes
 */
export class BalanceCodeGenerator {
  /**
   * Generate TypeScript code with new parameter values
   */
  static generateParameterUpdates(
    appliedChanges: TuningRecommendation[],
    engine: AutoTuningEngine
  ): Array<{
    file: string;
    changes: Array<{
      line: number;
      oldValue: string;
      newValue: string;
      comment: string;
    }>;
  }> {
    const fileChanges: Array<{
      file: string;
      changes: Array<{
        line: number;
        oldValue: string;
        newValue: string;
        comment: string;
      }>;
    }> = [];

    appliedChanges.forEach(change => {
      const param = engine.getParameters().find(p => p.id === change.parameterId);
      if (!param) return;

      let targetFile = '';
      let variableName = '';

      // Map parameter to file and variable
      switch (param.id) {
        case 'sim_base_event_probability':
          targetFile = 'packages/core-sim/src/engine.ts';
          variableName = 'BASE_EVENT_PROBABILITY';
          break;
        case 'sim_goal_to_shot_ratio':
          targetFile = 'packages/core-sim/src/engine.ts';
          variableName = 'GOAL_TO_SHOT_RATIO';
          break;
        case 'sim_home_advantage':
          targetFile = 'packages/core-sim/src/engine.ts';
          variableName = 'homeAdvantage';
          break;
        case 'ui_auto_save_interval':
          targetFile = 'apps/desktop/src/App.tsx';
          variableName = 'AUTO_SAVE_INTERVAL';
          break;
        case 'ui_assistant_suggestion_frequency':
          targetFile = 'apps/desktop/src/stores/uiStore.ts';
          variableName = 'SUGGESTION_FREQUENCY';
          break;
      }

      if (targetFile && variableName) {
        fileChanges.push({
          file: targetFile,
          changes: [{
            line: 0, // Would need to parse file to find actual line
            oldValue: change.currentValue.toString(),
            newValue: change.recommendedValue.toString(),
            comment: `Auto-tuned: ${change.reasoning}`,
          }],
        });
      }
    });

    return fileChanges;
  }

  /**
   * Generate commit message for balance changes
   */
  static generateCommitMessage(appliedChanges: TuningRecommendation[]): string {
    if (appliedChanges.length === 0) {
      return 'chore(balance): weekly tuning - no changes applied';
    }

    const categories = new Set(appliedChanges.map(change => {
      const param = change.parameterId.split('_')[0];
      return param;
    }));

    const categoryList = Array.from(categories).join(', ');
    
    return `chore(balance): weekly tuning - adjust ${categoryList} parameters

Applied ${appliedChanges.length} automatic balance changes:

${appliedChanges.map(change => 
  `- ${change.parameterId}: ${change.currentValue} → ${change.recommendedValue} (${change.reasoning})`
).join('\n')}

Based on ${appliedChanges.reduce((sum, c) => sum + c.dataPoints, 0)} data points.
All changes have >80% confidence and low impact risk.`;
  }
}
