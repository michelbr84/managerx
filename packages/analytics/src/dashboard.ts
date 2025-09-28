// Analytics dashboard generator

import type { TelemetryEvent, TelemetryKPIs } from './telemetry.js';
import { KPICalculator } from './telemetry.js';

export interface DashboardData {
  generatedAt: string;
  period: {
    start: string;
    end: string;
    days: number;
  };
  kpis: TelemetryKPIs;
  trends: {
    dailyActiveUsers: Array<{ date: string; count: number }>;
    dailyMatches: Array<{ date: string; count: number }>;
    popularScreens: Array<{ screen: string; views: number; percentage: number }>;
    commonErrors: Array<{ error: string; count: number; percentage: number }>;
    performanceTrends: Array<{ date: string; avgLoadTime: number }>;
  };
  insights: {
    topFindings: string[];
    recommendations: string[];
    alerts: string[];
  };
}

export class DashboardGenerator {
  /**
   * Generate dashboard data from telemetry events
   */
  static generateDashboard(events: TelemetryEvent[], periodDays: number = 30): DashboardData {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Filter events to period
    const periodEvents = events.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate && eventDate <= endDate;
    });

    const kpis = KPICalculator.calculateAllKPIs(periodEvents);
    const trends = this.calculateTrends(periodEvents, startDate, endDate);
    const insights = this.generateInsights(kpis, trends);

    return {
      generatedAt: new Date().toISOString(),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: periodDays,
      },
      kpis,
      trends,
      insights,
    };
  }

  /**
   * Generate HTML dashboard
   */
  static generateHTML(data: DashboardData): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ManagerX Analytics Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #1a1a1a;
            color: #e5e5e5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: #2a2a2a;
            border-radius: 12px;
        }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .kpi-card {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
        }
        .kpi-value {
            font-size: 2rem;
            font-weight: bold;
            color: #3b82f6;
        }
        .kpi-label {
            color: #9ca3af;
            margin-top: 5px;
        }
        .chart-container {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
        }
        .insights {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 12px;
        }
        .insight-section {
            margin-bottom: 20px;
        }
        .insight-list {
            list-style: none;
            padding: 0;
        }
        .insight-item {
            padding: 8px 0;
            border-bottom: 1px solid #374151;
        }
        .alert {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        .recommendation {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            color: #0369a1;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        .finding {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #166534;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ManagerX Analytics Dashboard</h1>
            <p>Período: ${new Date(data.period.start).toLocaleDateString('pt-BR')} - ${new Date(data.period.end).toLocaleDateString('pt-BR')} (${data.period.days} dias)</p>
            <p>Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-BR')}</p>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-value">${data.kpis.d1Retention.toFixed(1)}%</div>
                <div class="kpi-label">Retenção D1</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.kpis.d7Retention.toFixed(1)}%</div>
                <div class="kpi-label">Retenção D7</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.kpis.d30Retention.toFixed(1)}%</div>
                <div class="kpi-label">Retenção D30</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.kpis.averageSessionDuration.toFixed(1)}min</div>
                <div class="kpi-label">Duração Média da Sessão</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.kpis.matchesPerSession.toFixed(1)}</div>
                <div class="kpi-label">Partidas por Sessão</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.kpis.crashRate.toFixed(1)}%</div>
                <div class="kpi-label">Taxa de Erro</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.kpis.averageLoadTime.toFixed(0)}ms</div>
                <div class="kpi-label">Tempo de Carregamento</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${data.kpis.performanceScore.toFixed(0)}</div>
                <div class="kpi-label">Score de Performance</div>
            </div>
        </div>

        <div class="chart-container">
            <h3>Usuários Ativos Diários</h3>
            <canvas id="dailyUsersChart" width="400" height="200"></canvas>
        </div>

        <div class="chart-container">
            <h3>Partidas Simuladas por Dia</h3>
            <canvas id="dailyMatchesChart" width="400" height="200"></canvas>
        </div>

        <div class="chart-container">
            <h3>Telas Mais Visitadas</h3>
            <canvas id="popularScreensChart" width="400" height="200"></canvas>
        </div>

        <div class="insights">
            <h2>Insights e Recomendações</h2>
            
            ${data.insights.alerts.length > 0 ? `
            <div class="insight-section">
                <h3>⚠️ Alertas</h3>
                ${data.insights.alerts.map(alert => `<div class="alert">${alert}</div>`).join('')}
            </div>
            ` : ''}
            
            <div class="insight-section">
                <h3>📊 Principais Descobertas</h3>
                ${data.insights.topFindings.map(finding => `<div class="finding">${finding}</div>`).join('')}
            </div>
            
            <div class="insight-section">
                <h3>💡 Recomendações</h3>
                ${data.insights.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
            </div>
        </div>
    </div>

    <script>
        // Daily Users Chart
        const dailyUsersCtx = document.getElementById('dailyUsersChart').getContext('2d');
        new Chart(dailyUsersCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(data.trends.dailyActiveUsers.map(d => new Date(d.date).toLocaleDateString('pt-BR')))},
                datasets: [{
                    label: 'Usuários Ativos',
                    data: ${JSON.stringify(data.trends.dailyActiveUsers.map(d => d.count))},
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#e5e5e5' } } },
                scales: {
                    x: { ticks: { color: '#9ca3af' } },
                    y: { ticks: { color: '#9ca3af' } }
                }
            }
        });

        // Daily Matches Chart
        const dailyMatchesCtx = document.getElementById('dailyMatchesChart').getContext('2d');
        new Chart(dailyMatchesCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(data.trends.dailyMatches.map(d => new Date(d.date).toLocaleDateString('pt-BR')))},
                datasets: [{
                    label: 'Partidas Simuladas',
                    data: ${JSON.stringify(data.trends.dailyMatches.map(d => d.count))},
                    backgroundColor: '#10b981',
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#e5e5e5' } } },
                scales: {
                    x: { ticks: { color: '#9ca3af' } },
                    y: { ticks: { color: '#9ca3af' } }
                }
            }
        });

        // Popular Screens Chart
        const popularScreensCtx = document.getElementById('popularScreensChart').getContext('2d');
        new Chart(popularScreensCtx, {
            type: 'doughnut',
            data: {
                labels: ${JSON.stringify(data.trends.popularScreens.map(s => s.screen))},
                datasets: [{
                    data: ${JSON.stringify(data.trends.popularScreens.map(s => s.percentage))},
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
                    ],
                }]
            },
            options: {
                responsive: true,
                plugins: { 
                    legend: { 
                        labels: { color: '#e5e5e5' },
                        position: 'bottom'
                    } 
                }
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Calculate trends for dashboard
   */
  private static calculateTrends(events: TelemetryEvent[], startDate: Date, endDate: Date): DashboardData['trends'] {
    // Daily active users
    const dailyUsers = new Map<string, Set<string>>();
    const dailyMatches = new Map<string, number>();
    const screenViews = new Map<string, number>();
    const errors = new Map<string, number>();
    const dailyPerformance = new Map<string, number[]>();

    events.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      
      // Track daily active users
      if (event.type === 'session_start' && event.userId) {
        if (!dailyUsers.has(date)) {
          dailyUsers.set(date, new Set());
        }
        dailyUsers.get(date)!.add(event.userId);
      }
      
      // Track daily matches
      if (event.type === 'match_simulated') {
        dailyMatches.set(date, (dailyMatches.get(date) || 0) + 1);
      }
      
      // Track screen views
      if (event.type === 'screen_viewed' && event.data.screen) {
        const screen = event.data.screen;
        screenViews.set(screen, (screenViews.get(screen) || 0) + 1);
      }
      
      // Track errors
      if (event.type === 'error_occurred' && event.data.errorType) {
        const error = event.data.errorType;
        errors.set(error, (errors.get(error) || 0) + 1);
      }
      
      // Track performance
      if (event.type === 'screen_viewed' && event.data.loadTime) {
        if (!dailyPerformance.has(date)) {
          dailyPerformance.set(date, []);
        }
        dailyPerformance.get(date)!.push(event.data.loadTime);
      }
    });

    // Generate daily active users trend
    const dailyActiveUsers = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const count = dailyUsers.get(dateStr)?.size || 0;
      dailyActiveUsers.push({ date: dateStr, count });
    }

    // Generate daily matches trend
    const dailyMatchesTrend = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const count = dailyMatches.get(dateStr) || 0;
      dailyMatchesTrend.push({ date: dateStr, count });
    }

    // Popular screens
    const totalScreenViews = Array.from(screenViews.values()).reduce((sum, count) => sum + count, 0);
    const popularScreens = Array.from(screenViews.entries())
      .map(([screen, views]) => ({
        screen,
        views,
        percentage: totalScreenViews > 0 ? (views / totalScreenViews) * 100 : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);

    // Common errors
    const totalErrors = Array.from(errors.values()).reduce((sum, count) => sum + count, 0);
    const commonErrors = Array.from(errors.entries())
      .map(([error, count]) => ({
        error,
        count,
        percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Performance trends
    const performanceTrends = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const loadTimes = dailyPerformance.get(dateStr) || [];
      const avgLoadTime = loadTimes.length > 0
        ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
        : 0;
      performanceTrends.push({ date: dateStr, avgLoadTime });
    }

    return {
      dailyActiveUsers,
      dailyMatches: dailyMatchesTrend,
      popularScreens,
      commonErrors,
      performanceTrends,
    };
  }

  /**
   * Generate insights from KPIs and trends
   */
  private static generateInsights(kpis: TelemetryKPIs, trends: DashboardData['trends']): DashboardData['insights'] {
    const topFindings: string[] = [];
    const recommendations: string[] = [];
    const alerts: string[] = [];

    // Retention analysis
    if (kpis.d1Retention > 70) {
      topFindings.push(`Excelente retenção D1 (${kpis.d1Retention.toFixed(1)}%) indica boa primeira impressão`);
    } else if (kpis.d1Retention < 40) {
      alerts.push(`Baixa retenção D1 (${kpis.d1Retention.toFixed(1)}%) - revisar onboarding`);
      recommendations.push('Melhorar tutorial inicial e primeiras impressões do jogo');
    }

    if (kpis.d7Retention > 50) {
      topFindings.push(`Boa retenção D7 (${kpis.d7Retention.toFixed(1)}%) mostra engajamento sustentado`);
    } else if (kpis.d7Retention < 25) {
      alerts.push(`Baixa retenção D7 (${kpis.d7Retention.toFixed(1)}%) - problemas de engajamento`);
      recommendations.push('Adicionar mais conteúdo e variabilidade para manter interesse');
    }

    // Session analysis
    if (kpis.averageSessionDuration > 45) {
      topFindings.push(`Sessões longas (${kpis.averageSessionDuration.toFixed(1)}min) indicam alto engajamento`);
    } else if (kpis.averageSessionDuration < 15) {
      recommendations.push('Sessões curtas - considerar adicionar objetivos de curto prazo');
    }

    // Engagement analysis
    if (kpis.matchesPerSession > 3) {
      topFindings.push(`Alta simulação de partidas (${kpis.matchesPerSession.toFixed(1)}/sessão) - core loop funciona`);
    } else if (kpis.matchesPerSession < 1) {
      alerts.push('Baixa simulação de partidas - revisar fluxo de jogo');
      recommendations.push('Simplificar acesso à simulação de partidas');
    }

    // Technical analysis
    if (kpis.crashRate > 5) {
      alerts.push(`Alta taxa de erro (${kpis.crashRate.toFixed(1)}%) - estabilidade comprometida`);
      recommendations.push('Priorizar correção de bugs e melhorias de estabilidade');
    } else if (kpis.crashRate === 0) {
      topFindings.push('Zero crashes detectados - excelente estabilidade');
    }

    if (kpis.averageLoadTime > 3000) {
      alerts.push(`Carregamento lento (${kpis.averageLoadTime.toFixed(0)}ms) - performance comprometida`);
      recommendations.push('Otimizar performance de carregamento de telas');
    } else if (kpis.averageLoadTime < 1000) {
      topFindings.push(`Carregamento rápido (${kpis.averageLoadTime.toFixed(0)}ms) - boa performance`);
    }

    // Feature adoption analysis
    if (kpis.assistantUsageRate > 60) {
      topFindings.push(`Alto uso do assistente (${kpis.assistantUsageRate.toFixed(1)}%) - feature bem aceita`);
    } else if (kpis.assistantUsageRate < 20) {
      recommendations.push('Melhorar descobribilidade e utilidade do assistente');
    }

    if (kpis.keyboardShortcutUsage > 40) {
      topFindings.push(`Bom uso de atalhos (${kpis.keyboardShortcutUsage.toFixed(1)}%) - usuários power user`);
    } else if (kpis.keyboardShortcutUsage < 10) {
      recommendations.push('Promover mais os atalhos de teclado para eficiência');
    }

    // Screen popularity analysis
    const topScreen = trends.popularScreens[0];
    if (topScreen && topScreen.percentage > 40) {
      topFindings.push(`${topScreen.screen} é a tela mais popular (${topScreen.percentage.toFixed(1)}%)`);
    }

    // Error analysis
    if (trends.commonErrors.length > 0) {
      const topError = trends.commonErrors[0];
      if (topError.percentage > 50) {
        alerts.push(`Erro dominante: ${topError.error} (${topError.percentage.toFixed(1)}% dos erros)`);
      }
    }

    return {
      topFindings,
      recommendations,
      alerts,
    };
  }

  /**
   * Generate markdown dashboard
   */
  static generateMarkdown(data: DashboardData): string {
    return `# ManagerX Analytics Dashboard

**Período**: ${new Date(data.period.start).toLocaleDateString('pt-BR')} - ${new Date(data.period.end).toLocaleDateString('pt-BR')} (${data.period.days} dias)  
**Gerado em**: ${new Date(data.generatedAt).toLocaleString('pt-BR')}

## KPIs Principais

| Métrica | Valor | Status |
|---------|-------|--------|
| Retenção D1 | ${data.kpis.d1Retention.toFixed(1)}% | ${data.kpis.d1Retention > 50 ? '✅' : data.kpis.d1Retention > 30 ? '⚠️' : '❌'} |
| Retenção D7 | ${data.kpis.d7Retention.toFixed(1)}% | ${data.kpis.d7Retention > 40 ? '✅' : data.kpis.d7Retention > 20 ? '⚠️' : '❌'} |
| Retenção D30 | ${data.kpis.d30Retention.toFixed(1)}% | ${data.kpis.d30Retention > 30 ? '✅' : data.kpis.d30Retention > 15 ? '⚠️' : '❌'} |
| Duração Média da Sessão | ${data.kpis.averageSessionDuration.toFixed(1)}min | ${data.kpis.averageSessionDuration > 30 ? '✅' : data.kpis.averageSessionDuration > 15 ? '⚠️' : '❌'} |
| Partidas por Sessão | ${data.kpis.matchesPerSession.toFixed(1)} | ${data.kpis.matchesPerSession > 2 ? '✅' : data.kpis.matchesPerSession > 1 ? '⚠️' : '❌'} |
| Taxa de Erro | ${data.kpis.crashRate.toFixed(1)}% | ${data.kpis.crashRate === 0 ? '✅' : data.kpis.crashRate < 5 ? '⚠️' : '❌'} |
| Tempo de Carregamento | ${data.kpis.averageLoadTime.toFixed(0)}ms | ${data.kpis.averageLoadTime < 1500 ? '✅' : data.kpis.averageLoadTime < 3000 ? '⚠️' : '❌'} |
| Score de Performance | ${data.kpis.performanceScore.toFixed(0)} | ${data.kpis.performanceScore > 80 ? '✅' : data.kpis.performanceScore > 60 ? '⚠️' : '❌'} |

## Adoção de Features

| Feature | Taxa de Uso | Status |
|---------|-------------|--------|
| Assistente do Clube | ${data.kpis.assistantUsageRate.toFixed(1)}% | ${data.kpis.assistantUsageRate > 50 ? '✅' : data.kpis.assistantUsageRate > 25 ? '⚠️' : '❌'} |
| Atalhos de Teclado | ${data.kpis.keyboardShortcutUsage.toFixed(1)}% | ${data.kpis.keyboardShortcutUsage > 30 ? '✅' : data.kpis.keyboardShortcutUsage > 15 ? '⚠️' : '❌'} |
| Saves por Sessão | ${data.kpis.saveGameFrequency.toFixed(1)} | ${data.kpis.saveGameFrequency > 1 ? '✅' : data.kpis.saveGameFrequency > 0.5 ? '⚠️' : '❌'} |

## Telas Mais Populares

${data.trends.popularScreens.map((screen, index) => 
  `${index + 1}. **${screen.screen}**: ${screen.views} visualizações (${screen.percentage.toFixed(1)}%)`
).join('\n')}

## Insights e Alertas

${data.insights.alerts.length > 0 ? `### ⚠️ Alertas\n${data.insights.alerts.map(alert => `- ${alert}`).join('\n')}\n` : ''}

### 📊 Principais Descobertas
${data.insights.topFindings.map(finding => `- ${finding}`).join('\n')}

### 💡 Recomendações
${data.insights.recommendations.map(rec => `- ${rec}`).join('\n')}

## Dados Técnicos

### Erros Mais Comuns
${data.trends.commonErrors.length > 0 
  ? data.trends.commonErrors.map(error => `- **${error.error}**: ${error.count} ocorrências (${error.percentage.toFixed(1)}%)`).join('\n')
  : '- Nenhum erro registrado no período'
}

---

*Dashboard gerado automaticamente pelo sistema de analytics ManagerX*  
*Dados anonimizados e agregados - nenhuma informação pessoal é coletada*`;
  }
}
