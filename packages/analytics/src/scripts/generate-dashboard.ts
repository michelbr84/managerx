#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { DashboardGenerator } from '../dashboard.js';
import type { TelemetryEvent } from '../telemetry.js';

/**
 * Generate analytics dashboard from telemetry data
 */
async function generateDashboard(): Promise<void> {
  console.log('🔍 Generating ManagerX Analytics Dashboard...');
  
  try {
    // Load telemetry data (in real app, this would come from storage/API)
    const events = await loadTelemetryData();
    
    if (events.length === 0) {
      console.log('⚠️ No telemetry data found. Generating sample dashboard...');
      const sampleEvents = generateSampleData();
      await saveDashboard(sampleEvents);
      return;
    }
    
    console.log(`📊 Processing ${events.length} telemetry events...`);
    
    await saveDashboard(events);
    
    console.log('✅ Dashboard generated successfully!');
    console.log('📂 View at: docs/ANALYTICS/index.html');
    
  } catch (error) {
    console.error('❌ Failed to generate dashboard:', error);
    process.exit(1);
  }
}

/**
 * Load telemetry data from various sources
 */
async function loadTelemetryData(): Promise<TelemetryEvent[]> {
  const events: TelemetryEvent[] = [];
  
  // Try to load from local storage simulation (for demo)
  // In real app, this would load from actual storage
  
  // For now, return empty array - will use sample data
  return events;
}

/**
 * Generate sample telemetry data for demonstration
 */
function generateSampleData(): TelemetryEvent[] {
  const events: TelemetryEvent[] = [];
  const now = new Date();
  const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
  
  // Generate 30 days of sample data
  for (let day = 0; day < 30; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    
    // Simulate daily activity
    const dailyUsers = users.slice(0, 2 + Math.floor(Math.random() * 3)); // 2-4 users per day
    
    dailyUsers.forEach((userId, userIndex) => {
      const sessionId = `sess_${date.getTime()}_${userIndex}`;
      
      // Session start
      events.push({
        id: `evt_${events.length}`,
        type: 'session_start',
        timestamp: date.toISOString(),
        sessionId,
        userId,
        data: { platform: 'desktop', locale: 'pt-BR' },
        version: '1.0.0',
      });
      
      // Screen views
      const screens = ['calendar', 'squad', 'tactics', 'match', 'inbox'];
      const sessionScreens = screens.slice(0, 2 + Math.floor(Math.random() * 3));
      
      sessionScreens.forEach((screen, screenIndex) => {
        const viewTime = new Date(date);
        viewTime.setMinutes(viewTime.getMinutes() + screenIndex * 5);
        
        events.push({
          id: `evt_${events.length}`,
          type: 'screen_viewed',
          timestamp: viewTime.toISOString(),
          sessionId,
          userId,
          data: { 
            screen, 
            loadTime: 800 + Math.random() * 1200 // 800-2000ms
          },
          version: '1.0.0',
        });
      });
      
      // Match simulations
      const matchCount = Math.floor(Math.random() * 4); // 0-3 matches per session
      for (let i = 0; i < matchCount; i++) {
        const matchTime = new Date(date);
        matchTime.setMinutes(matchTime.getMinutes() + 10 + i * 15);
        
        events.push({
          id: `evt_${events.length}`,
          type: 'match_simulated',
          timestamp: matchTime.toISOString(),
          sessionId,
          userId,
          data: {
            simulationDuration: 2000 + Math.random() * 3000,
            homeScore: Math.floor(Math.random() * 4),
            awayScore: Math.floor(Math.random() * 4),
            eventCount: 10 + Math.floor(Math.random() * 20),
          },
          version: '1.0.0',
        });
      }
      
      // Tactic changes
      const tacticChanges = Math.floor(Math.random() * 3); // 0-2 changes per session
      for (let i = 0; i < tacticChanges; i++) {
        const changeTime = new Date(date);
        changeTime.setMinutes(changeTime.getMinutes() + 20 + i * 10);
        
        events.push({
          id: `evt_${events.length}`,
          type: 'tactic_changed',
          timestamp: changeTime.toISOString(),
          sessionId,
          userId,
          data: {
            fromFormation: '4-4-2',
            toFormation: ['4-3-3', '3-5-2'][Math.floor(Math.random() * 2)],
            changed: ['formation'],
          },
          version: '1.0.0',
        });
      }
      
      // Occasional errors (low rate)
      if (Math.random() < 0.05) { // 5% chance
        const errorTime = new Date(date);
        errorTime.setMinutes(errorTime.getMinutes() + 30);
        
        events.push({
          id: `evt_${events.length}`,
          type: 'error_occurred',
          timestamp: errorTime.toISOString(),
          sessionId,
          userId,
          data: {
            errorType: ['TypeError', 'NetworkError', 'ValidationError'][Math.floor(Math.random() * 3)],
            errorMessage: 'Sample error for analytics',
          },
          version: '1.0.0',
        });
      }
      
      // Session end
      const endTime = new Date(date);
      endTime.setMinutes(endTime.getMinutes() + 30 + Math.random() * 60); // 30-90 min sessions
      
      events.push({
        id: `evt_${events.length}`,
        type: 'session_end',
        timestamp: endTime.toISOString(),
        sessionId,
        userId,
        data: {
          duration: (endTime.getTime() - date.getTime()) / 1000,
          screenViews: sessionScreens.length,
          matchesSimulated: matchCount,
          tacticsChanged: tacticChanges,
          errors: 0,
        },
        version: '1.0.0',
      });
    });
  }
  
  return events;
}

/**
 * Save dashboard to files
 */
async function saveDashboard(events: TelemetryEvent[]): Promise<void> {
  // Generate dashboard data
  const dashboardData = DashboardGenerator.generateDashboard(events, 30);
  
  // Create output directory
  const outputDir = path.join(process.cwd(), 'docs/ANALYTICS');
  await fs.mkdir(outputDir, { recursive: true });
  
  // Generate HTML dashboard
  const html = DashboardGenerator.generateHTML(dashboardData);
  await fs.writeFile(path.join(outputDir, 'index.html'), html);
  
  // Generate markdown version
  const markdown = DashboardGenerator.generateMarkdown(dashboardData);
  await fs.writeFile(path.join(outputDir, 'dashboard.md'), markdown);
  
  // Save raw data as JSON
  await fs.writeFile(
    path.join(outputDir, 'data.json'),
    JSON.stringify(dashboardData, null, 2)
  );
  
  console.log(`📈 Dashboard saved to ${outputDir}/`);
  console.log(`   - index.html (interactive dashboard)`);
  console.log(`   - dashboard.md (markdown version)`);
  console.log(`   - data.json (raw data)`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDashboard().catch(console.error);
}
