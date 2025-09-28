#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { AutoTuningEngine, BalanceCodeGenerator } from '../auto-tuning.js';
import { KPICalculator } from '../telemetry.js';
import type { TelemetryEvent, TelemetryKPIs } from '../telemetry.js';

/**
 * Weekly auto-tuning script
 */
async function runAutoTuning(): Promise<void> {
  console.log('🔧 Starting ManagerX Weekly Auto-Tuning...');
  
  try {
    // Load current and previous telemetry data
    const currentEvents = await loadTelemetryData();
    const previousKPIs = await loadPreviousKPIs();
    
    if (currentEvents.length === 0) {
      console.log('⚠️ No telemetry data available. Using sample data for demonstration...');
      const sampleEvents = generateSampleTelemetryData();
      await processAutoTuning(sampleEvents, undefined);
      return;
    }
    
    console.log(`📊 Analyzing ${currentEvents.length} telemetry events...`);
    
    await processAutoTuning(currentEvents, previousKPIs);
    
  } catch (error) {
    console.error('❌ Auto-tuning failed:', error);
    process.exit(1);
  }
}

/**
 * Process auto-tuning with telemetry data
 */
async function processAutoTuning(events: TelemetryEvent[], previousKPIs?: TelemetryKPIs): Promise<void> {
  const engine = new AutoTuningEngine();
  
  // Generate tuning recommendations
  console.log('🔍 Generating tuning recommendations...');
  const report = engine.generateTuningRecommendations(events, previousKPIs);
  
  console.log(`📋 Generated ${report.recommendations.length} recommendations`);
  console.log(`📊 Data quality: ${report.dataQuality.confidence} (${report.dataQuality.totalEvents} events)`);
  
  // Apply automatic tuning
  console.log('⚙️ Applying automatic tuning...');
  const { applied, skipped } = engine.applyAutomaticTuning(report.recommendations);
  
  console.log(`✅ Applied ${applied.length} changes automatically`);
  console.log(`⏭️ Skipped ${skipped.length} changes (manual review required)`);
  
  // Generate code changes
  if (applied.length > 0) {
    const codeChanges = BalanceCodeGenerator.generateParameterUpdates(applied, engine);
    const commitMessage = BalanceCodeGenerator.generateCommitMessage(applied);
    
    console.log('\n📝 Code changes to apply:');
    codeChanges.forEach(fileChange => {
      console.log(`   ${fileChange.file}:`);
      fileChange.changes.forEach(change => {
        console.log(`     ${change.oldValue} → ${change.newValue} (${change.comment})`);
      });
    });
    
    console.log('\n📋 Commit message:');
    console.log(commitMessage);
  }
  
  // Save tuning report
  await saveTuningReport(report, applied);
  
  // Save current KPIs for next week's comparison
  await saveCurrentKPIs(report.kpiTrends.current);
  
  // Generate PR if in CI environment
  if (process.env.CI && applied.length > 0) {
    await generateAutomaticPR(report, applied);
  }
  
  console.log('\n🎯 Auto-tuning completed successfully!');
  console.log(`📂 Report saved to: docs/ANALYTICS/tuning-report-${new Date().toISOString().split('T')[0]}.md`);
}

/**
 * Load telemetry data from storage
 */
async function loadTelemetryData(): Promise<TelemetryEvent[]> {
  try {
    // In real implementation, this would load from actual telemetry storage
    // For now, return empty array to trigger sample data generation
    return [];
  } catch (error) {
    console.warn('Could not load telemetry data:', error);
    return [];
  }
}

/**
 * Load previous week's KPIs for comparison
 */
async function loadPreviousKPIs(): Promise<TelemetryKPIs | undefined> {
  try {
    const kpisPath = path.join(process.cwd(), 'docs/ANALYTICS/previous-kpis.json');
    const content = await fs.readFile(kpisPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log('📊 No previous KPIs found (first run)');
    return undefined;
  }
}

/**
 * Save current KPIs for next week's comparison
 */
async function saveCurrentKPIs(kpis: TelemetryKPIs): Promise<void> {
  const outputDir = path.join(process.cwd(), 'docs/ANALYTICS');
  await fs.mkdir(outputDir, { recursive: true });
  
  const kpisPath = path.join(outputDir, 'previous-kpis.json');
  await fs.writeFile(kpisPath, JSON.stringify(kpis, null, 2));
}

/**
 * Save tuning report
 */
async function saveTuningReport(report: any, appliedChanges: any[]): Promise<void> {
  const outputDir = path.join(process.cwd(), 'docs/ANALYTICS');
  await fs.mkdir(outputDir, { recursive: true });
  
  const date = new Date().toISOString().split('T')[0];
  const reportPath = path.join(outputDir, `tuning-report-${date}.md`);
  
  const markdown = `# Weekly Auto-Tuning Report - ${date}

**Gerado em**: ${new Date().toLocaleString('pt-BR')}  
**Período**: ${new Date(report.period.start).toLocaleDateString('pt-BR')} - ${new Date(report.period.end).toLocaleDateString('pt-BR')}

## Qualidade dos Dados

- **Total de Eventos**: ${report.dataQuality.totalEvents}
- **Usuários Únicos**: ${report.dataQuality.uniqueUsers}
- **Sessões Analisadas**: ${report.dataQuality.sessionsAnalyzed}
- **Confiança**: ${report.dataQuality.confidence}

## KPIs Atuais

| Métrica | Valor | Mudança |
|---------|-------|---------|
${Object.entries(report.kpiTrends.current).map(([key, value]) => {
  const change = report.kpiTrends.changes[key];
  const changeStr = change !== undefined ? 
    (change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1)) : 'N/A';
  
  return `| ${key} | ${typeof value === 'number' ? value.toFixed(1) : value} | ${changeStr} |`;
}).join('\n')}

## Recomendações Geradas

${report.recommendations.map((rec: any, index: number) => `
### ${index + 1}. ${rec.parameterId}
- **Valor Atual**: ${rec.currentValue}
- **Valor Recomendado**: ${rec.recommendedValue}
- **Confiança**: ${rec.confidence}%
- **Prioridade**: ${rec.priority}
- **Razão**: ${rec.reasoning}
- **Impacto Esperado**: ${rec.expectedImpact}
- **Pontos de Dados**: ${rec.dataPoints}
`).join('\n')}

## Mudanças Aplicadas

${appliedChanges.length > 0 ? appliedChanges.map((change: any) => `
- **${change.parameterId}**: ${change.currentValue} → ${change.recommendedValue}
  - Razão: ${change.reasoning}
  - Confiança: ${change.confidence}%
`).join('\n') : '*Nenhuma mudança automática aplicada*'}

## Próximos Passos

1. Monitorar impacto das mudanças nos próximos 7 dias
2. Revisar recomendações de alta prioridade manualmente
3. Considerar testes A/B para mudanças significativas

---

*Relatório gerado pelo sistema de auto-tuning ManagerX*`;

  await fs.writeFile(reportPath, markdown);
}

/**
 * Generate automatic PR (in CI environment)
 */
async function generateAutomaticPR(report: any, appliedChanges: any[]): Promise<void> {
  console.log('🔄 Generating automatic PR for balance changes...');
  
  const prContent = new AutoTuningEngine().generatePRContent(report, appliedChanges);
  
  // Save PR content for CI to use
  const prDir = path.join(process.cwd(), '.github/auto-tuning');
  await fs.mkdir(prDir, { recursive: true });
  
  await fs.writeFile(
    path.join(prDir, 'pr-content.json'),
    JSON.stringify(prContent, null, 2)
  );
  
  console.log('📋 PR content saved for CI workflow');
}

/**
 * Generate sample telemetry data for demonstration
 */
function generateSampleTelemetryData(): TelemetryEvent[] {
  const events: TelemetryEvent[] = [];
  const now = new Date();
  
  // Generate realistic sample data
  for (let day = 0; day < 30; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    
    // Simulate declining engagement over time (realistic pattern)
    const baseUsers = 10 - Math.floor(day / 10); // Fewer users over time
    const dailyUsers = Math.max(1, baseUsers + Math.floor(Math.random() * 3));
    
    for (let user = 0; user < dailyUsers; user++) {
      const userId = `sample_user_${user}`;
      const sessionId = `sess_${date.getTime()}_${user}`;
      
      // Session metrics
      const sessionDuration = 20 + Math.random() * 40; // 20-60 minutes
      const matchesInSession = Math.floor(Math.random() * 4); // 0-3 matches
      const screenViews = 3 + Math.floor(Math.random() * 5); // 3-7 screens
      
      // Session start
      events.push({
        id: `sample_${events.length}`,
        type: 'session_start',
        timestamp: date.toISOString(),
        sessionId,
        userId,
        data: { platform: 'desktop', locale: 'pt-BR' },
        version: '1.0.0',
      });
      
      // Screen views with realistic load times
      for (let view = 0; view < screenViews; view++) {
        const viewTime = new Date(date);
        viewTime.setMinutes(viewTime.getMinutes() + view * (sessionDuration / screenViews));
        
        events.push({
          id: `sample_${events.length}`,
          type: 'screen_viewed',
          timestamp: viewTime.toISOString(),
          sessionId,
          userId,
          data: {
            screen: ['calendar', 'squad', 'tactics', 'match', 'inbox', 'scouting'][Math.floor(Math.random() * 6)],
            loadTime: 600 + Math.random() * 1400, // 600-2000ms
          },
          version: '1.0.0',
        });
      }
      
      // Match simulations
      for (let match = 0; match < matchesInSession; match++) {
        const matchTime = new Date(date);
        matchTime.setMinutes(matchTime.getMinutes() + 10 + match * 15);
        
        events.push({
          id: `sample_${events.length}`,
          type: 'match_simulated',
          timestamp: matchTime.toISOString(),
          sessionId,
          userId,
          data: {
            simulationDuration: 1500 + Math.random() * 2000,
            homeScore: Math.floor(Math.random() * 5),
            awayScore: Math.floor(Math.random() * 5),
            eventCount: 8 + Math.floor(Math.random() * 25),
          },
          version: '1.0.0',
        });
      }
      
      // Session end
      const endTime = new Date(date);
      endTime.setMinutes(endTime.getMinutes() + sessionDuration);
      
      events.push({
        id: `sample_${events.length}`,
        type: 'session_end',
        timestamp: endTime.toISOString(),
        sessionId,
        userId,
        data: {
          duration: sessionDuration * 60, // Convert to seconds
          screenViews,
          matchesSimulated: matchesInSession,
          tacticsChanged: Math.floor(Math.random() * 3),
          errors: Math.random() < 0.1 ? 1 : 0, // 10% chance of error
        },
        version: '1.0.0',
      });
    }
  }
  
  return events;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAutoTuning().catch(console.error);
}
