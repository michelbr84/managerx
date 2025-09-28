// Core simulation types and interfaces

export interface Player {
  id: string;
  name: string;
  position: string;
  attributes: PlayerAttributes;
  stamina: number; // 0-100
  morale: number; // 0-100
  condition: number; // 0-100
}

export interface PlayerAttributes {
  // Technical attributes (1-20)
  finishing: number;
  passing: number;
  crossing: number;
  dribbling: number;
  technique: number;
  
  // Physical attributes (1-20)
  pace: number;
  strength: number;
  stamina: number;
  
  // Mental attributes (1-20)
  decisions: number;
  positioning: number;
  anticipation: number;
  
  // Defensive attributes (1-20)
  tackling: number;
  marking: number;
  
  // Goalkeeper attributes (optional, 1-20)
  handling?: number;
  reflexes?: number;
  kicking?: number;
}

export type Formation = '4-4-2' | '4-3-3' | '3-5-2';

export interface TacticalSetup {
  formation: Formation;
  mentality: 'defensive' | 'balanced' | 'attacking'; // -1, 0, +1 modifier
  pressing: 'low' | 'medium' | 'high'; // affects stamina drain and ball recovery
  tempo: 'slow' | 'medium' | 'fast'; // affects pass accuracy and chance creation
  width: 'narrow' | 'normal' | 'wide'; // affects crossing and wing play
}

export type Weather = 'clear' | 'rain' | 'snow' | 'wind';

export interface Team {
  id: string;
  name: string;
  players: Player[];
  tactics: TacticalSetup;
  overallRating: number; // Calculated from players
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'injury' | 'chance' | 'shot';
  team: 'home' | 'away';
  player?: string;
  description: string;
  xG?: number; // For shots and goals
}

export interface MatchStats {
  possession: { home: number; away: number }; // Percentages
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  xG: { home: number; away: number };
  passes: { home: number; away: number };
  passAccuracy: { home: number; away: number }; // Percentages
  fouls: { home: number; away: number };
  corners: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  stats: MatchStats;
  events: MatchEvent[];
  duration: number; // Total match time including stoppage
}

// Internal simulation state
export interface SimulationState {
  minute: number;
  homeScore: number;
  awayScore: number;
  possession: 'home' | 'away';
  intensity: number; // 0-100, affects stamina drain
  momentum: number; // -100 to +100, positive favors home
  events: MatchEvent[];
  stats: MatchStats;
  playerStamina: { [playerId: string]: number };
}

// Formation-specific tactical modifiers
export interface FormationModifiers {
  attack: number;
  defense: number;
  midfield: number;
  width: number;
  pressing: number;
}

// Weather effects on gameplay
export interface WeatherEffects {
  passingAccuracy: number; // Multiplier
  shotAccuracy: number; // Multiplier
  staminaDrain: number; // Multiplier
  longBallBonus: number; // Bonus for long passes/crosses
}

// Match context for simulation
export interface MatchContext {
  homeTeam: Team;
  awayTeam: Team;
  weather: Weather;
  seed: number;
  homeAdvantage: number; // Default 0.1 (10% bonus)
}

// Performance tracking for benchmarking
export interface SimulationPerformance {
  totalTime: number; // milliseconds
  eventsGenerated: number;
  ticksProcessed: number;
  averageTickTime: number; // milliseconds
}

export interface GoldenMatch {
  id: string;
  description: string;
  seed: number;
  homeTeam: Team;
  awayTeam: Team;
  weather: Weather;
  expectedRanges: {
    homeScore: [number, number];
    awayScore: [number, number];
    homeXG: [number, number];
    awayXG: [number, number];
    homePossession: [number, number];
    events: [number, number]; // Total events count
  };
}
