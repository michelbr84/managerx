// Core match simulation engine

import type { PseudoRandom } from './prng.js';
import { createPrng } from './prng.js';
import type {
  MatchContext,
  MatchResult,
  MatchEvent,
  MatchStats,
  SimulationState,
  Team,
  Player,
  Weather,
} from './types.js';
import {
  calculateAttackRating,
  calculateDefenseRating,
  calculateMidfieldRating,
  calculateStaminaDrain,
  calculatePossessionTendency,
  getTacticalMatchup,
  getTacticalXGModifier,
} from './tactics.js';
import { getWeatherEffects, applyWeatherModifier } from './weather.js';

// Constants for simulation tuning
const MINUTES_PER_HALF = 45;
const TICKS_PER_MINUTE = 4; // 15-second intervals
const BASE_EVENT_PROBABILITY = 0.15; // Base chance of event per tick
const GOAL_TO_SHOT_RATIO = 0.12; // ~12% of shots result in goals
const SHOT_ON_TARGET_RATIO = 0.4; // ~40% of shots are on target
const INJURY_PROBABILITY = 0.002; // Very low per tick
const CARD_PROBABILITY = 0.008; // Low per tick

/**
 * Main match simulation function
 */
export function simulateMatch(
  seed: number,
  homeTeamId: string,
  awayTeamId: string,
  homeTeam: Team,
  awayTeam: Team,
  weather: Weather = 'clear'
): MatchResult {
  const context: MatchContext = {
    homeTeam,
    awayTeam,
    weather,
    seed,
    homeAdvantage: 0.1, // 10% home advantage
  };

  const prng = createPrng(`match:${seed}:${homeTeamId}:${awayTeamId}`);
  
  // Initialize simulation state
  const state: SimulationState = initializeSimulationState(context);
  
  // Simulate both halves
  simulateHalf(state, context, prng, 1);
  simulateHalf(state, context, prng, 2);
  
  // Add stoppage time
  const stoppageTime = calculateStoppageTime(state, prng);
  state.minute += stoppageTime;
  
  // Simulate stoppage time events
  simulateStoppageTime(state, context, prng, stoppageTime);
  
  return {
    homeScore: state.homeScore,
    awayScore: state.awayScore,
    stats: state.stats,
    events: state.events,
    duration: state.minute,
  };
}

/**
 * Initialize simulation state
 */
function initializeSimulationState(context: MatchContext): SimulationState {
  const playerStamina: { [playerId: string]: number } = {};
  
  // Initialize player stamina
  [...context.homeTeam.players, ...context.awayTeam.players].forEach(player => {
    playerStamina[player.id] = player.stamina;
  });

  return {
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    possession: 'home',
    intensity: 50, // Start at medium intensity
    momentum: 0, // Neutral momentum
    events: [],
    playerStamina,
    stats: {
      possession: { home: 0, away: 0 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      xG: { home: 0, away: 0 },
      passes: { home: 0, away: 0 },
      passAccuracy: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 },
    },
  };
}

/**
 * Simulate a half of football
 */
function simulateHalf(
  state: SimulationState,
  context: MatchContext,
  prng: PseudoRandom,
  half: number
): void {
  const startMinute = (half - 1) * MINUTES_PER_HALF;
  const endMinute = half * MINUTES_PER_HALF;
  
  // Switch possession for second half
  if (half === 2) {
    state.possession = state.possession === 'home' ? 'away' : 'home';
  }
  
  for (let minute = startMinute; minute < endMinute; minute++) {
    state.minute = minute;
    
    // Simulate ticks within this minute
    for (let tick = 0; tick < TICKS_PER_MINUTE; tick++) {
      simulateTick(state, context, prng);
      updatePlayerStamina(state, context, prng);
    }
    
    // Update match intensity based on score and time
    updateMatchIntensity(state, context, prng);
  }
}

/**
 * Simulate a single tick (15 seconds of game time)
 */
function simulateTick(
  state: SimulationState,
  context: MatchContext,
  prng: PseudoRandom
): void {
  // Determine if an event occurs this tick
  const eventProbability = calculateEventProbability(state, context);
  
  if (prng.next() < eventProbability) {
    generateEvent(state, context, prng);
  }
  
  // Update possession periodically
  if (prng.next() < 0.1) { // 10% chance to change possession per tick
    updatePossession(state, context, prng);
  }
  
  // Update statistics
  updateTickStats(state, context, prng);
}

/**
 * Calculate probability of an event occurring this tick
 */
function calculateEventProbability(
  state: SimulationState,
  context: MatchContext
): number {
  let probability = BASE_EVENT_PROBABILITY;
  
  // Intensity affects event frequency
  probability *= (0.5 + state.intensity / 100);
  
  // Time-based modifiers
  if (state.minute > 80) {
    probability *= 1.3; // More events in final 10 minutes
  } else if (state.minute < 10) {
    probability *= 1.1; // Slightly more events early on
  }
  
  // Momentum affects event probability
  const momentumEffect = Math.abs(state.momentum) / 200; // 0 to 0.5
  probability *= (1 + momentumEffect);
  
  // Weather effects
  const weatherEffects = getWeatherEffects(context.weather);
  if (context.weather !== 'clear') {
    probability *= 1.1; // Adverse weather creates more events
  }
  
  return Math.min(0.4, probability); // Cap at 40%
}

/**
 * Generate a match event
 */
function generateEvent(
  state: SimulationState,
  context: MatchContext,
  prng: PseudoRandom
): void {
  const attackingTeam = state.possession;
  const defendingTeam = attackingTeam === 'home' ? 'away' : 'home';
  
  const team = attackingTeam === 'home' ? context.homeTeam : context.awayTeam;
  const opposingTeam = defendingTeam === 'home' ? context.homeTeam : context.awayTeam;
  
  // Calculate event weights based on team ratings and tactics
  const attackRating = calculateAttackRating(team);
  const defenseRating = calculateDefenseRating(opposingTeam);
  const advantage = attackRating - defenseRating;
  
  // Event type probabilities
  const eventWeights = calculateEventWeights(advantage, state, context);
  const eventType = selectWeightedEvent(eventWeights, prng);
  
  switch (eventType) {
    case 'shot':
      handleShotEvent(state, context, prng, attackingTeam);
      break;
    case 'chance':
      handleChanceEvent(state, context, prng, attackingTeam);
      break;
    case 'foul':
      handleFoulEvent(state, context, prng);
      break;
    case 'injury':
      handleInjuryEvent(state, context, prng);
      break;
    case 'corner':
      handleCornerEvent(state, context, prng, attackingTeam);
      break;
    default:
      // No significant event, just possession change
      updatePossession(state, context, prng);
  }
}

/**
 * Calculate event type weights based on current situation
 */
function calculateEventWeights(
  advantage: number,
  state: SimulationState,
  context: MatchContext
): Record<string, number> {
  const baseWeights = {
    shot: 20,
    chance: 15,
    foul: 10,
    injury: 1,
    corner: 8,
    nothing: 46,
  };
  
  // Adjust based on attacking advantage
  if (advantage > 20) {
    baseWeights.shot += 10;
    baseWeights.chance += 5;
  } else if (advantage < -20) {
    baseWeights.shot -= 5;
    baseWeights.foul += 5;
  }
  
  // Time-based adjustments
  if (state.minute > 80) {
    baseWeights.shot += 5; // More desperate attacks
    baseWeights.foul += 3; // More fouls as players tire
  }
  
  // Weather adjustments
  if (context.weather === 'rain' || context.weather === 'snow') {
    baseWeights.foul += 3; // Slippery conditions
    baseWeights.shot -= 2; // Harder to shoot accurately
  }
  
  return baseWeights;
}

/**
 * Select event type based on weights
 */
function selectWeightedEvent(
  weights: Record<string, number>,
  prng: PseudoRandom
): string {
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  let random = prng.next() * totalWeight;
  
  for (const [event, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return event;
    }
  }
  
  return 'nothing';
}

/**
 * Handle shot event
 */
function handleShotEvent(
  state: SimulationState,
  context: MatchContext,
  prng: PseudoRandom,
  attackingTeam: 'home' | 'away'
): void {
  const team = attackingTeam === 'home' ? context.homeTeam : context.awayTeam;
  const opposingTeam = attackingTeam === 'home' ? context.awayTeam : context.homeTeam;
  
  // Select shooting player (simplified - could be more sophisticated)
  const attackers = team.players.filter(p => 
    ['ST', 'AM', 'LM', 'RM'].includes(p.position)
  );
  const shooter = attackers.length > 0 
    ? attackers[prng.int(0, attackers.length)] 
    : team.players[0];
  
  if (!shooter) {
    console.warn('No shooter found for team', team.id);
    return;
  }
  
  // Calculate xG for this shot
  const xG = calculateShotXG(state, context, prng, attackingTeam, 'shot');
  
  // Update statistics
  state.stats.shots[attackingTeam]++;
  state.stats.xG[attackingTeam] += xG;
  
  // Determine if shot is on target
  const onTarget = prng.next() < SHOT_ON_TARGET_RATIO * (1 + xG);
  if (onTarget) {
    state.stats.shotsOnTarget[attackingTeam]++;
  }
  
  // Determine if it's a goal
  const isGoal = prng.next() < xG;
  
  if (isGoal) {
    // Goal!
    if (attackingTeam === 'home') {
      state.homeScore++;
    } else {
      state.awayScore++;
    }
    
    state.events.push({
      minute: state.minute,
      type: 'goal',
      team: attackingTeam,
      player: shooter.name,
      description: `GOAL! ${shooter.name} scores for ${team.name}`,
      xG,
    });
    
    // Momentum swing
    state.momentum += attackingTeam === 'home' ? 20 : -20;
    state.momentum = Math.max(-100, Math.min(100, state.momentum));
    
    // Increase intensity
    state.intensity = Math.min(100, state.intensity + 15);
    
  } else if (onTarget) {
    // Shot on target but saved
    state.events.push({
      minute: state.minute,
      type: 'shot',
      team: attackingTeam,
      player: shooter.name,
      description: `${shooter.name} forces a save from the goalkeeper`,
      xG,
    });
  } else {
    // Shot off target
    state.events.push({
      minute: state.minute,
      type: 'shot',
      team: attackingTeam,
      player: shooter.name,
      description: `${shooter.name} shoots wide`,
      xG,
    });
  }
  
  // Change possession after shot
  state.possession = attackingTeam === 'home' ? 'away' : 'home';
}

/**
 * Calculate xG (expected goals) for a shot
 */
function calculateShotXG(
  state: SimulationState,
  context: MatchContext,
  prng: PseudoRandom,
  attackingTeam: 'home' | 'away',
  shotType: 'shot' | 'header' | 'freekick'
): number {
  let baseXG = 0.1; // Base 10% chance
  
  const team = attackingTeam === 'home' ? context.homeTeam : context.awayTeam;
  const opposingTeam = attackingTeam === 'home' ? context.awayTeam : context.homeTeam;
  
  // Team quality difference
  const attackRating = calculateAttackRating(team);
  const defenseRating = calculateDefenseRating(opposingTeam);
  const qualityDiff = (attackRating - defenseRating) / 100;
  baseXG += qualityDiff * 0.05;
  
  // Tactical modifier
  const tacticalMod = getTacticalXGModifier(team, shotType);
  baseXG *= tacticalMod;
  
  // Position-based xG (simplified)
  const positionMultiplier = prng.next() * 0.4 + 0.8; // 0.8 to 1.2
  baseXG *= positionMultiplier;
  
  // Momentum effect
  const momentumEffect = state.momentum * (attackingTeam === 'home' ? 1 : -1);
  baseXG += momentumEffect * 0.001; // Small momentum bonus
  
  // Weather effects
  const weatherEffects = getWeatherEffects(context.weather);
  baseXG *= weatherEffects.shotAccuracy;
  
  // Home advantage
  if (attackingTeam === 'home') {
    baseXG *= (1 + context.homeAdvantage);
  }
  
  // Clamp between reasonable bounds
  return Math.max(0.01, Math.min(0.8, baseXG));
}

/**
 * Handle other event types (simplified implementations)
 */
function handleChanceEvent(
  state: SimulationState,
  context: MatchContext,
  prng: PseudoRandom,
  attackingTeam: 'home' | 'away'
): void {
  const team = attackingTeam === 'home' ? context.homeTeam : context.awayTeam;
  const player = team.players[prng.int(0, team.players.length)];
  
  if (!player) {
    console.warn('No player found for chance event');
    return;
  }
  
  state.events.push({
    minute: state.minute,
    type: 'chance',
    team: attackingTeam,
    player: player.name,
    description: `${player.name} creates a good chance for ${team.name}`,
  });
  
  // Small momentum shift
  state.momentum += attackingTeam === 'home' ? 5 : -5;
  state.momentum = Math.max(-100, Math.min(100, state.momentum));
}

function handleFoulEvent(
  state: SimulationState,
  context: MatchContext,
  prng: PseudoRandom
): void {
  const foulTeam = state.possession === 'home' ? 'away' : 'home'; // Defending team commits foul
  const team = foulTeam === 'home' ? context.homeTeam : context.awayTeam;
  const player = team.players[prng.int(0, team.players.length)];
  
  if (!player) {
    console.warn('No player found for foul event');
    return;
  }
  
  state.stats.fouls[foulTeam]++;
  
  // Chance of card
  const cardChance = prng.next();
  if (cardChance < 0.15) { // 15% chance of yellow card
    state.stats.yellowCards[foulTeam]++;
    state.events.push({
      minute: state.minute,
      type: 'yellow_card',
      team: foulTeam,
      player: player.name,
      description: `Yellow card for ${player.name}`,
    });
  } else if (cardChance < 0.02) { // 2% chance of red card
    state.stats.redCards[foulTeam]++;
    state.events.push({
      minute: state.minute,
      type: 'red_card',
      team: foulTeam,
      player: player.name,
      description: `Red card! ${player.name} is sent off`,
    });
  }
  
  // Change possession
  state.possession = foulTeam === 'home' ? 'away' : 'home';
}

function handleInjuryEvent(
  state: SimulationState,
  context: MatchContext,
  prng: PseudoRandom
): void {
  const injuredTeam = prng.next() < 0.5 ? 'home' : 'away';
  const team = injuredTeam === 'home' ? context.homeTeam : context.awayTeam;
  const player = team.players[prng.int(0, team.players.length)];
  
  if (!player) {
    console.warn('No player found for injury event');
    return;
  }
  
  state.events.push({
    minute: state.minute,
    type: 'injury',
    team: injuredTeam,
    player: player.name,
    description: `${player.name} is injured and requires treatment`,
  });
  
  // Reduce player's stamina
  const currentStamina = state.playerStamina[player.id];
  if (currentStamina !== undefined) {
    state.playerStamina[player.id] = Math.max(0, currentStamina - 20);
  }
}

function handleCornerEvent(
  state: SimulationState,
  context: MatchContext,
  prng: PseudoRandom,
  attackingTeam: 'home' | 'away'
): void {
  state.stats.corners[attackingTeam]++;
  
  const team = attackingTeam === 'home' ? context.homeTeam : context.awayTeam;
  
  // Corner has a chance to create a shot
  if (prng.next() < 0.3) { // 30% chance
    handleShotEvent(state, context, prng, attackingTeam);
  }
}

/**
 * Update possession based on team ratings and tactics
 */
function updatePossession(
  state: SimulationState,
  context: MatchContext,
  prng: PseudoRandom
): void {
  const homePossessionTendency = calculatePossessionTendency(context.homeTeam);
  const awayPossessionTendency = calculatePossessionTendency(context.awayTeam);
  
  // Normalize tendencies
  const totalTendency = homePossessionTendency + awayPossessionTendency;
  const homeProbability = homePossessionTendency / totalTendency;
  
  // Add momentum effect
  const momentumEffect = state.momentum * 0.002; // Small effect
  const adjustedProbability = homeProbability + momentumEffect;
  
  state.possession = prng.next() < adjustedProbability ? 'home' : 'away';
}

/**
 * Update player stamina based on tactics and game state
 */
function updatePlayerStamina(
  state: SimulationState,
  context: MatchContext,
  prng: PseudoRandom
): void {
  const homeStaminaDrain = calculateStaminaDrain(context.homeTeam, state.minute, state.intensity);
  const awayStaminaDrain = calculateStaminaDrain(context.awayTeam, state.minute, state.intensity);
  
  // Update home team stamina
  context.homeTeam.players.forEach(player => {
    const currentStamina = state.playerStamina[player.id] || player.stamina;
    const drain = homeStaminaDrain * (0.8 + prng.next() * 0.4); // Some randomness
    state.playerStamina[player.id] = Math.max(0, currentStamina - drain);
  });
  
  // Update away team stamina
  context.awayTeam.players.forEach(player => {
    const currentStamina = state.playerStamina[player.id] || player.stamina;
    const drain = awayStaminaDrain * (0.8 + prng.next() * 0.4); // Some randomness
    state.playerStamina[player.id] = Math.max(0, currentStamina - drain);
  });
}

/**
 * Update match intensity based on score and time
 */
function updateMatchIntensity(
  state: SimulationState,
  context: MatchContext,
  prng: PseudoRandom
): void {
  const scoreDifference = Math.abs(state.homeScore - state.awayScore);
  
  // Base intensity increases over time
  if (state.minute > 60) {
    state.intensity = Math.min(100, state.intensity + 1);
  }
  
  // Close games are more intense
  if (scoreDifference <= 1) {
    state.intensity = Math.min(100, state.intensity + 2);
  }
  
  // Big leads reduce intensity slightly
  if (scoreDifference >= 3) {
    state.intensity = Math.max(30, state.intensity - 1);
  }
  
  // Random fluctuations
  state.intensity += prng.int(-2, 3);
  state.intensity = Math.max(20, Math.min(100, state.intensity));
}

/**
 * Update statistics for this tick
 */
function updateTickStats(
  state: SimulationState,
  context: MatchContext,
  prng: PseudoRandom
): void {
  // Update possession percentages
  const possessionTeam = state.possession;
  const tickValue = 1.0 / (90 * TICKS_PER_MINUTE); // Each tick is worth this much
  
  if (possessionTeam === 'home') {
    state.stats.possession.home += tickValue * 100;
  } else {
    state.stats.possession.away += tickValue * 100;
  }
  
  // Update pass statistics (simplified)
  const passAttempts = prng.int(0, 3); // 0-2 passes per tick
  if (passAttempts > 0) {
    state.stats.passes[possessionTeam] += passAttempts;
    
    // Calculate pass accuracy based on weather and pressure
    const team = possessionTeam === 'home' ? context.homeTeam : context.awayTeam;
    const baseAccuracy = 0.8; // 80% base accuracy
    const weatherEffects = getWeatherEffects(context.weather);
    const accuracy = baseAccuracy * weatherEffects.passingAccuracy;
    
    const successfulPasses = passAttempts * accuracy;
    const currentTotal = state.stats.passes[possessionTeam];
    const currentAccuracy = state.stats.passAccuracy[possessionTeam];
    
    // Update running average
    state.stats.passAccuracy[possessionTeam] = 
      (currentAccuracy * (currentTotal - passAttempts) + successfulPasses * 100) / currentTotal;
  }
}

/**
 * Calculate stoppage time
 */
function calculateStoppageTime(state: SimulationState, prng: PseudoRandom): number {
  let baseStoppage = 2; // Base 2 minutes
  
  // Add time for goals
  const totalGoals = state.homeScore + state.awayScore;
  baseStoppage += totalGoals * 0.5;
  
  // Add time for cards
  const totalCards = state.stats.yellowCards.home + state.stats.yellowCards.away +
                    state.stats.redCards.home + state.stats.redCards.away;
  baseStoppage += totalCards * 0.3;
  
  // Add time for injuries
  const injuries = state.events.filter(e => e.type === 'injury').length;
  baseStoppage += injuries * 1;
  
  // Random variation
  baseStoppage += prng.next() * 2 - 1; // ±1 minute
  
  return Math.max(1, Math.min(8, Math.round(baseStoppage)));
}

/**
 * Simulate stoppage time events
 */
function simulateStoppageTime(
  state: SimulationState,
  context: MatchContext,
  prng: PseudoRandom,
  stoppageMinutes: number
): void {
  const stoppageTicks = stoppageMinutes * TICKS_PER_MINUTE;
  
  // Increase intensity for stoppage time
  state.intensity = Math.min(100, state.intensity + 20);
  
  for (let tick = 0; tick < stoppageTicks; tick++) {
    simulateTick(state, context, prng);
  }
}
