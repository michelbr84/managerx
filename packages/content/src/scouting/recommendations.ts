// Intelligent scouting recommendation system

import type { Player, Club } from '../schema.js';
import { createPrng } from '../../core-sim/src/prng.js';

export interface ScoutingCriteria {
  position: string[];
  maxAge?: number;
  minAge?: number;
  maxValue?: number;
  minPotential?: number;
  minCurrentAbility?: number;
  nationality?: string[];
  league?: string[];
  contractSituation?: 'expiring' | 'long_term' | 'any';
  priority: 'immediate' | 'future' | 'bargain' | 'star';
}

export interface ScoutingRecommendation {
  playerId: string;
  playerName: string;
  score: number; // 0-100 recommendation score
  confidence: number; // 0-100 confidence in assessment
  reasoning: string; // Why this player is recommended
  factors: Array<{
    name: string;
    value: number;
    weight: number;
    description: string;
  }>;
  estimatedValue: number;
  risk: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  alternatives: string[]; // Similar player IDs
}

export interface ScoutingReport {
  id: string;
  playerId: string;
  scoutId: string;
  generatedAt: string;
  gameDate: string;
  seed: number;
  content: string; // Markdown content
  rating: number; // 1-100
  uncertainty: number; // ±
  attributes: Record<string, { value: number; confidence: number }>;
  summary: string;
  recommendation: 'strong_buy' | 'buy' | 'monitor' | 'pass';
  tags: string[];
}

export interface ScoutingContext {
  clubId: string;
  budget: number;
  currentSquad: Player[];
  leaguePosition: number;
  seasonPhase: 'early' | 'mid' | 'late';
  transferWindow: boolean;
  managerPreferences: {
    preferredFormation: string;
    playingStyle: 'defensive' | 'balanced' | 'attacking';
    agePolicy: 'youth' | 'experience' | 'mixed';
    budgetPolicy: 'conservative' | 'moderate' | 'aggressive';
  };
}

export class ScoutingAI {
  private logs: Array<{
    timestamp: string;
    action: string;
    playerId: string;
    reasoning: string;
    score: number;
    seed: number;
  }> = [];

  /**
   * Generate multi-factor recommendations for players
   */
  generateRecommendations(
    players: Player[],
    criteria: ScoutingCriteria,
    context: ScoutingContext,
    seed: number,
    limit: number = 10
  ): ScoutingRecommendation[] {
    const prng = createPrng(`scouting:${seed}:${context.clubId}`);
    const recommendations: ScoutingRecommendation[] = [];

    // Filter players based on basic criteria
    const eligiblePlayers = this.filterPlayers(players, criteria, context);

    for (const player of eligiblePlayers) {
      const recommendation = this.evaluatePlayer(player, criteria, context, prng);
      
      if (recommendation.score > 30) { // Minimum threshold
        recommendations.push(recommendation);
        
        this.log('evaluated', player.id, recommendation.reasoning, recommendation.score, prng.next());
      }
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Generate detailed scouting report for a specific player
   */
  generateScoutingReport(
    player: Player,
    scoutId: string,
    context: ScoutingContext,
    seed: number
  ): ScoutingReport {
    const prng = createPrng(`report:${seed}:${player.id}:${scoutId}`);
    
    // Calculate uncertainty based on observations
    const baseUncertainty = 15;
    const uncertainty = Math.max(3, baseUncertainty - (prng.next() * 8)); // 3-15 range
    
    // Generate attribute assessments with confidence
    const attributeAssessments: Record<string, { value: number; confidence: number }> = {};
    
    Object.entries(player.attributes).forEach(([attr, value]) => {
      if (typeof value === 'number') {
        const confidence = 60 + prng.next() * 35; // 60-95% confidence
        const noise = (prng.next() - 0.5) * uncertainty * 0.4;
        const assessedValue = Math.max(1, Math.min(20, Math.round(value + noise)));
        
        attributeAssessments[attr] = {
          value: assessedValue,
          confidence: Math.round(confidence)
        };
      }
    });

    // Generate overall rating
    const rating = this.calculateOverallRating(attributeAssessments, player.position);
    
    // Generate markdown report
    const content = this.generateReportContent(player, attributeAssessments, rating, uncertainty, context, prng);
    
    // Determine recommendation
    const recommendation = this.getRecommendation(rating, player, context);
    
    // Generate summary
    const summary = this.generateSummary(player, rating, recommendation, context);

    return {
      id: `SR-${Date.now()}-${Math.floor(prng.next() * 1000)}`,
      playerId: player.id,
      scoutId,
      generatedAt: new Date().toISOString(),
      gameDate: context.clubId, // Should be actual game date
      seed,
      content,
      rating,
      uncertainty,
      attributes: attributeAssessments,
      summary,
      recommendation,
      tags: this.generateTags(player, rating, context),
    };
  }

  /**
   * Filter players based on criteria
   */
  private filterPlayers(
    players: Player[],
    criteria: ScoutingCriteria,
    context: ScoutingContext
  ): Player[] {
    return players.filter(player => {
      // Position filter
      if (criteria.position.length > 0 && !criteria.position.includes(player.position)) {
        return false;
      }

      // Age filters
      if (criteria.maxAge && player.age > criteria.maxAge) return false;
      if (criteria.minAge && player.age < criteria.minAge) return false;

      // Ability filters
      if (criteria.minCurrentAbility && player.ca < criteria.minCurrentAbility) return false;
      if (criteria.minPotential && player.pa < criteria.minPotential) return false;

      // Value filter (estimated)
      const estimatedValue = this.estimatePlayerValue(player);
      if (criteria.maxValue && estimatedValue > criteria.maxValue) return false;

      // Nationality filter
      if (criteria.nationality && criteria.nationality.length > 0 && 
          !criteria.nationality.includes(player.nationality)) {
        return false;
      }

      // Don't recommend players from same club
      if (player.clubId === context.clubId) return false;

      return true;
    });
  }

  /**
   * Evaluate individual player and generate recommendation
   */
  private evaluatePlayer(
    player: Player,
    criteria: ScoutingCriteria,
    context: ScoutingContext,
    prng: any
  ): ScoutingRecommendation {
    const factors: Array<{
      name: string;
      value: number;
      weight: number;
      description: string;
    }> = [];

    let totalScore = 0;
    let totalWeight = 0;

    // Factor 1: Current Ability vs Squad Need
    const squadNeed = this.assessSquadNeed(player.position, context.currentSquad);
    const abilityScore = (player.ca / 200) * 100; // Normalize to 0-100
    const abilityFactor = {
      name: 'current_ability',
      value: abilityScore,
      weight: 0.3,
      description: `CA ${player.ca} - ${this.getAbilityDescription(player.ca)}`
    };
    factors.push(abilityFactor);
    totalScore += abilityScore * abilityFactor.weight;
    totalWeight += abilityFactor.weight;

    // Factor 2: Potential vs Age
    const potentialScore = this.calculatePotentialScore(player.ca, player.pa, player.age);
    const potentialFactor = {
      name: 'potential',
      value: potentialScore,
      weight: criteria.priority === 'future' ? 0.4 : 0.2,
      description: `PA ${player.pa} - ${this.getPotentialDescription(potentialScore)}`
    };
    factors.push(potentialFactor);
    totalScore += potentialScore * potentialFactor.weight;
    totalWeight += potentialFactor.weight;

    // Factor 3: Value for Money
    const estimatedValue = this.estimatePlayerValue(player);
    const valueScore = this.calculateValueScore(estimatedValue, player.ca, context.budget);
    const valueFactor = {
      name: 'value',
      value: valueScore,
      weight: criteria.priority === 'bargain' ? 0.4 : 0.2,
      description: `€${(estimatedValue / 1000000).toFixed(1)}M - ${this.getValueDescription(valueScore)}`
    };
    factors.push(valueFactor);
    totalScore += valueScore * valueFactor.weight;
    totalWeight += valueFactor.weight;

    // Factor 4: Squad Fit
    const fitScore = this.calculateSquadFit(player, context);
    const fitFactor = {
      name: 'squad_fit',
      value: fitScore,
      weight: 0.2,
      description: this.getSquadFitDescription(fitScore, squadNeed)
    };
    factors.push(fitFactor);
    totalScore += fitScore * fitFactor.weight;
    totalWeight += fitFactor.weight;

    // Factor 5: Contract Situation
    const contractScore = this.calculateContractScore(player);
    const contractFactor = {
      name: 'contract',
      value: contractScore,
      weight: 0.1,
      description: this.getContractDescription(player.contract.expires, contractScore)
    };
    factors.push(contractFactor);
    totalScore += contractScore * contractFactor.weight;
    totalWeight += contractFactor.weight;

    // Normalize final score
    const finalScore = Math.round((totalScore / totalWeight) * (0.8 + prng.next() * 0.4)); // Add some variance

    // Calculate confidence based on factors alignment
    const confidence = this.calculateConfidence(factors, prng);

    // Generate reasoning
    const reasoning = this.generateReasoning(factors, player, criteria);

    // Assess risk
    const risk = this.assessRisk(player, estimatedValue, context);

    // Determine urgency
    const urgency = this.determineUrgency(player, criteria, context);

    return {
      playerId: player.id,
      playerName: player.name,
      score: finalScore,
      confidence,
      reasoning,
      factors,
      estimatedValue,
      risk,
      urgency,
      alternatives: [], // TODO: Find similar players
    };
  }

  /**
   * Calculate potential score considering age curve
   */
  private calculatePotentialScore(ca: number, pa: number, age: number): number {
    const potentialGap = pa - ca;
    const ageMultiplier = age <= 21 ? 1.0 : age <= 25 ? 0.8 : age <= 28 ? 0.5 : 0.2;
    
    return Math.min(100, (potentialGap / 50) * 100 * ageMultiplier);
  }

  /**
   * Calculate value for money score
   */
  private calculateValueScore(value: number, ca: number, budget: number): number {
    const valuePerCA = value / ca;
    const budgetRatio = value / budget;
    
    // Lower value per CA is better, but very cheap might be suspicious
    let score = Math.max(0, 100 - (valuePerCA / 100000) * 100);
    
    // Penalize if too expensive for budget
    if (budgetRatio > 0.5) {
      score *= 0.5;
    } else if (budgetRatio > 0.3) {
      score *= 0.8;
    }
    
    return Math.min(100, score);
  }

  /**
   * Calculate how well player fits current squad
   */
  private calculateSquadFit(player: Player, context: ScoutingContext): number {
    const positionNeed = this.assessSquadNeed(player.position, context.currentSquad);
    const ageBalance = this.assessAgeBalance(player.age, context);
    const styleMatch = this.assessStyleMatch(player, context);
    
    return (positionNeed * 0.5 + ageBalance * 0.2 + styleMatch * 0.3);
  }

  /**
   * Assess squad need for position
   */
  private assessSquadNeed(position: string, squad: Player[]): number {
    const positionPlayers = squad.filter(p => p.position === position);
    const positionGroups = {
      'GK': { min: 2, max: 3, current: positionPlayers.length },
      'DC': { min: 3, max: 5, current: positionPlayers.length },
      'FB': { min: 2, max: 4, current: squad.filter(p => ['DL', 'DR', 'WBL', 'WBR'].includes(p.position)).length },
      'MC': { min: 3, max: 6, current: squad.filter(p => ['MC', 'ML', 'MR'].includes(p.position)).length },
      'AM': { min: 2, max: 4, current: squad.filter(p => ['AMC', 'AML', 'AMR'].includes(p.position)).length },
      'ST': { min: 2, max: 4, current: squad.filter(p => p.position === 'ST').length },
    };

    // Simplified position grouping
    const group = position === 'GK' ? 'GK' : 
                  ['DC'].includes(position) ? 'DC' :
                  ['DL', 'DR', 'WBL', 'WBR'].includes(position) ? 'FB' :
                  ['MC', 'ML', 'MR'].includes(position) ? 'MC' :
                  ['AMC', 'AML', 'AMR'].includes(position) ? 'AM' : 'ST';

    const groupData = positionGroups[group as keyof typeof positionGroups];
    
    if (groupData.current < groupData.min) {
      return 100; // High need
    } else if (groupData.current >= groupData.max) {
      return 20; // Low need
    } else {
      return 60; // Medium need
    }
  }

  /**
   * Assess age balance in squad
   */
  private assessAgeBalance(playerAge: number, context: ScoutingContext): number {
    const squadAges = context.currentSquad.map(p => p.age);
    const averageAge = squadAges.reduce((sum, age) => sum + age, 0) / squadAges.length;
    
    if (context.managerPreferences.agePolicy === 'youth' && playerAge <= 23) {
      return 90;
    } else if (context.managerPreferences.agePolicy === 'experience' && playerAge >= 28) {
      return 90;
    } else if (context.managerPreferences.agePolicy === 'mixed') {
      // Balance consideration
      if (averageAge > 28 && playerAge < 25) return 80;
      if (averageAge < 24 && playerAge > 27) return 80;
      return 60;
    }
    
    return 50;
  }

  /**
   * Assess playing style match
   */
  private assessStyleMatch(player: Player, context: ScoutingContext): number {
    const style = context.managerPreferences.playingStyle;
    const attrs = player.attributes;
    
    let score = 50; // Base score
    
    switch (style) {
      case 'attacking':
        if (['ST', 'AMC', 'AML', 'AMR'].includes(player.position)) {
          score += (attrs.finishing + attrs.pace + attrs.dribbling) * 2;
        }
        break;
      case 'defensive':
        if (['DC', 'DL', 'DR', 'MC'].includes(player.position)) {
          score += (attrs.tackling + attrs.positioning + attrs.strength) * 2;
        }
        break;
      case 'balanced':
        score += (attrs.passing + attrs.decisions + attrs.workRate) * 1.5;
        break;
    }
    
    return Math.min(100, score);
  }

  /**
   * Calculate contract situation score
   */
  private calculateContractScore(player: Player): number {
    const expiryDate = new Date(player.contract.expires);
    const now = new Date();
    const monthsLeft = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsLeft <= 6) {
      return 90; // Expiring soon - good opportunity
    } else if (monthsLeft <= 18) {
      return 70; // Reasonable negotiation window
    } else {
      return 40; // Long contract - harder to negotiate
    }
  }

  /**
   * Calculate confidence in recommendation
   */
  private calculateConfidence(factors: any[], prng: any): number {
    const variance = factors.reduce((sum, factor) => {
      return sum + Math.abs(factor.value - 50) * factor.weight;
    }, 0);
    
    let confidence = 50 + variance * 0.5;
    confidence += (prng.next() - 0.5) * 20; // Add some randomness
    
    return Math.max(10, Math.min(95, Math.round(confidence)));
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(factors: any[], player: Player, criteria: ScoutingCriteria): string {
    const topFactors = factors
      .sort((a, b) => (b.value * b.weight) - (a.value * a.weight))
      .slice(0, 2);

    const reasons = topFactors.map(factor => {
      if (factor.value > 70) {
        return `strong ${factor.name}`;
      } else if (factor.value > 50) {
        return `good ${factor.name}`;
      } else {
        return `concerns about ${factor.name}`;
      }
    });

    const ageComment = player.age <= 23 ? 'young talent' : 
                      player.age <= 28 ? 'experienced player' : 'veteran';

    return `${ageComment} with ${reasons.join(' and ')}`;
  }

  /**
   * Assess investment risk
   */
  private assessRisk(player: Player, value: number, context: ScoutingContext): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Age risk
    if (player.age > 30) riskScore += 30;
    else if (player.age > 28) riskScore += 15;

    // Value risk relative to budget
    const budgetRatio = value / context.budget;
    if (budgetRatio > 0.5) riskScore += 40;
    else if (budgetRatio > 0.3) riskScore += 20;

    // Potential vs current ability risk
    const potentialGap = player.pa - player.ca;
    if (potentialGap < 10) riskScore += 20; // Low growth potential

    // Injury history (simplified)
    if (player.condition < 80) riskScore += 15;

    if (riskScore > 60) return 'high';
    if (riskScore > 30) return 'medium';
    return 'low';
  }

  /**
   * Determine transfer urgency
   */
  private determineUrgency(
    player: Player,
    criteria: ScoutingCriteria,
    context: ScoutingContext
  ): 'low' | 'medium' | 'high' {
    if (criteria.priority === 'immediate') return 'high';
    
    const contractMonths = this.getContractMonthsLeft(player.contract.expires);
    if (contractMonths <= 6) return 'high';
    if (contractMonths <= 18) return 'medium';
    
    const squadNeed = this.assessSquadNeed(player.position, context.currentSquad);
    if (squadNeed > 80) return 'high';
    if (squadNeed > 60) return 'medium';
    
    return 'low';
  }

  /**
   * Generate markdown report content
   */
  private generateReportContent(
    player: Player,
    attributes: Record<string, { value: number; confidence: number }>,
    rating: number,
    uncertainty: number,
    context: ScoutingContext,
    prng: any
  ): string {
    const strengthAttrs = Object.entries(attributes)
      .filter(([_, data]) => data.value >= 15)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 3);

    const weaknessAttrs = Object.entries(attributes)
      .filter(([_, data]) => data.value <= 10)
      .sort((a, b) => a[1].value - b[1].value)
      .slice(0, 2);

    return `# Relatório de Scouting: ${player.name}

## Informações Básicas
- **Posição**: ${player.position}
- **Idade**: ${player.age} anos
- **Nacionalidade**: ${player.nationality}
- **Clube Atual**: ${player.clubId}

## Avaliação Geral
**Rating**: ${rating}/100 (±${uncertainty})

${this.getOverallAssessment(rating)}

## Pontos Fortes
${strengthAttrs.map(([attr, data]) => 
  `- **${this.translateAttribute(attr)}**: ${data.value}/20 (${data.confidence}% confiança)`
).join('\n')}

## Áreas de Melhoria
${weaknessAttrs.map(([attr, data]) => 
  `- **${this.translateAttribute(attr)}**: ${data.value}/20 (${data.confidence}% confiança)`
).join('\n')}

## Análise Tática
${this.generateTacticalAnalysis(player, attributes, context)}

## Situação Contratual
- **Contrato expira**: ${new Date(player.contract.expires).toLocaleDateString('pt-BR')}
- **Salário atual**: €${player.contract.wage.toLocaleString()}/mês
${player.contract.releaseClause ? `- **Cláusula de rescisão**: €${player.contract.releaseClause.toLocaleString()}` : ''}

## Recomendação
${this.generateFinalRecommendation(rating, player, context)}

---
*Relatório gerado automaticamente pelo sistema de scouting ManagerX*`;
  }

  /**
   * Helper methods for report generation
   */
  private getOverallAssessment(rating: number): string {
    if (rating >= 85) return 'Jogador excepcional com qualidades raras. Altamente recomendado.';
    if (rating >= 75) return 'Jogador de alta qualidade que pode fazer diferença imediata.';
    if (rating >= 65) return 'Jogador sólido com potencial de contribuição significativa.';
    if (rating >= 50) return 'Jogador médio que pode servir como opção de elenco.';
    return 'Jogador abaixo do padrão necessário para o clube.';
  }

  private translateAttribute(attr: string): string {
    const translations: Record<string, string> = {
      finishing: 'Finalização',
      passing: 'Passe',
      pace: 'Velocidade',
      strength: 'Força',
      tackling: 'Desarme',
      positioning: 'Posicionamento',
      decisions: 'Decisões',
      technique: 'Técnica',
      dribbling: 'Drible',
      crossing: 'Cruzamento',
    };
    return translations[attr] || attr;
  }

  private generateTacticalAnalysis(
    player: Player,
    attributes: Record<string, { value: number; confidence: number }>,
    context: ScoutingContext
  ): string {
    const formation = context.managerPreferences.preferredFormation;
    const style = context.managerPreferences.playingStyle;
    
    let analysis = `Adequação para ${formation}: `;
    
    // Position-specific analysis
    switch (player.position) {
      case 'ST':
        const finishing = attributes.finishing?.value || 10;
        const pace = attributes.pace?.value || 10;
        analysis += finishing > 15 ? 'Excelente finalizador' : 'Finalização adequada';
        analysis += pace > 15 ? ', com velocidade para contra-ataques' : '';
        break;
      case 'MC':
        const passing = attributes.passing?.value || 10;
        const decisions = attributes.decisions?.value || 10;
        analysis += passing > 15 ? 'Distribuição de qualidade' : 'Passe funcional';
        analysis += decisions > 15 ? ', com boa leitura de jogo' : '';
        break;
      default:
        analysis += 'Análise específica da posição em desenvolvimento.';
    }
    
    return analysis;
  }

  private generateFinalRecommendation(rating: number, player: Player, context: ScoutingContext): string {
    if (rating >= 80) {
      return `**FORTE RECOMENDAÇÃO**: ${player.name} é um alvo prioritário que pode elevar o nível da equipe imediatamente.`;
    } else if (rating >= 65) {
      return `**RECOMENDAÇÃO**: ${player.name} representa uma boa oportunidade de reforço para o elenco.`;
    } else if (rating >= 50) {
      return `**MONITORAR**: ${player.name} pode ser uma opção interessante dependendo das circunstâncias.`;
    } else {
      return `**NÃO RECOMENDADO**: ${player.name} não atende aos padrões necessários no momento.`;
    }
  }

  // Utility methods
  private estimatePlayerValue(player: Player): number {
    const baseValue = player.ca * 50000; // €50k per CA point
    const ageMultiplier = player.age <= 23 ? 1.5 : player.age <= 28 ? 1.2 : 0.8;
    const potentialMultiplier = (player.pa / player.ca) * 0.5 + 0.5;
    
    return Math.round(baseValue * ageMultiplier * potentialMultiplier);
  }

  private calculateOverallRating(attributes: Record<string, { value: number; confidence: number }>, position: string): number {
    const weights = this.getPositionWeights(position);
    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([attr, weight]) => {
      const attrData = attributes[attr];
      if (attrData) {
        totalScore += attrData.value * weight * (attrData.confidence / 100);
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 5) : 50; // Scale to 0-100
  }

  private getPositionWeights(position: string): Record<string, number> {
    const weights: Record<string, Record<string, number>> = {
      ST: { finishing: 3, pace: 2, positioning: 2, technique: 1.5, strength: 1 },
      MC: { passing: 3, decisions: 2, technique: 2, stamina: 1.5, vision: 1 },
      DC: { tackling: 3, positioning: 2, strength: 2, anticipation: 1.5, bravery: 1 },
      GK: { handling: 3, reflexes: 3, positioning: 2, kicking: 1, anticipation: 1 },
    };

    return weights[position] || weights.MC; // Default to MC weights
  }

  private getContractMonthsLeft(expiryDate: string): number {
    const expiry = new Date(expiryDate);
    const now = new Date();
    return (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
  }

  private getAbilityDescription(ca: number): string {
    if (ca >= 160) return 'World class';
    if (ca >= 140) return 'Excellent';
    if (ca >= 120) return 'Very good';
    if (ca >= 100) return 'Good';
    if (ca >= 80) return 'Average';
    return 'Below average';
  }

  private getPotentialDescription(score: number): string {
    if (score >= 80) return 'Exceptional growth potential';
    if (score >= 60) return 'Good development prospects';
    if (score >= 40) return 'Some room for improvement';
    return 'Limited growth expected';
  }

  private getValueDescription(score: number): string {
    if (score >= 80) return 'Excellent value';
    if (score >= 60) return 'Good value';
    if (score >= 40) return 'Fair value';
    return 'Overpriced';
  }

  private getSquadFitDescription(score: number, need: number): string {
    if (need > 80) return 'Fills critical squad gap';
    if (score > 70) return 'Excellent fit for tactics';
    if (score > 50) return 'Good squad addition';
    return 'Limited immediate impact';
  }

  private getContractDescription(expires: string, score: number): string {
    const months = this.getContractMonthsLeft(expires);
    if (months <= 6) return 'Contract expiring - opportunity';
    if (months <= 18) return 'Reasonable contract situation';
    return 'Long-term contract';
  }

  private generateSummary(player: Player, rating: number, recommendation: string, context: ScoutingContext): string {
    const ageDesc = player.age <= 23 ? 'young' : player.age <= 28 ? 'prime age' : 'experienced';
    const ratingDesc = rating >= 75 ? 'high-quality' : rating >= 60 ? 'solid' : 'average';
    
    return `${ageDesc} ${player.position} with ${ratingDesc} abilities - ${recommendation}`;
  }

  private generateTags(player: Player, rating: number, context: ScoutingContext): string[] {
    const tags: string[] = [player.position, player.nationality];
    
    if (player.age <= 23) tags.push('youth');
    if (player.age >= 30) tags.push('veteran');
    if (rating >= 80) tags.push('high_quality');
    if (rating < 60) tags.push('development');
    
    const contractMonths = this.getContractMonthsLeft(player.contract.expires);
    if (contractMonths <= 6) tags.push('expiring_contract');
    
    return tags;
  }

  private getRecommendation(rating: number, player: Player, context: ScoutingContext): 'strong_buy' | 'buy' | 'monitor' | 'pass' {
    if (rating >= 85) return 'strong_buy';
    if (rating >= 70) return 'buy';
    if (rating >= 55) return 'monitor';
    return 'pass';
  }

  /**
   * Log scouting decisions for audit
   */
  private log(action: string, playerId: string, reasoning: string, score: number, seed: number): void {
    this.logs.push({
      timestamp: new Date().toISOString(),
      action,
      playerId,
      reasoning,
      score,
      seed,
    });
  }

  /**
   * Get audit logs
   */
  getLogs() {
    return [...this.logs];
  }
}
