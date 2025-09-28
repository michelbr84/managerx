// Tactical system implementation

import type { Formation, TacticalSetup, FormationModifiers, Team, Player } from './types.js';

// Formation-specific tactical modifiers
export const FORMATION_MODIFIERS: Record<Formation, FormationModifiers> = {
  '4-4-2': {
    attack: 0.0,
    defense: 0.1,
    midfield: -0.05,
    width: 0.0,
    pressing: 0.0,
  },
  '4-3-3': {
    attack: 0.15,
    defense: -0.1,
    midfield: 0.05,
    width: 0.1,
    pressing: 0.1,
  },
  '3-5-2': {
    attack: 0.05,
    defense: -0.05,
    midfield: 0.15,
    width: -0.1,
    pressing: 0.05,
  },
};

// Mentality modifiers
export const MENTALITY_MODIFIERS = {
  defensive: {
    attack: -0.2,
    defense: 0.3,
    possession: -0.1,
    pressing: -0.15,
  },
  balanced: {
    attack: 0.0,
    defense: 0.0,
    possession: 0.0,
    pressing: 0.0,
  },
  attacking: {
    attack: 0.3,
    defense: -0.15,
    possession: 0.1,
    pressing: 0.1,
  },
};

// Pressing intensity effects
export const PRESSING_MODIFIERS = {
  low: {
    ballRecovery: -0.2,
    staminaDrain: 0.7,
    passingAccuracy: 0.1, // Opponents have easier time
  },
  medium: {
    ballRecovery: 0.0,
    staminaDrain: 1.0,
    passingAccuracy: 0.0,
  },
  high: {
    ballRecovery: 0.3,
    staminaDrain: 1.4,
    passingAccuracy: -0.15, // Opponents under more pressure
  },
};

// Tempo effects
export const TEMPO_MODIFIERS = {
  slow: {
    passAccuracy: 0.15,
    chanceCreation: -0.1,
    staminaDrain: 0.8,
  },
  medium: {
    passAccuracy: 0.0,
    chanceCreation: 0.0,
    staminaDrain: 1.0,
  },
  fast: {
    passAccuracy: -0.1,
    chanceCreation: 0.2,
    staminaDrain: 1.2,
  },
};

// Width effects
export const WIDTH_MODIFIERS = {
  narrow: {
    centralPlay: 0.2,
    crossingBonus: -0.3,
    compactness: 0.15,
  },
  normal: {
    centralPlay: 0.0,
    crossingBonus: 0.0,
    compactness: 0.0,
  },
  wide: {
    centralPlay: -0.1,
    crossingBonus: 0.25,
    compactness: -0.1,
  },
};

/**
 * Calculate team's overall attacking rating based on formation and tactics
 */
export function calculateAttackRating(team: Team): number {
  const baseRating = team.overallRating;
  const formationMod = FORMATION_MODIFIERS[team.tactics.formation];
  const mentalityMod = MENTALITY_MODIFIERS[team.tactics.mentality];
  
  let attackRating = baseRating * (1 + formationMod.attack + mentalityMod.attack);
  
  // Apply tempo modifier
  const tempoMod = TEMPO_MODIFIERS[team.tactics.tempo];
  attackRating *= (1 + tempoMod.chanceCreation);
  
  return Math.max(20, Math.min(200, attackRating));
}

/**
 * Calculate team's overall defensive rating based on formation and tactics
 */
export function calculateDefenseRating(team: Team): number {
  const baseRating = team.overallRating;
  const formationMod = FORMATION_MODIFIERS[team.tactics.formation];
  const mentalityMod = MENTALITY_MODIFIERS[team.tactics.mentality];
  
  let defenseRating = baseRating * (1 + formationMod.defense + mentalityMod.defense);
  
  // Apply pressing modifier
  const pressingMod = PRESSING_MODIFIERS[team.tactics.pressing];
  defenseRating *= (1 + pressingMod.ballRecovery * 0.5);
  
  return Math.max(20, Math.min(200, defenseRating));
}

/**
 * Calculate team's midfield control rating
 */
export function calculateMidfieldRating(team: Team): number {
  const baseRating = team.overallRating;
  const formationMod = FORMATION_MODIFIERS[team.tactics.formation];
  const mentalityMod = MENTALITY_MODIFIERS[team.tactics.mentality];
  
  let midfieldRating = baseRating * (1 + formationMod.midfield);
  
  // Possession-based teams get midfield bonus
  if (team.tactics.mentality === 'balanced' || team.tactics.tempo === 'slow') {
    midfieldRating *= 1.1;
  }
  
  return Math.max(20, Math.min(200, midfieldRating));
}

/**
 * Calculate stamina drain rate based on tactics
 */
export function calculateStaminaDrain(team: Team, minute: number, intensity: number): number {
  let baseDrain = 1.0;
  
  // Formation effects
  const formationMod = FORMATION_MODIFIERS[team.tactics.formation];
  if (team.tactics.formation === '3-5-2') {
    baseDrain *= 1.1; // Wing-backs work harder
  }
  
  // Pressing effects
  const pressingMod = PRESSING_MODIFIERS[team.tactics.pressing];
  baseDrain *= pressingMod.staminaDrain;
  
  // Tempo effects
  const tempoMod = TEMPO_MODIFIERS[team.tactics.tempo];
  baseDrain *= tempoMod.staminaDrain;
  
  // Mentality effects (attacking teams press more)
  const mentalityMod = MENTALITY_MODIFIERS[team.tactics.mentality];
  if (team.tactics.mentality === 'attacking') {
    baseDrain *= 1.15;
  } else if (team.tactics.mentality === 'defensive') {
    baseDrain *= 0.9;
  }
  
  // Intensity and time effects
  const intensityMultiplier = 0.5 + (intensity / 100) * 0.8; // 0.5 to 1.3
  const timeMultiplier = minute > 75 ? 1.3 : minute > 60 ? 1.1 : 1.0;
  
  return baseDrain * intensityMultiplier * timeMultiplier;
}

/**
 * Calculate possession tendency based on tactics
 */
export function calculatePossessionTendency(team: Team): number {
  let tendency = 0.5; // Base 50%
  
  const mentalityMod = MENTALITY_MODIFIERS[team.tactics.mentality];
  tendency += mentalityMod.possession;
  
  // Tempo effects
  if (team.tactics.tempo === 'slow') {
    tendency += 0.1; // Slower teams keep ball more
  } else if (team.tactics.tempo === 'fast') {
    tendency -= 0.05; // Faster teams attack quickly
  }
  
  // Formation effects
  if (team.tactics.formation === '3-5-2') {
    tendency += 0.05; // More midfielders
  } else if (team.tactics.formation === '4-3-3') {
    tendency -= 0.03; // More attacking
  }
  
  return Math.max(0.2, Math.min(0.8, tendency));
}

/**
 * Get tactical matchup modifier between two teams
 */
export function getTacticalMatchup(homeTeam: Team, awayTeam: Team): {
  homeAdvantage: number;
  awayAdvantage: number;
} {
  let homeAdvantage = 0;
  let awayAdvantage = 0;
  
  // Formation matchups
  const homeFormation = homeTeam.tactics.formation;
  const awayFormation = awayTeam.tactics.formation;
  
  // 4-3-3 vs 4-4-2: attacking formation advantage
  if (homeFormation === '4-3-3' && awayFormation === '4-4-2') {
    homeAdvantage += 0.1;
  } else if (homeFormation === '4-4-2' && awayFormation === '4-3-3') {
    awayAdvantage += 0.1;
  }
  
  // 3-5-2 vs 4-4-2: midfield advantage
  if (homeFormation === '3-5-2' && awayFormation === '4-4-2') {
    homeAdvantage += 0.08;
  } else if (homeFormation === '4-4-2' && awayFormation === '3-5-2') {
    awayAdvantage += 0.08;
  }
  
  // 4-3-3 vs 3-5-2: width vs midfield
  if (homeFormation === '4-3-3' && awayFormation === '3-5-2') {
    homeAdvantage += 0.05; // Width advantage
  } else if (homeFormation === '3-5-2' && awayFormation === '4-3-3') {
    awayAdvantage += 0.05;
  }
  
  // Mentality matchups
  if (homeTeam.tactics.mentality === 'attacking' && awayTeam.tactics.mentality === 'defensive') {
    homeAdvantage += 0.12; // Attacking vs defensive
  } else if (homeTeam.tactics.mentality === 'defensive' && awayTeam.tactics.mentality === 'attacking') {
    awayAdvantage += 0.12;
  }
  
  // Pressing vs tempo matchups
  if (homeTeam.tactics.pressing === 'high' && awayTeam.tactics.tempo === 'slow') {
    homeAdvantage += 0.08; // High press vs slow buildup
  } else if (homeTeam.tactics.pressing === 'low' && awayTeam.tactics.tempo === 'fast') {
    awayAdvantage += 0.08;
  }
  
  return { homeAdvantage, awayAdvantage };
}

/**
 * Calculate xG modifier based on tactical setup
 */
export function getTacticalXGModifier(team: Team, shotType: 'shot' | 'header' | 'freekick'): number {
  let modifier = 1.0;
  
  const formationMod = FORMATION_MODIFIERS[team.tactics.formation];
  modifier += formationMod.attack * 0.5;
  
  // Formation-specific bonuses
  if (shotType === 'header' && team.tactics.width === 'wide') {
    modifier += 0.15; // Wide play creates crossing opportunities
  }
  
  if (shotType === 'shot' && team.tactics.formation === '4-3-3') {
    modifier += 0.08; // More attacking players in box
  }
  
  // Mentality effects
  const mentalityMod = MENTALITY_MODIFIERS[team.tactics.mentality];
  modifier += mentalityMod.attack * 0.3;
  
  return Math.max(0.5, Math.min(2.0, modifier));
}

/**
 * Get default tactical setup for a formation
 */
export function getDefaultTactics(formation: Formation): TacticalSetup {
  return {
    formation,
    mentality: 'balanced',
    pressing: 'medium',
    tempo: 'medium',
    width: 'normal',
  };
}

/**
 * Validate tactical setup
 */
export function validateTactics(tactics: TacticalSetup): boolean {
  const validFormations: Formation[] = ['4-4-2', '4-3-3', '3-5-2'];
  const validMentalities = ['defensive', 'balanced', 'attacking'];
  const validPressing = ['low', 'medium', 'high'];
  const validTempo = ['slow', 'medium', 'fast'];
  const validWidth = ['narrow', 'normal', 'wide'];
  
  return (
    validFormations.includes(tactics.formation) &&
    validMentalities.includes(tactics.mentality) &&
    validPressing.includes(tactics.pressing) &&
    validTempo.includes(tactics.tempo) &&
    validWidth.includes(tactics.width)
  );
}
