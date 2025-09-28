// Main simulation API

import { simulateMatch as simulateMatchEngine } from './engine.js';
import type { 
  Team, 
  Player, 
  MatchResult, 
  Weather, 
  TacticalSetup, 
  PlayerAttributes 
} from './types.js';
import { getDefaultTactics } from './tactics.js';

// Legacy interface for backwards compatibility
export interface LegacyMatchResult {
  homeGoals: number;
  awayGoals: number;
}

/**
 * Main simulation API - matches GDD requirements
 * @param seed - Deterministic seed for reproducibility
 * @param homeTeamId - Home team identifier
 * @param awayTeamId - Away team identifier  
 * @param tactics - Optional tactical overrides
 * @param weather - Weather conditions
 * @returns Match result with score, stats, and events
 */
export function simulateMatch(
  seed: number,
  homeTeamId: string,
  awayTeamId: string,
  tactics?: {
    home?: Partial<TacticalSetup>;
    away?: Partial<TacticalSetup>;
  },
  weather: Weather = 'clear'
): MatchResult {
  // Create mock teams if not provided (for testing/demo purposes)
  const homeTeam = createMockTeam(homeTeamId, 'home', tactics?.home);
  const awayTeam = createMockTeam(awayTeamId, 'away', tactics?.away);
  
  return simulateMatchEngine(seed, homeTeamId, awayTeamId, homeTeam, awayTeam, weather);
}

/**
 * Simulate match with full team data
 */
export function simulateMatchWithTeams(
  seed: number,
  homeTeam: Team,
  awayTeam: Team,
  weather: Weather = 'clear'
): MatchResult {
  return simulateMatchEngine(seed, homeTeam.id, awayTeam.id, homeTeam, awayTeam, weather);
}

/**
 * Legacy simulation function for backwards compatibility
 */
export function simulateMatchLegacy(seed: string, homeAdvantage: number = 0.2): LegacyMatchResult {
  const result = simulateMatch(
    seed.hashCode(), // Convert string to number
    'home-team',
    'away-team',
    undefined,
    'clear'
  );
  
  return {
    homeGoals: result.homeScore,
    awayGoals: result.awayScore,
  };
}

/**
 * Create a mock team for testing/demo purposes
 */
function createMockTeam(
  teamId: string, 
  homeAway: 'home' | 'away',
  tacticalOverrides?: Partial<TacticalSetup>
): Team {
  // Generate mock players with realistic attributes
  const players: Player[] = [];
  
  // Create a basic squad: 1 GK, 4 DEF, 4 MID, 2 FWD
  const positions = [
    { pos: 'GK', count: 1 },
    { pos: 'DF', count: 4 },
    { pos: 'MF', count: 4 },
    { pos: 'FW', count: 2 },
  ];
  
  let playerId = 1;
  positions.forEach(({ pos, count }) => {
    for (let i = 0; i < count; i++) {
      players.push(createMockPlayer(`${teamId}-P${playerId}`, `Player ${playerId}`, pos));
      playerId++;
    }
  });
  
  // Calculate team overall rating from players
  const averageRating = players.reduce((sum, player) => {
    return sum + calculatePlayerRating(player.attributes);
  }, 0) / players.length;
  
  // Default tactics with overrides
  const baseTactics = getDefaultTactics('4-4-2');
  const tactics = { ...baseTactics, ...tacticalOverrides };
  
  return {
    id: teamId,
    name: `${teamId} FC`,
    players,
    tactics,
    overallRating: averageRating,
  };
}

/**
 * Create a mock player
 */
function createMockPlayer(id: string, name: string, position: string): Player {
  // Generate realistic attributes based on position
  const attributes = generateMockAttributes(position);
  
  return {
    id,
    name,
    position,
    attributes,
    stamina: 85 + Math.floor(Math.random() * 15), // 85-100
    morale: 70 + Math.floor(Math.random() * 20), // 70-90
    condition: 90 + Math.floor(Math.random() * 10), // 90-100
  };
}

/**
 * Generate mock attributes based on position
 */
function generateMockAttributes(position: string): PlayerAttributes {
  const baseAttributes: PlayerAttributes = {
    finishing: 10,
    passing: 10,
    crossing: 10,
    dribbling: 10,
    technique: 10,
    pace: 10,
    strength: 10,
    stamina: 10,
    decisions: 10,
    positioning: 10,
    anticipation: 10,
    tackling: 10,
    marking: 10,
  };
  
  // Position-specific attribute bonuses
  switch (position) {
    case 'GK':
      baseAttributes.handling = 15;
      baseAttributes.reflexes = 15;
      baseAttributes.kicking = 12;
      baseAttributes.positioning = 16;
      baseAttributes.anticipation = 15;
      break;
      
    case 'DF':
      baseAttributes.tackling = 15;
      baseAttributes.marking = 15;
      baseAttributes.strength = 14;
      baseAttributes.positioning = 15;
      baseAttributes.anticipation = 14;
      break;
      
    case 'MF':
      baseAttributes.passing = 15;
      baseAttributes.technique = 14;
      baseAttributes.decisions = 15;
      baseAttributes.stamina = 16;
      break;
      
    case 'FW':
      baseAttributes.finishing = 16;
      baseAttributes.pace = 15;
      baseAttributes.dribbling = 14;
      baseAttributes.positioning = 15;
      break;
  }
  
  // Add some random variation (±3)
  Object.keys(baseAttributes).forEach(key => {
    if (key !== 'handling' && key !== 'reflexes' && key !== 'kicking') {
      const current = baseAttributes[key as keyof PlayerAttributes] as number;
      const variation = Math.floor(Math.random() * 7) - 3; // -3 to +3
      baseAttributes[key as keyof PlayerAttributes] = Math.max(1, Math.min(20, current + variation)) as any;
    }
  });
  
  return baseAttributes;
}

/**
 * Calculate overall player rating from attributes
 */
function calculatePlayerRating(attributes: PlayerAttributes): number {
  const technicalAvg = (
    attributes.finishing +
    attributes.passing +
    attributes.crossing +
    attributes.dribbling +
    attributes.technique
  ) / 5;
  
  const physicalAvg = (
    attributes.pace +
    attributes.strength +
    attributes.stamina
  ) / 3;
  
  const mentalAvg = (
    attributes.decisions +
    attributes.positioning +
    attributes.anticipation
  ) / 3;
  
  const defensiveAvg = (
    attributes.tackling +
    attributes.marking
  ) / 2;
  
  // Weight different aspects
  const overall = (
    technicalAvg * 0.4 +
    physicalAvg * 0.2 +
    mentalAvg * 0.3 +
    defensiveAvg * 0.1
  );
  
  return Math.round(overall * 10); // Scale to 10-200 range
}

// String extension for hash code (for legacy compatibility)
declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function(): number {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Re-export types for convenience
export * from './types.js';
export * from './tactics.js';
export * from './weather.js';