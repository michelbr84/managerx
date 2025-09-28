// Narrative storylets engine

import type { 
  Storylet, 
  StoryletInstance, 
  NarrativeState, 
  Condition, 
  Effect,
  Choice 
} from './schema.js';
import { createPrng } from '../../core-sim/src/prng.js';

export interface GameContext {
  currentDate: string;
  season: number;
  clubId: string;
  leaguePosition: number;
  budget: number;
  teamMorale: number;
  recentResults: string[]; // ['W', 'L', 'D', 'W', 'L']
  players: Array<{
    id: string;
    name: string;
    morale: number;
    condition: number;
    form: number;
    injured: boolean;
    contractExpires: string;
  }>;
  staff: Array<{
    id: string;
    name: string;
    role: string;
    loyalty: number;
  }>;
  boardConfidence: number;
  mediaAttention: number;
  fanSupport: number;
}

export interface NarrativeLog {
  timestamp: string;
  storyletId: string;
  action: 'triggered' | 'resolved' | 'skipped';
  reason: string;
  context: Record<string, any>;
  seed: number;
}

export class NarrativeEngine {
  private storylets: Storylet[] = [];
  private logs: NarrativeLog[] = [];
  private rateLimitMap: Map<string, number> = new Map();

  constructor(storylets: Storylet[]) {
    this.storylets = storylets;
  }

  /**
   * Evaluate storylets and trigger appropriate ones
   */
  evaluateStorylets(
    context: GameContext,
    narrativeState: NarrativeState,
    maxTriggers: number = 3
  ): StoryletInstance[] {
    const triggered: StoryletInstance[] = [];
    const prng = createPrng(`narrative:${narrativeState.narrativeSeed}:${context.currentDate}`);
    
    // Rate limiting: max 1 storylet per category per day
    const categoryLimits = new Map<string, number>();
    
    for (const storylet of this.storylets) {
      // Check rate limiting
      if (this.isRateLimited(storylet.id, context.currentDate)) {
        continue;
      }
      
      // Check category limits
      const categoryCount = categoryLimits.get(storylet.category) || 0;
      if (categoryCount >= 1) {
        continue;
      }
      
      // Check if already triggered enough times
      const occurrences = narrativeState.occurrenceCount[storylet.id] || 0;
      if (occurrences >= storylet.maxOccurrences) {
        continue;
      }
      
      // Check cooldown
      const lastTriggered = narrativeState.lastTriggered[storylet.id];
      if (lastTriggered) {
        const daysSince = this.getDaysDifference(lastTriggered, context.currentDate);
        if (daysSince < storylet.cooldown) {
          continue;
        }
      }
      
      // Evaluate conditions
      const conditionResult = this.evaluateConditions(storylet.conditions, context, prng);
      if (!conditionResult.canTrigger) {
        this.log('skipped', storylet.id, conditionResult.reason, context, prng.next());
        continue;
      }
      
      // Calculate trigger probability
      const baseProbability = this.getBaseProbability(storylet.priority);
      const conditionProbability = conditionResult.probability;
      const finalProbability = baseProbability * conditionProbability;
      
      if (prng.next() < finalProbability) {
        const instance = this.createStoryletInstance(storylet, context, prng);
        triggered.push(instance);
        categoryLimits.set(storylet.category, categoryCount + 1);
        
        this.log('triggered', storylet.id, `Probability: ${finalProbability.toFixed(3)}`, context, instance.seed);
        
        // Update rate limiting
        this.rateLimitMap.set(storylet.id, Date.now());
        
        if (triggered.length >= maxTriggers) {
          break;
        }
      }
    }
    
    return triggered;
  }

  /**
   * Resolve a storylet with player choice
   */
  resolveStorylet(
    instance: StoryletInstance,
    choiceId: string,
    context: GameContext
  ): Effect[] {
    const storylet = this.storylets.find(s => s.id === instance.storyletId);
    if (!storylet) {
      throw new Error(`Storylet ${instance.storyletId} not found`);
    }
    
    const choice = storylet.choices.find(c => c.id === choiceId);
    if (!choice) {
      throw new Error(`Choice ${choiceId} not found in storylet ${storylet.id}`);
    }
    
    // Check choice requirements
    if (choice.requirements) {
      const prng = createPrng(`choice:${instance.seed}:${choiceId}`);
      const conditionResult = this.evaluateConditions(choice.requirements, context, prng);
      if (!conditionResult.canTrigger) {
        throw new Error(`Choice requirements not met: ${conditionResult.reason}`);
      }
    }
    
    this.log('resolved', instance.storyletId, `Choice: ${choiceId}`, context, instance.seed);
    
    return choice.effects;
  }

  /**
   * Evaluate storylet conditions
   */
  private evaluateConditions(
    conditions: Condition[],
    context: GameContext,
    prng: any
  ): { canTrigger: boolean; probability: number; reason: string } {
    let totalProbability = 1.0;
    const reasons: string[] = [];
    
    for (const condition of conditions) {
      const result = this.evaluateCondition(condition, context, prng);
      
      if (!result.met) {
        return {
          canTrigger: false,
          probability: 0,
          reason: result.reason
        };
      }
      
      totalProbability *= result.probability * condition.weight;
      if (result.reason) {
        reasons.push(result.reason);
      }
    }
    
    return {
      canTrigger: true,
      probability: totalProbability,
      reason: reasons.join(', ')
    };
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(
    condition: Condition,
    context: GameContext,
    prng: any
  ): { met: boolean; probability: number; reason: string } {
    let actualValue: any;
    let reason = '';
    
    switch (condition.type) {
      case 'player_form':
        if (!condition.target) {
          return { met: false, probability: 0, reason: 'No player target specified' };
        }
        const player = context.players.find(p => p.id === condition.target);
        if (!player) {
          return { met: false, probability: 0, reason: 'Player not found' };
        }
        actualValue = player.form;
        reason = `${player.name} form: ${actualValue}`;
        break;
        
      case 'team_performance':
        // Calculate recent form percentage
        const recentWins = context.recentResults.filter(r => r === 'W').length;
        actualValue = (recentWins / context.recentResults.length) * 100;
        reason = `Team form: ${actualValue.toFixed(0)}%`;
        break;
        
      case 'financial':
        actualValue = context.budget;
        reason = `Budget: €${(actualValue / 1000000).toFixed(1)}M`;
        break;
        
      case 'calendar':
        const currentDate = new Date(context.currentDate);
        if (condition.operator === 'contains') {
          // Check month or season
          const month = currentDate.getMonth() + 1;
          actualValue = month;
          reason = `Month: ${month}`;
        } else {
          actualValue = currentDate.getTime();
          reason = `Date: ${context.currentDate}`;
        }
        break;
        
      case 'random':
        actualValue = prng.next() * 100;
        reason = `Random: ${actualValue.toFixed(1)}`;
        break;
        
      case 'board_pressure':
        actualValue = 100 - context.boardConfidence;
        reason = `Board pressure: ${actualValue}`;
        break;
        
      default:
        return { met: false, probability: 0, reason: `Unknown condition type: ${condition.type}` };
    }
    
    // Evaluate operator
    const met = this.evaluateOperator(actualValue, condition.operator, condition.value);
    const probability = met ? 1.0 : 0.0;
    
    return { met, probability, reason };
  }

  /**
   * Evaluate condition operator
   */
  private evaluateOperator(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case '>':
        return actual > expected;
      case '<':
        return actual < expected;
      case '>=':
        return actual >= expected;
      case '<=':
        return actual <= expected;
      case '==':
        return actual === expected;
      case '!=':
        return actual !== expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'between':
        return Array.isArray(expected) && actual >= expected[0] && actual <= expected[1];
      default:
        return false;
    }
  }

  /**
   * Create storylet instance
   */
  private createStoryletInstance(
    storylet: Storylet,
    context: GameContext,
    prng: any
  ): StoryletInstance {
    const seed = Math.floor(prng.next() * 1000000);
    
    return {
      id: `SI-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      storyletId: storylet.id,
      triggeredAt: new Date().toISOString(),
      gameDate: context.currentDate,
      seed,
      context: {
        clubId: context.clubId,
        season: context.season,
        leaguePosition: context.leaguePosition,
        teamMorale: context.teamMorale,
      },
      resolved: false,
    };
  }

  /**
   * Get base probability for storylet priority
   */
  private getBaseProbability(priority: string): number {
    switch (priority) {
      case 'critical':
        return 0.8;
      case 'high':
        return 0.4;
      case 'medium':
        return 0.2;
      case 'low':
        return 0.1;
      default:
        return 0.1;
    }
  }

  /**
   * Check if storylet is rate limited
   */
  private isRateLimited(storyletId: string, currentDate: string): boolean {
    const lastTrigger = this.rateLimitMap.get(storyletId);
    if (!lastTrigger) return false;
    
    const hoursSince = (Date.now() - lastTrigger) / (1000 * 60 * 60);
    return hoursSince < 24; // Max 1 per day per storylet
  }

  /**
   * Calculate days between dates
   */
  private getDaysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Log narrative decisions for auditability
   */
  private log(
    action: 'triggered' | 'resolved' | 'skipped',
    storyletId: string,
    reason: string,
    context: GameContext,
    seed: number
  ): void {
    this.logs.push({
      timestamp: new Date().toISOString(),
      storyletId,
      action,
      reason,
      context: {
        date: context.currentDate,
        club: context.clubId,
        position: context.leaguePosition,
        morale: context.teamMorale,
      },
      seed,
    });
  }

  /**
   * Get audit logs
   */
  getLogs(): NarrativeLog[] {
    return [...this.logs];
  }

  /**
   * Clear old logs (keep last 1000)
   */
  clearOldLogs(): void {
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }
}

/**
 * Text generation utilities
 */
export class NarrativeTextGenerator {
  private static templates = {
    player_morale_boost: [
      "{player} está em excelente forma após {event}.",
      "A confiança de {player} aumentou significativamente.",
      "{player} demonstra grande motivação nos treinos.",
    ],
    team_performance: [
      "A equipe vem apresentando {performance} resultados recentemente.",
      "O desempenho da equipe tem sido {performance} nas últimas partidas.",
      "Os jogadores estão {performance} em campo.",
    ],
    financial_concern: [
      "As finanças do clube requerem atenção cuidadosa.",
      "O orçamento está sob pressão devido aos gastos recentes.",
      "É necessário equilibrar as contas do clube.",
    ],
  };

  static generateText(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    
    return result;
  }

  static getRandomTemplate(category: keyof typeof NarrativeTextGenerator.templates): string {
    const templates = this.templates[category];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

/**
 * Storylet recommendation system
 */
export class StoryletRecommendationEngine {
  /**
   * Recommend choices for a storylet based on context
   */
  static recommendChoice(
    storylet: Storylet,
    context: GameContext,
    narrativeState: NarrativeState
  ): {
    recommendedChoiceId: string;
    confidence: number;
    reasoning: string;
  } {
    const choices = storylet.choices;
    let bestChoice = choices[0];
    let bestScore = 0;
    let reasoning = '';
    
    for (const choice of choices) {
      let score = choice.weight || 0.5;
      const reasons: string[] = [];
      
      // Analyze effects to determine desirability
      for (const effect of choice.effects) {
        switch (effect.type) {
          case 'morale_change':
            if (context.teamMorale < 70 && effect.value > 0) {
              score += 0.3;
              reasons.push('boost team morale');
            } else if (context.teamMorale > 80 && effect.value < 0) {
              score -= 0.2;
              reasons.push('avoid morale drop');
            }
            break;
            
          case 'finance':
            if (context.budget < 5000000 && effect.value > 0) {
              score += 0.4;
              reasons.push('improve finances');
            } else if (effect.value < 0 && context.budget < 2000000) {
              score -= 0.3;
              reasons.push('avoid financial strain');
            }
            break;
            
          case 'board_confidence':
            if (context.boardConfidence < 60 && effect.value > 0) {
              score += 0.3;
              reasons.push('improve board relations');
            }
            break;
            
          case 'reputation':
            if (effect.value > 0) {
              score += 0.2;
              reasons.push('boost club reputation');
            }
            break;
        }
      }
      
      if (score > bestScore) {
        bestChoice = choice;
        bestScore = score;
        reasoning = reasons.length > 0 ? reasons.join(', ') : 'balanced choice';
      }
    }
    
    const confidence = Math.min(0.95, Math.max(0.1, bestScore));
    
    return {
      recommendedChoiceId: bestChoice.id,
      confidence,
      reasoning: reasoning || 'default recommendation',
    };
  }
}

/**
 * Storylet content processor
 */
export class StoryletContentProcessor {
  /**
   * Process storylet content with context variables
   */
  static processContent(
    content: string,
    context: GameContext,
    variables: Record<string, string> = {}
  ): string {
    let processed = content;
    
    // Replace context variables
    const contextVars = {
      '{club}': 'seu clube',
      '{manager}': 'você',
      '{season}': context.season.toString(),
      '{position}': this.getPositionText(context.leaguePosition),
      '{morale}': this.getMoraleText(context.teamMorale),
      '{budget}': `€${(context.budget / 1000000).toFixed(1)}M`,
      ...variables,
    };
    
    Object.entries(contextVars).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    
    return processed;
  }

  private static getPositionText(position: number): string {
    if (position <= 3) return 'nas primeiras posições';
    if (position <= 8) return 'no meio da tabela';
    if (position <= 15) return 'na parte inferior';
    return 'na zona de rebaixamento';
  }

  private static getMoraleText(morale: number): string {
    if (morale >= 80) return 'excelente';
    if (morale >= 60) return 'boa';
    if (morale >= 40) return 'baixa';
    return 'muito baixa';
  }
}

/**
 * Export utilities for testing
 */
export function createMockGameContext(): GameContext {
  return {
    currentDate: '2024-08-15',
    season: 2024,
    clubId: 'CLB-0001',
    leaguePosition: 8,
    budget: 12000000,
    teamMorale: 75,
    recentResults: ['W', 'L', 'D', 'W', 'L'],
    players: [
      {
        id: 'PLY-001',
        name: 'João Silva',
        morale: 80,
        condition: 95,
        form: 85,
        injured: false,
        contractExpires: '2026-06-30',
      }
    ],
    staff: [
      {
        id: 'STF-001',
        name: 'Carlos Martinez',
        role: 'Assistant Manager',
        loyalty: 70,
      }
    ],
    boardConfidence: 65,
    mediaAttention: 50,
    fanSupport: 70,
  };
}
