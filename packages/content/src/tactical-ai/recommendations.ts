// Tactical AI recommendation system

import type { TacticalSetup, Team, Player } from '../../core-sim/src/types.js';
import { createPrng } from '../../core-sim/src/prng.js';
import { 
  calculateAttackRating,
  calculateDefenseRating,
  calculateMidfieldRating,
  getTacticalMatchup
} from '../../core-sim/src/tactics.js';

export interface TacticalRecommendation {
  id: string;
  type: 'formation' | 'mentality' | 'pressing' | 'tempo' | 'width' | 'substitution' | 'instruction';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  reasoning: string; // ≤140 chars as per GDD
  confidence: number; // 0-100
  expectedImpact: number; // -100 to +100 (negative = defensive, positive = attacking)
  recommendation: any; // Specific tactical change
  context: {
    minute?: number;
    score?: { home: number; away: number };
    possession?: { home: number; away: number };
    momentum?: number;
  };
  factors: Array<{
    name: string;
    value: number;
    weight: number;
    description: string;
  }>;
}

export interface MatchContext {
  homeTeam: Team;
  awayTeam: Team;
  currentScore: { home: number; away: number };
  minute: number;
  possession: { home: number; away: number };
  momentum: number; // -100 to +100
  weather: string;
  playerStamina: { [playerId: string]: number };
  recentEvents: Array<{
    type: string;
    team: 'home' | 'away';
    minute: number;
  }>;
}

export class TacticalAI {
  private logs: Array<{
    timestamp: string;
    matchId: string;
    minute: number;
    recommendation: string;
    reasoning: string;
    confidence: number;
    seed: number;
    context: any;
  }> = [];

  /**
   * Generate pre-match tactical recommendations
   */
  generatePreMatchRecommendations(
    yourTeam: Team,
    opponentTeam: Team,
    weather: string,
    seed: number
  ): TacticalRecommendation[] {
    const prng = createPrng(`prematch:${seed}:${yourTeam.id}:${opponentTeam.id}`);
    const recommendations: TacticalRecommendation[] = [];

    // Analyze opponent strengths and weaknesses
    const opponentAnalysis = this.analyzeOpponent(opponentTeam);
    const teamAnalysis = this.analyzeTeam(yourTeam);
    
    // Formation recommendation
    const formationRec = this.recommendFormation(yourTeam, opponentTeam, prng);
    if (formationRec) recommendations.push(formationRec);

    // Mentality recommendation
    const mentalityRec = this.recommendMentality(yourTeam, opponentTeam, opponentAnalysis, prng);
    if (mentalityRec) recommendations.push(mentalityRec);

    // Pressing recommendation
    const pressingRec = this.recommendPressing(yourTeam, opponentTeam, weather, prng);
    if (pressingRec) recommendations.push(pressingRec);

    // Weather-specific recommendations
    const weatherRec = this.recommendWeatherTactics(weather, yourTeam, prng);
    if (weatherRec) recommendations.push(weatherRec);

    // Player-specific instructions
    const playerRecs = this.recommendPlayerInstructions(yourTeam, opponentTeam, prng);
    recommendations.push(...playerRecs);

    // Sort by priority and confidence
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        return b.confidence - a.confidence;
      })
      .slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Generate half-time tactical recommendations
   */
  generateHalfTimeRecommendations(
    context: MatchContext,
    seed: number
  ): TacticalRecommendation[] {
    const prng = createPrng(`halftime:${seed}:${context.minute}`);
    const recommendations: TacticalRecommendation[] = [];

    // Analyze first half performance
    const performance = this.analyzeFirstHalfPerformance(context);
    
    // Score-based recommendations
    const scoreDiff = context.currentScore.home - context.currentScore.away;
    
    if (scoreDiff < 0) {
      // Losing - need more attacking approach
      recommendations.push(this.recommendComebackTactics(context, prng));
    } else if (scoreDiff > 1) {
      // Winning - consider defensive approach
      recommendations.push(this.recommendProtectLeadTactics(context, prng));
    }

    // Possession-based recommendations
    if (context.possession.home < 40) {
      recommendations.push(this.recommendPossessionImprovement(context, prng));
    }

    // Stamina-based recommendations
    const tiredPlayers = this.findTiredPlayers(context);
    if (tiredPlayers.length > 0) {
      recommendations.push(this.recommendStaminaManagement(context, tiredPlayers, prng));
    }

    // Momentum-based recommendations
    if (Math.abs(context.momentum) > 50) {
      recommendations.push(this.recommendMomentumTactics(context, prng));
    }

    return recommendations.slice(0, 3); // Limit half-time recommendations
  }

  /**
   * Analyze opponent team characteristics
   */
  private analyzeOpponent(team: Team): {
    attackStrength: number;
    defenseStrength: number;
    midfieldStrength: number;
    weaknesses: string[];
    strengths: string[];
    playingStyle: string;
  } {
    const attackRating = calculateAttackRating(team);
    const defenseRating = calculateDefenseRating(team);
    const midfieldRating = calculateMidfieldRating(team);

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (attackRating > 120) strengths.push('strong_attack');
    else if (attackRating < 80) weaknesses.push('weak_attack');

    if (defenseRating > 120) strengths.push('solid_defense');
    else if (defenseRating < 80) weaknesses.push('vulnerable_defense');

    if (midfieldRating > 120) strengths.push('midfield_control');
    else if (midfieldRating < 80) weaknesses.push('weak_midfield');

    const playingStyle = team.tactics.mentality === 'attacking' ? 'offensive' :
                        team.tactics.mentality === 'defensive' ? 'defensive' : 'balanced';

    return {
      attackStrength: attackRating,
      defenseStrength: defenseRating,
      midfieldStrength: midfieldRating,
      weaknesses,
      strengths,
      playingStyle,
    };
  }

  /**
   * Recommend formation based on opponent analysis
   */
  private recommendFormation(yourTeam: Team, opponentTeam: Team, prng: any): TacticalRecommendation | null {
    const opponentFormation = opponentTeam.tactics.formation;
    const currentFormation = yourTeam.tactics.formation;
    
    let recommendedFormation: string | null = null;
    let reasoning = '';
    let confidence = 60;

    // Formation counters
    if (opponentFormation === '4-4-2' && currentFormation !== '4-3-3') {
      recommendedFormation = '4-3-3';
      reasoning = 'Width advantage vs 4-4-2';
      confidence = 75;
    } else if (opponentFormation === '4-3-3' && currentFormation !== '3-5-2') {
      recommendedFormation = '3-5-2';
      reasoning = 'Midfield control vs 4-3-3';
      confidence = 70;
    } else if (opponentFormation === '3-5-2' && currentFormation !== '4-4-2') {
      recommendedFormation = '4-4-2';
      reasoning = 'Balanced approach vs 3-5-2';
      confidence = 65;
    }

    if (!recommendedFormation || recommendedFormation === currentFormation) {
      return null;
    }

    return {
      id: `TAC-FORM-${Date.now()}`,
      type: 'formation',
      priority: 'medium',
      title: `Mudar para ${recommendedFormation}`,
      description: `Considere alterar a formação para ${recommendedFormation} para explorar as fraquezas do oponente`,
      reasoning,
      confidence,
      expectedImpact: 15,
      recommendation: { formation: recommendedFormation },
      context: {},
      factors: [
        {
          name: 'formation_matchup',
          value: confidence,
          weight: 1.0,
          description: `${recommendedFormation} vs ${opponentFormation}`
        }
      ],
    };
  }

  /**
   * Recommend mentality based on team analysis
   */
  private recommendMentality(
    yourTeam: Team,
    opponentTeam: Team,
    opponentAnalysis: any,
    prng: any
  ): TacticalRecommendation | null {
    const yourAttack = calculateAttackRating(yourTeam);
    const yourDefense = calculateDefenseRating(yourTeam);
    const opponentDefense = opponentAnalysis.defenseStrength;
    const opponentAttack = opponentAnalysis.attackStrength;

    let recommendedMentality: 'defensive' | 'balanced' | 'attacking' | null = null;
    let reasoning = '';
    let confidence = 50;

    // If opponent has weak defense and you have strong attack
    if (opponentDefense < 90 && yourAttack > 110) {
      recommendedMentality = 'attacking';
      reasoning = 'Exploit weak defense';
      confidence = 80;
    }
    // If opponent has strong attack and you have weak defense
    else if (opponentAttack > 120 && yourDefense < 90) {
      recommendedMentality = 'defensive';
      reasoning = 'Counter strong attack';
      confidence = 75;
    }
    // Balanced approach for even matchups
    else if (Math.abs(yourAttack - opponentDefense) < 20) {
      recommendedMentality = 'balanced';
      reasoning = 'Even matchup approach';
      confidence = 60;
    }

    if (!recommendedMentality || recommendedMentality === yourTeam.tactics.mentality) {
      return null;
    }

    return {
      id: `TAC-MENT-${Date.now()}`,
      type: 'mentality',
      priority: 'medium',
      title: `Adotar postura ${recommendedMentality}`,
      description: `Recomendo uma abordagem ${recommendedMentality} para esta partida`,
      reasoning,
      confidence,
      expectedImpact: recommendedMentality === 'attacking' ? 20 : recommendedMentality === 'defensive' ? -20 : 0,
      recommendation: { mentality: recommendedMentality },
      context: {},
      factors: [
        {
          name: 'attack_vs_defense',
          value: yourAttack - opponentDefense,
          weight: 0.6,
          description: `Your attack (${yourAttack}) vs their defense (${opponentDefense})`
        },
        {
          name: 'defense_vs_attack',
          value: yourDefense - opponentAttack,
          weight: 0.4,
          description: `Your defense (${yourDefense}) vs their attack (${opponentAttack})`
        }
      ],
    };
  }

  /**
   * Recommend pressing intensity
   */
  private recommendPressing(
    yourTeam: Team,
    opponentTeam: Team,
    weather: string,
    prng: any
  ): TacticalRecommendation | null {
    let recommendedPressing: 'low' | 'medium' | 'high' | null = null;
    let reasoning = '';
    let confidence = 50;

    // Weather considerations
    if (weather === 'rain' || weather === 'snow') {
      recommendedPressing = 'medium';
      reasoning = 'Weather limits pressing';
      confidence = 70;
    }
    // If opponent likes slow buildup
    else if (opponentTeam.tactics.tempo === 'slow') {
      recommendedPressing = 'high';
      reasoning = 'Disrupt slow buildup';
      confidence = 75;
    }
    // If opponent plays fast tempo
    else if (opponentTeam.tactics.tempo === 'fast') {
      recommendedPressing = 'low';
      reasoning = 'Let them make mistakes';
      confidence = 65;
    }

    if (!recommendedPressing || recommendedPressing === yourTeam.tactics.pressing) {
      return null;
    }

    return {
      id: `TAC-PRESS-${Date.now()}`,
      type: 'pressing',
      priority: 'low',
      title: `Pressão ${recommendedPressing}`,
      description: `Ajustar intensidade da marcação para ${recommendedPressing}`,
      reasoning,
      confidence,
      expectedImpact: recommendedPressing === 'high' ? 10 : recommendedPressing === 'low' ? -5 : 0,
      recommendation: { pressing: recommendedPressing },
      context: { weather },
      factors: [
        {
          name: 'opponent_tempo',
          value: opponentTeam.tactics.tempo === 'fast' ? 80 : 40,
          weight: 0.6,
          description: `Opponent plays ${opponentTeam.tactics.tempo} tempo`
        },
        {
          name: 'weather_condition',
          value: weather === 'clear' ? 100 : 60,
          weight: 0.4,
          description: `Weather: ${weather}`
        }
      ],
    };
  }

  /**
   * Recommend weather-specific tactics
   */
  private recommendWeatherTactics(
    weather: string,
    team: Team,
    prng: any
  ): TacticalRecommendation | null {
    if (weather === 'clear') return null;

    let recommendation: any = {};
    let reasoning = '';
    let confidence = 60;
    let impact = 0;

    switch (weather) {
      case 'rain':
        if (team.tactics.tempo === 'fast') {
          recommendation.tempo = 'medium';
          reasoning = 'Slower tempo for ball control';
          confidence = 70;
          impact = -5;
        }
        break;
      case 'snow':
        recommendation.tempo = 'slow';
        recommendation.pressing = 'low';
        reasoning = 'Cautious approach in snow';
        confidence = 80;
        impact = -10;
        break;
      case 'wind':
        if (team.tactics.width === 'wide') {
          recommendation.width = 'normal';
          reasoning = 'Wind affects wide play';
          confidence = 65;
          impact = -3;
        }
        break;
    }

    if (Object.keys(recommendation).length === 0) return null;

    return {
      id: `TAC-WEATHER-${Date.now()}`,
      type: 'instruction',
      priority: 'low',
      title: `Ajuste para ${weather}`,
      description: `Adaptar táticas às condições climáticas`,
      reasoning,
      confidence,
      expectedImpact: impact,
      recommendation,
      context: { weather },
      factors: [
        {
          name: 'weather_impact',
          value: weather === 'snow' ? 90 : weather === 'rain' ? 70 : 50,
          weight: 1.0,
          description: `${weather} conditions affect gameplay`
        }
      ],
    };
  }

  /**
   * Recommend player instructions
   */
  private recommendPlayerInstructions(
    yourTeam: Team,
    opponentTeam: Team,
    prng: any
  ): TacticalRecommendation[] {
    const recommendations: TacticalRecommendation[] = [];

    // Find key players to target or protect
    const opponentKeyPlayers = this.identifyKeyPlayers(opponentTeam);
    const yourKeyPlayers = this.identifyKeyPlayers(yourTeam);

    // Recommend marking key opponent players
    if (opponentKeyPlayers.length > 0) {
      const keyPlayer = opponentKeyPlayers[0];
      recommendations.push({
        id: `TAC-MARK-${Date.now()}`,
        type: 'instruction',
        priority: 'medium',
        title: `Marcar ${keyPlayer.name}`,
        description: `Designar marcação especial para neutralizar ${keyPlayer.name}`,
        reasoning: 'Neutralize key threat',
        confidence: 70,
        expectedImpact: -8,
        recommendation: {
          playerInstructions: {
            [keyPlayer.id]: 'tight_marking'
          }
        },
        context: {},
        factors: [
          {
            name: 'threat_level',
            value: 85,
            weight: 1.0,
            description: `${keyPlayer.name} is opponent's key player`
          }
        ],
      });
    }

    return recommendations;
  }

  /**
   * Generate comeback tactics when losing
   */
  private recommendComebackTactics(context: MatchContext, prng: any): TacticalRecommendation {
    const scoreDiff = context.currentScore.away - context.currentScore.home;
    const timeLeft = 90 - context.minute;
    
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (timeLeft < 20 && scoreDiff > 0) urgency = 'high';
    if (timeLeft < 10 && scoreDiff > 0) urgency = 'critical';

    const recommendation: any = {
      mentality: 'attacking',
      tempo: 'fast',
    };

    if (timeLeft < 15) {
      recommendation.width = 'wide';
    }

    return {
      id: `TAC-COMEBACK-${Date.now()}`,
      type: 'mentality',
      priority: urgency,
      title: 'Buscar o empate',
      description: 'Intensificar ataques para reverter o resultado',
      reasoning: `${timeLeft}min left, need goals`,
      confidence: 80,
      expectedImpact: 25,
      recommendation,
      context: {
        minute: context.minute,
        score: context.currentScore,
      },
      factors: [
        {
          name: 'time_pressure',
          value: Math.max(0, 100 - timeLeft * 2),
          weight: 0.7,
          description: `${timeLeft} minutes remaining`
        },
        {
          name: 'score_deficit',
          value: Math.min(100, scoreDiff * 30),
          weight: 0.3,
          description: `${scoreDiff} goal(s) behind`
        }
      ],
    };
  }

  /**
   * Generate tactics to protect lead
   */
  private recommendProtectLeadTactics(context: MatchContext, prng: any): TacticalRecommendation {
    const scoreDiff = context.currentScore.home - context.currentScore.away;
    const timeLeft = 90 - context.minute;

    return {
      id: `TAC-PROTECT-${Date.now()}`,
      type: 'mentality',
      priority: timeLeft < 20 ? 'high' : 'medium',
      title: 'Proteger vantagem',
      description: 'Adotar postura mais defensiva para manter o resultado',
      reasoning: `${scoreDiff} goal lead, ${timeLeft}min left`,
      confidence: 75,
      expectedImpact: -15,
      recommendation: {
        mentality: 'defensive',
        tempo: 'slow',
        pressing: 'low',
      },
      context: {
        minute: context.minute,
        score: context.currentScore,
      },
      factors: [
        {
          name: 'lead_size',
          value: Math.min(100, scoreDiff * 40),
          weight: 0.5,
          description: `${scoreDiff} goal advantage`
        },
        {
          name: 'time_remaining',
          value: Math.max(0, 100 - timeLeft * 2),
          weight: 0.5,
          description: `${timeLeft} minutes to hold`
        }
      ],
    };
  }

  /**
   * Recommend possession improvement tactics
   */
  private recommendPossessionImprovement(context: MatchContext, prng: any): TacticalRecommendation {
    return {
      id: `TAC-POSS-${Date.now()}`,
      type: 'tempo',
      priority: 'medium',
      title: 'Melhorar posse de bola',
      description: 'Reduzir ritmo para manter mais posse e controlar o jogo',
      reasoning: `${context.possession.home.toFixed(0)}% possession`,
      confidence: 70,
      expectedImpact: 5,
      recommendation: {
        tempo: 'slow',
        width: 'normal',
      },
      context: {
        possession: context.possession,
      },
      factors: [
        {
          name: 'possession_deficit',
          value: 100 - context.possession.home,
          weight: 1.0,
          description: `Only ${context.possession.home.toFixed(0)}% possession`
        }
      ],
    };
  }

  /**
   * Recommend stamina management
   */
  private recommendStaminaManagement(
    context: MatchContext,
    tiredPlayers: Player[],
    prng: any
  ): TacticalRecommendation {
    const worstPlayer = tiredPlayers[0];
    
    return {
      id: `TAC-STAMINA-${Date.now()}`,
      type: 'substitution',
      priority: 'high',
      title: `Substituir ${worstPlayer.name}`,
      description: `${worstPlayer.name} está cansado e pode comprometer o desempenho`,
      reasoning: `Low stamina: ${context.playerStamina[worstPlayer.id]}%`,
      confidence: 85,
      expectedImpact: 10,
      recommendation: {
        substitution: {
          out: worstPlayer.id,
          reason: 'stamina'
        }
      },
      context: {
        minute: context.minute,
      },
      factors: [
        {
          name: 'stamina_level',
          value: 100 - (context.playerStamina[worstPlayer.id] || 100),
          weight: 1.0,
          description: `${worstPlayer.name} stamina: ${context.playerStamina[worstPlayer.id] || 100}%`
        }
      ],
    };
  }

  /**
   * Recommend momentum-based tactics
   */
  private recommendMomentumTactics(context: MatchContext, prng: any): TacticalRecommendation {
    const momentum = context.momentum;
    
    if (momentum > 50) {
      // Positive momentum - press advantage
      return {
        id: `TAC-MOMENTUM-${Date.now()}`,
        type: 'tempo',
        priority: 'medium',
        title: 'Aproveitar momentum',
        description: 'Aumentar ritmo para capitalizar o bom momento',
        reasoning: 'Positive momentum',
        confidence: 70,
        expectedImpact: 15,
        recommendation: {
          tempo: 'fast',
          pressing: 'high',
        },
        context: { momentum },
        factors: [
          {
            name: 'momentum_level',
            value: momentum,
            weight: 1.0,
            description: `Strong positive momentum: ${momentum}`
          }
        ],
      };
    } else {
      // Negative momentum - stabilize
      return {
        id: `TAC-STABILIZE-${Date.now()}`,
        type: 'tempo',
        priority: 'medium',
        title: 'Estabilizar jogo',
        description: 'Reduzir ritmo para recuperar controle',
        reasoning: 'Negative momentum',
        confidence: 70,
        expectedImpact: -10,
        recommendation: {
          tempo: 'slow',
          mentality: 'balanced',
        },
        context: { momentum },
        factors: [
          {
            name: 'momentum_level',
            value: Math.abs(momentum),
            weight: 1.0,
            description: `Negative momentum: ${momentum}`
          }
        ],
      };
    }
  }

  /**
   * Analyze first half performance
   */
  private analyzeFirstHalfPerformance(context: MatchContext): {
    possessionEfficiency: number;
    attackingThreat: number;
    defensiveStability: number;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Possession analysis
    let possessionEfficiency = 50;
    if (context.possession.home > 60) {
      possessionEfficiency = 80;
    } else if (context.possession.home < 40) {
      possessionEfficiency = 30;
      issues.push('low_possession');
    }

    // Attacking threat (based on recent events)
    const attackingEvents = context.recentEvents.filter(e => 
      e.team === 'home' && ['shot', 'goal', 'chance'].includes(e.type)
    );
    const attackingThreat = Math.min(100, attackingEvents.length * 20);

    // Defensive stability
    const defensiveEvents = context.recentEvents.filter(e => 
      e.team === 'away' && ['shot', 'goal', 'chance'].includes(e.type)
    );
    const defensiveStability = Math.max(0, 100 - defensiveEvents.length * 15);

    if (attackingThreat < 40) issues.push('poor_attack');
    if (defensiveStability < 60) issues.push('defensive_issues');

    return {
      possessionEfficiency,
      attackingThreat,
      defensiveStability,
      issues,
    };
  }

  /**
   * Find tired players
   */
  private findTiredPlayers(context: MatchContext): Player[] {
    const tiredThreshold = 60;
    
    return context.homeTeam.players.filter(player => {
      const stamina = context.playerStamina[player.id] || 100;
      return stamina < tiredThreshold;
    }).sort((a, b) => {
      const staminaA = context.playerStamina[a.id] || 100;
      const staminaB = context.playerStamina[b.id] || 100;
      return staminaA - staminaB; // Most tired first
    });
  }

  /**
   * Identify key players in a team
   */
  private identifyKeyPlayers(team: Team): Player[] {
    return team.players
      .sort((a, b) => {
        // Simple rating based on key attributes
        const ratingA = this.calculateSimpleRating(a);
        const ratingB = this.calculateSimpleRating(b);
        return ratingB - ratingA;
      })
      .slice(0, 3); // Top 3 players
  }

  /**
   * Calculate simple player rating for key player identification
   */
  private calculateSimpleRating(player: Player): number {
    const attrs = player.attributes;
    const positionWeights = this.getPositionWeights(player.position);
    
    let rating = 0;
    let totalWeight = 0;
    
    Object.entries(positionWeights).forEach(([attr, weight]) => {
      const value = attrs[attr as keyof typeof attrs] as number;
      if (typeof value === 'number') {
        rating += value * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? rating / totalWeight : 10;
  }

  /**
   * Get position-specific attribute weights
   */
  private getPositionWeights(position: string): Record<string, number> {
    const weights: Record<string, Record<string, number>> = {
      ST: { finishing: 3, pace: 2, positioning: 2, technique: 1 },
      MC: { passing: 3, decisions: 2, technique: 2, stamina: 1 },
      DC: { tackling: 3, positioning: 2, strength: 2, anticipation: 1 },
      GK: { handling: 3, reflexes: 3, positioning: 2, kicking: 1 },
    };

    return weights[position] || weights.MC;
  }

  /**
   * Analyze team characteristics
   */
  private analyzeTeam(team: Team): {
    averageAge: number;
    averageStamina: number;
    keyStrengths: string[];
    keyWeaknesses: string[];
  } {
    const ages = team.players.map(p => p.age);
    const staminas = team.players.map(p => p.stamina);
    
    const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
    const averageStamina = staminas.reduce((sum, stamina) => sum + stamina, 0) / staminas.length;

    // Simplified strength/weakness analysis
    const keyStrengths: string[] = [];
    const keyWeaknesses: string[] = [];

    if (averageStamina > 85) keyStrengths.push('high_fitness');
    else if (averageStamina < 70) keyWeaknesses.push('fitness_concerns');

    if (averageAge < 25) keyStrengths.push('youthful_energy');
    else if (averageAge > 30) keyWeaknesses.push('aging_squad');

    return {
      averageAge,
      averageStamina,
      keyStrengths,
      keyWeaknesses,
    };
  }

  /**
   * Log tactical decisions for audit
   */
  private log(
    action: string,
    matchId: string,
    minute: number,
    recommendation: string,
    reasoning: string,
    confidence: number,
    seed: number,
    context: any
  ): void {
    this.logs.push({
      timestamp: new Date().toISOString(),
      matchId,
      minute,
      recommendation,
      reasoning,
      confidence,
      seed,
      context,
    });
  }

  /**
   * Get audit logs
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Clear old logs
   */
  clearOldLogs(): void {
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(-500);
    }
  }
}

/**
 * Tactical recommendation validator
 */
export class TacticalRecommendationValidator {
  /**
   * Validate that recommendation makes tactical sense
   */
  static validateRecommendation(
    recommendation: TacticalRecommendation,
    context: MatchContext
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check confidence threshold
    if (recommendation.confidence < 30) {
      issues.push('Confidence too low');
    }

    // Check reasoning length (GDD requirement: ≤140 chars)
    if (recommendation.reasoning.length > 140) {
      issues.push('Reasoning too long');
    }

    // Check logical consistency
    if (recommendation.type === 'substitution' && context.minute < 30) {
      issues.push('Too early for substitution');
    }

    if (recommendation.priority === 'critical' && recommendation.confidence < 70) {
      issues.push('Critical priority requires high confidence');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

/**
 * Export utilities for testing
 */
export function createMockMatchContext(): MatchContext {
  return {
    homeTeam: {
      id: 'HOME-001',
      name: 'Home FC',
      players: [],
      tactics: {
        formation: '4-4-2',
        mentality: 'balanced',
        pressing: 'medium',
        tempo: 'medium',
        width: 'normal',
      },
      overallRating: 100,
    },
    awayTeam: {
      id: 'AWAY-001',
      name: 'Away United',
      players: [],
      tactics: {
        formation: '4-3-3',
        mentality: 'attacking',
        pressing: 'high',
        tempo: 'fast',
        width: 'wide',
      },
      overallRating: 110,
    },
    currentScore: { home: 0, away: 1 },
    minute: 45,
    possession: { home: 45, away: 55 },
    momentum: -20,
    weather: 'clear',
    playerStamina: {},
    recentEvents: [
      { type: 'goal', team: 'away', minute: 23 },
      { type: 'shot', team: 'home', minute: 34 },
    ],
  };
}
