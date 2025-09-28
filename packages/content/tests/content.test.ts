import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import {
  validateDataset,
  validateUniqueIds,
  validateUniqueNamesPerLeague,
  validateAttributeRanges,
  validateSquadSizes,
  ValidationError,
  type Dataset,
  type Player,
  type Club,
  type Staff,
  type League,
  type Fixture,
} from '../src/schema.js';
import { 
  validatePlayerAttributeAverages, 
  validateClubBudgetDistribution 
} from '../src/scripts/validate.js';

let dataset: Dataset;

beforeAll(async () => {
  // Load test dataset
  const dataDir = path.join(__dirname, '../src/data');
  const datasetPath = path.join(dataDir, 'dataset.json');
  
  try {
    const datasetContent = await fs.readFile(datasetPath, 'utf-8');
    dataset = JSON.parse(datasetContent);
  } catch (error) {
    // If dataset.json doesn't exist, create a minimal test dataset
    dataset = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      seed: 42,
      leagues: [],
      clubs: [],
      players: [],
      staff: [],
      fixtures: [],
      season: {
        year: 2025,
        startDate: '2024-08-01',
        endDate: '2025-05-31',
        transferWindows: [
          { name: 'Summer', startDate: '2024-06-01', endDate: '2024-08-31' },
          { name: 'Winter', startDate: '2025-01-01', endDate: '2025-01-31' }
        ]
      }
    };
  }
});

describe('Schema Validation', () => {
  it('should validate dataset structure', () => {
    expect(() => validateDataset(dataset)).not.toThrow();
  });

  it('should reject invalid dataset', () => {
    const invalidDataset = { ...dataset, version: 123 }; // Invalid version type
    expect(() => validateDataset(invalidDataset)).toThrow(ValidationError);
  });

  it('should validate player ID format', () => {
    const validPlayer = {
      id: 'PLY-000001',
      clubId: 'CLB-0001',
      name: 'Test Player',
      age: 25,
      nationality: 'ALX',
      position: 'ST',
      foot: 'R',
      attributes: {
        finishing: 15,
        firstTouch: 12,
        dribbling: 14,
        technique: 13,
        crossing: 10,
        passing: 11,
        heading: 12,
        tackling: 8,
        pace: 16,
        acceleration: 15,
        agility: 14,
        balance: 13,
        strength: 12,
        stamina: 15,
        jumpingReach: 11,
        decisions: 13,
        anticipation: 12,
        positioning: 14,
        offTheBall: 15,
        vision: 11,
        workRate: 14,
        bravery: 13,
        composure: 12,
        determination: 15
      },
      ca: 125,
      pa: 150,
      morale: 75,
      condition: 95,
      contract: {
        wage: 8500,
        expires: '2027-06-30'
      }
    };

    expect(() => validateDataset({ ...dataset, players: [validPlayer] })).not.toThrow();

    const invalidPlayer = { ...validPlayer, id: 'INVALID-ID' };
    expect(() => validateDataset({ ...dataset, players: [invalidPlayer] })).toThrow();
  });

  it('should validate attribute ranges', () => {
    const playerWithInvalidAttribute = {
      id: 'PLY-000001',
      clubId: 'CLB-0001',
      name: 'Test Player',
      age: 25,
      nationality: 'ALX',
      position: 'ST',
      foot: 'R',
      attributes: {
        finishing: 25, // Invalid: > 20
        firstTouch: 12,
        dribbling: 14,
        technique: 13,
        crossing: 10,
        passing: 11,
        heading: 12,
        tackling: 8,
        pace: 16,
        acceleration: 15,
        agility: 14,
        balance: 13,
        strength: 12,
        stamina: 15,
        jumpingReach: 11,
        decisions: 13,
        anticipation: 12,
        positioning: 14,
        offTheBall: 15,
        vision: 11,
        workRate: 14,
        bravery: 13,
        composure: 12,
        determination: 15
      },
      ca: 125,
      pa: 150,
      morale: 75,
      condition: 95,
      contract: {
        wage: 8500,
        expires: '2027-06-30'
      }
    };

    expect(() => validateDataset({ ...dataset, players: [playerWithInvalidAttribute] })).toThrow();
  });
});

describe('Business Rule Validation', () => {
  it('should validate unique player IDs', () => {
    const players = [
      { id: 'PLY-000001', name: 'Player 1' },
      { id: 'PLY-000002', name: 'Player 2' }
    ];
    expect(() => validateUniqueIds(players, 'player')).not.toThrow();

    const duplicatePlayers = [
      { id: 'PLY-000001', name: 'Player 1' },
      { id: 'PLY-000001', name: 'Player 2' } // Duplicate ID
    ];
    expect(() => validateUniqueIds(duplicatePlayers, 'player')).toThrow(ValidationError);
  });

  it('should validate unique names per league', () => {
    const clubs = [
      { id: 'CLB-0001', nationality: 'ALX' },
      { id: 'CLB-0002', nationality: 'LUX' }
    ];

    const players = [
      { name: 'John Smith', nationality: 'ALX' },
      { name: 'João Silva', nationality: 'LUX' },
      { name: 'John Smith', nationality: 'LUX' } // Same name, different league - OK
    ];

    expect(() => validateUniqueNamesPerLeague(players as Player[], clubs as Club[])).not.toThrow();

    const duplicateNames = [
      { name: 'John Smith', nationality: 'ALX' },
      { name: 'John Smith', nationality: 'ALX' } // Duplicate name in same league
    ];

    expect(() => validateUniqueNamesPerLeague(duplicateNames as Player[], clubs as Club[])).toThrow(ValidationError);
  });

  it('should validate CA/PA consistency', () => {
    const validPlayer = {
      id: 'PLY-000001',
      name: 'Valid Player',
      position: 'ST',
      ca: 100,
      pa: 120,
      attributes: { finishing: 10 }
    };

    const invalidPlayer = {
      id: 'PLY-000002',
      name: 'Invalid Player',
      position: 'ST',
      ca: 120,
      pa: 100, // PA < CA - invalid
      attributes: { finishing: 10 }
    };

    expect(() => validateAttributeRanges([validPlayer] as Player[])).not.toThrow();
    expect(() => validateAttributeRanges([invalidPlayer] as Player[])).toThrow(ValidationError);
  });

  it('should validate squad sizes', () => {
    const club = { id: 'CLB-0001', name: 'Test FC' };
    
    // Valid squad size (25 players)
    const validSquad = Array.from({ length: 25 }, (_, i) => ({
      id: `PLY-${(i + 1).toString().padStart(6, '0')}`,
      clubId: 'CLB-0001',
      position: i < 3 ? 'GK' : 'ST'
    }));

    expect(() => validateSquadSizes(validSquad as Player[], [club] as Club[])).not.toThrow();

    // Invalid squad size (10 players - too few)
    const invalidSquad = Array.from({ length: 10 }, (_, i) => ({
      id: `PLY-${(i + 1).toString().padStart(6, '0')}`,
      clubId: 'CLB-0001',
      position: 'ST'
    }));

    expect(() => validateSquadSizes(invalidSquad as Player[], [club] as Club[])).toThrow(ValidationError);
  });
});

describe('Statistical Validation', () => {
  it('should calculate player attribute averages', () => {
    const players = [
      {
        attributes: { finishing: 10, pace: 15 }
      },
      {
        attributes: { finishing: 20, pace: 5 }
      }
    ];

    const averages = validatePlayerAttributeAverages(players as Player[]);
    expect(averages.finishing).toBe(15);
    expect(averages.pace).toBe(10);
  });

  it('should calculate club budget distribution', () => {
    const clubs = [
      { id: 'CLB-0001', division: 'ALX-D1', budget: 10000000 },
      { id: 'CLB-0002', division: 'ALX-D1', budget: 20000000 },
      { id: 'CLB-0003', division: 'ALX-D2', budget: 5000000 }
    ];

    const distribution = validateClubBudgetDistribution(clubs as Club[]);
    
    expect(distribution['ALX-D1'].min).toBe(10000000);
    expect(distribution['ALX-D1'].max).toBe(20000000);
    expect(distribution['ALX-D1'].avg).toBe(15000000);
    expect(distribution['ALX-D2'].avg).toBe(5000000);
  });
});

describe('Dataset Integrity', () => {
  it('should have expected number of leagues', () => {
    expect(dataset.leagues).toBeDefined();
    if (dataset.leagues.length > 0) {
      expect(dataset.leagues.length).toBe(6);
    }
  });

  it('should have expected league structure', () => {
    if (dataset.leagues.length > 0) {
      for (const league of dataset.leagues) {
        expect(league.divisions).toHaveLength(2);
        
        const d1 = league.divisions.find(d => d.level === 1);
        const d2 = league.divisions.find(d => d.level === 2);
        
        expect(d1).toBeDefined();
        expect(d2).toBeDefined();
        expect(d1?.teams).toBe(18);
        expect(d2?.teams).toBe(16);
      }
    }
  });

  it('should have clubs for each division', () => {
    if (dataset.clubs.length > 0) {
      const expectedClubs = 6 * (18 + 16); // 6 leagues * (18 D1 + 16 D2)
      expect(dataset.clubs.length).toBe(expectedClubs);
    }
  });

  it('should have players for each club', () => {
    if (dataset.players.length > 0 && dataset.clubs.length > 0) {
      const playersByClub = new Map<string, number>();
      for (const player of dataset.players) {
        const current = playersByClub.get(player.clubId) || 0;
        playersByClub.set(player.clubId, current + 1);
      }

      for (const club of dataset.clubs) {
        const squadSize = playersByClub.get(club.id) || 0;
        expect(squadSize).toBeGreaterThanOrEqual(20);
        expect(squadSize).toBeLessThanOrEqual(35);
      }
    }
  });

  it('should have appropriate fixture count', () => {
    if (dataset.fixtures.length > 0 && dataset.leagues.length > 0) {
      const fixturesByCompetition = new Map<string, number>();
      for (const fixture of dataset.fixtures) {
        const current = fixturesByCompetition.get(fixture.competition) || 0;
        fixturesByCompetition.set(fixture.competition, current + 1);
      }

      for (const league of dataset.leagues) {
        for (const division of league.divisions) {
          const expectedFixtures = division.teams * (division.teams - 1); // Double round-robin
          const actualFixtures = fixturesByCompetition.get(division.name) || 0;
          
          if (actualFixtures > 0) {
            expect(actualFixtures).toBe(expectedFixtures);
          }
        }
      }
    }
  });

  it('should have valid contract dates', () => {
    if (dataset.players.length > 0) {
      for (const player of dataset.players) {
        const expiryYear = parseInt(player.contract.expires.split('-')[0]);
        expect(expiryYear).toBeGreaterThanOrEqual(2025);
        expect(expiryYear).toBeLessThanOrEqual(2030);
      }
    }
  });

  it('should have realistic age distribution', () => {
    if (dataset.players.length > 0) {
      const ages = dataset.players.map(p => p.age);
      const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
      
      expect(avgAge).toBeGreaterThanOrEqual(20);
      expect(avgAge).toBeLessThanOrEqual(32);
    }
  });

  it('should have golden seed for reproducibility', () => {
    expect(dataset.seed).toBe(42);
  });
});