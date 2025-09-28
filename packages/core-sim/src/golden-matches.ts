// Golden match test data and validation

import type { GoldenMatch, Team, Player, PlayerAttributes } from './types.js';
import { simulateMatchWithTeams } from './sim.js';

/**
 * Create a standardized test team
 */
function createTestTeam(
  id: string,
  name: string,
  overallRating: number,
  formation: '4-4-2' | '4-3-3' | '3-5-2' = '4-4-2'
): Team {
  const players: Player[] = [];
  
  // Create players with consistent ratings based on overall team rating
  const baseAttributeLevel = Math.floor(overallRating / 10); // 80 rating = 8 base attributes
  
  // Goalkeeper
  players.push(createTestPlayer(
    `${id}-GK1`,
    'Test Keeper',
    'GK',
    {
      ...createBaseAttributes(baseAttributeLevel),
      handling: baseAttributeLevel + 2,
      reflexes: baseAttributeLevel + 2,
      kicking: baseAttributeLevel,
      positioning: baseAttributeLevel + 1,
      anticipation: baseAttributeLevel + 1,
    }
  ));
  
  // Defenders (4)
  for (let i = 1; i <= 4; i++) {
    players.push(createTestPlayer(
      `${id}-DF${i}`,
      `Test Defender ${i}`,
      'DF',
      {
        ...createBaseAttributes(baseAttributeLevel),
        tackling: baseAttributeLevel + 2,
        marking: baseAttributeLevel + 2,
        strength: baseAttributeLevel + 1,
        positioning: baseAttributeLevel + 1,
      }
    ));
  }
  
  // Midfielders (4)
  for (let i = 1; i <= 4; i++) {
    players.push(createTestPlayer(
      `${id}-MF${i}`,
      `Test Midfielder ${i}`,
      'MF',
      {
        ...createBaseAttributes(baseAttributeLevel),
        passing: baseAttributeLevel + 2,
        technique: baseAttributeLevel + 1,
        decisions: baseAttributeLevel + 1,
        stamina: baseAttributeLevel + 2,
      }
    ));
  }
  
  // Forwards (2)
  for (let i = 1; i <= 2; i++) {
    players.push(createTestPlayer(
      `${id}-FW${i}`,
      `Test Forward ${i}`,
      'FW',
      {
        ...createBaseAttributes(baseAttributeLevel),
        finishing: baseAttributeLevel + 3,
        pace: baseAttributeLevel + 2,
        dribbling: baseAttributeLevel + 1,
        positioning: baseAttributeLevel + 2,
      }
    ));
  }
  
  return {
    id,
    name,
    players,
    overallRating,
    tactics: {
      formation,
      mentality: 'balanced',
      pressing: 'medium',
      tempo: 'medium',
      width: 'normal',
    },
  };
}

/**
 * Create base attributes for a given level
 */
function createBaseAttributes(level: number): PlayerAttributes {
  return {
    finishing: level,
    passing: level,
    crossing: level,
    dribbling: level,
    technique: level,
    pace: level,
    strength: level,
    stamina: level,
    decisions: level,
    positioning: level,
    anticipation: level,
    tackling: level,
    marking: level,
  };
}

/**
 * Create a test player
 */
function createTestPlayer(
  id: string,
  name: string,
  position: string,
  attributes: PlayerAttributes
): Player {
  return {
    id,
    name,
    position,
    attributes,
    stamina: 90,
    morale: 80,
    condition: 95,
  };
}

/**
 * Golden match test cases
 */
export const GOLDEN_MATCHES: GoldenMatch[] = [
  {
    id: 'GM-001',
    description: 'Evenly matched teams (4-4-2 vs 4-4-2) - Clear weather',
    seed: 42,
    homeTeam: createTestTeam('HOME-001', 'Home United', 100, '4-4-2'),
    awayTeam: createTestTeam('AWAY-001', 'Away City', 100, '4-4-2'),
    weather: 'clear',
    expectedRanges: {
      homeScore: [0, 4],
      awayScore: [0, 4],
      homeXG: [0.8, 2.5],
      awayXG: [0.6, 2.2], // Slightly lower due to away disadvantage
      homePossession: [45, 60],
      events: [8, 25],
    },
  },
  {
    id: 'GM-002',
    description: 'Strong home team vs weak away team - Rain conditions',
    seed: 99,
    homeTeam: createTestTeam('HOME-002', 'Strong FC', 140, '4-3-3'),
    awayTeam: createTestTeam('AWAY-002', 'Weak United', 80, '4-4-2'),
    weather: 'rain',
    expectedRanges: {
      homeScore: [1, 5],
      awayScore: [0, 2],
      homeXG: [1.2, 3.5],
      awayXG: [0.3, 1.5],
      homePossession: [55, 75],
      events: [10, 30],
    },
  },
  {
    id: 'GM-003',
    description: 'Defensive vs Attacking formations - Snow weather',
    seed: 7,
    homeTeam: (() => {
      const team = createTestTeam('HOME-003', 'Defensive FC', 110, '3-5-2');
      team.tactics.mentality = 'defensive';
      team.tactics.pressing = 'low';
      return team;
    })(),
    awayTeam: (() => {
      const team = createTestTeam('AWAY-003', 'Attacking United', 110, '4-3-3');
      team.tactics.mentality = 'attacking';
      team.tactics.pressing = 'high';
      return team;
    })(),
    weather: 'snow',
    expectedRanges: {
      homeScore: [0, 3],
      awayScore: [0, 3],
      homeXG: [0.5, 2.0],
      awayXG: [0.8, 2.8],
      homePossession: [35, 50],
      events: [12, 35],
    },
  },
  {
    id: 'GM-004',
    description: 'High-intensity match - Windy conditions',
    seed: 123,
    homeTeam: (() => {
      const team = createTestTeam('HOME-004', 'Fast FC', 120, '4-3-3');
      team.tactics.tempo = 'fast';
      team.tactics.pressing = 'high';
      return team;
    })(),
    awayTeam: (() => {
      const team = createTestTeam('AWAY-004', 'Counter United', 115, '4-4-2');
      team.tactics.mentality = 'balanced';
      team.tactics.tempo = 'fast';
      return team;
    })(),
    weather: 'wind',
    expectedRanges: {
      homeScore: [1, 4],
      awayScore: [0, 3],
      homeXG: [1.0, 3.2],
      awayXG: [0.6, 2.5],
      homePossession: [50, 65],
      events: [15, 35],
    },
  },
  {
    id: 'GM-005',
    description: 'Low-scoring tactical battle',
    seed: 456,
    homeTeam: (() => {
      const team = createTestTeam('HOME-005', 'Solid FC', 95, '4-4-2');
      team.tactics.mentality = 'defensive';
      team.tactics.tempo = 'slow';
      return team;
    })(),
    awayTeam: (() => {
      const team = createTestTeam('AWAY-005', 'Cautious City', 95, '4-4-2');
      team.tactics.mentality = 'defensive';
      team.tactics.tempo = 'slow';
      return team;
    })(),
    weather: 'clear',
    expectedRanges: {
      homeScore: [0, 2],
      awayScore: [0, 2],
      homeXG: [0.3, 1.5],
      awayXG: [0.2, 1.2],
      homePossession: [45, 55],
      events: [6, 20],
    },
  },
  {
    id: 'GM-006',
    description: 'Wide play vs narrow formation',
    seed: 789,
    homeTeam: (() => {
      const team = createTestTeam('HOME-006', 'Wide FC', 105, '4-3-3');
      team.tactics.width = 'wide';
      team.tactics.tempo = 'medium';
      return team;
    })(),
    awayTeam: (() => {
      const team = createTestTeam('AWAY-006', 'Narrow United', 105, '3-5-2');
      team.tactics.width = 'narrow';
      team.tactics.pressing = 'high';
      return team;
    })(),
    weather: 'clear',
    expectedRanges: {
      homeScore: [0, 3],
      awayScore: [0, 3],
      homeXG: [0.8, 2.5],
      awayXG: [0.7, 2.3],
      homePossession: [48, 62],
      events: [10, 28],
    },
  },
  {
    id: 'GM-007',
    description: 'Stamina test - High pressing vs slow tempo',
    seed: 321,
    homeTeam: (() => {
      const team = createTestTeam('HOME-007', 'Press FC', 100, '4-3-3');
      team.tactics.pressing = 'high';
      team.tactics.tempo = 'fast';
      return team;
    })(),
    awayTeam: (() => {
      const team = createTestTeam('AWAY-007', 'Patient United', 100, '4-4-2');
      team.tactics.tempo = 'slow';
      team.tactics.pressing = 'low';
      return team;
    })(),
    weather: 'clear',
    expectedRanges: {
      homeScore: [0, 4],
      awayScore: [0, 3],
      homeXG: [0.9, 2.8],
      awayXG: [0.5, 2.0],
      homePossession: [52, 68],
      events: [12, 30],
    },
  },
  {
    id: 'GM-008',
    description: 'Quality mismatch - Clear conditions',
    seed: 654,
    homeTeam: createTestTeam('HOME-008', 'Elite FC', 160, '4-3-3'),
    awayTeam: createTestTeam('AWAY-008', 'Amateur United', 60, '4-4-2'),
    weather: 'clear',
    expectedRanges: {
      homeScore: [2, 6],
      awayScore: [0, 2],
      homeXG: [2.0, 4.5],
      awayXG: [0.1, 1.0],
      homePossession: [65, 80],
      events: [15, 40],
    },
  },
  {
    id: 'GM-009',
    description: 'Formation counter - 3-5-2 vs 4-3-3',
    seed: 987,
    homeTeam: createTestTeam('HOME-009', 'Midfield FC', 110, '3-5-2'),
    awayTeam: createTestTeam('AWAY-009', 'Wings United', 110, '4-3-3'),
    weather: 'rain',
    expectedRanges: {
      homeScore: [0, 3],
      awayScore: [0, 4],
      homeXG: [0.6, 2.2],
      awayXG: [0.8, 2.6],
      homePossession: [48, 62],
      events: [8, 25],
    },
  },
  {
    id: 'GM-010',
    description: 'Late drama potential - Balanced teams',
    seed: 147,
    homeTeam: createTestTeam('HOME-010', 'Drama FC', 105, '4-4-2'),
    awayTeam: createTestTeam('AWAY-010', 'Thriller United', 105, '4-4-2'),
    weather: 'wind',
    expectedRanges: {
      homeScore: [0, 4],
      awayScore: [0, 4],
      homeXG: [0.7, 2.8],
      awayXG: [0.5, 2.5],
      homePossession: [45, 58],
      events: [10, 30],
    },
  },
];

/**
 * Validate a match result against expected ranges
 */
export function validateGoldenMatch(
  match: GoldenMatch,
  result: any
): {
  passed: boolean;
  failures: string[];
  metrics: Record<string, number>;
} {
  const failures: string[] = [];
  const metrics: Record<string, number> = {
    homeScore: result.homeScore,
    awayScore: result.awayScore,
    homeXG: result.stats.xG.home,
    awayXG: result.stats.xG.away,
    homePossession: result.stats.possession.home,
    events: result.events.length,
  };
  
  // Validate each metric
  Object.entries(match.expectedRanges).forEach(([key, [min, max]]) => {
    const actual = metrics[key];
    if (actual !== undefined && (actual < min || actual > max)) {
      failures.push(
        `${key}: expected ${min}-${max}, got ${actual}`
      );
    } else if (actual === undefined) {
      failures.push(
        `${key}: metric is undefined`
      );
    }
  });
  
  return {
    passed: failures.length === 0,
    failures,
    metrics,
  };
}

/**
 * Run all golden match tests
 */
export function runGoldenMatchTests(): {
  passed: number;
  failed: number;
  results: Array<{
    match: GoldenMatch;
    result: any;
    validation: ReturnType<typeof validateGoldenMatch>;
  }>;
} {
  const results: Array<{
    match: GoldenMatch;
    result: any;
    validation: ReturnType<typeof validateGoldenMatch>;
  }> = [];
  
  let passed = 0;
  let failed = 0;
  
  GOLDEN_MATCHES.forEach(match => {
    const result = simulateMatchWithTeams(
      match.seed,
      match.homeTeam,
      match.awayTeam,
      match.weather
    );
    
    const validation = validateGoldenMatch(match, result);
    
    results.push({
      match,
      result,
      validation,
    });
    
    if (validation.passed) {
      passed++;
    } else {
      failed++;
    }
  });
  
  return {
    passed,
    failed,
    results,
  };
}
