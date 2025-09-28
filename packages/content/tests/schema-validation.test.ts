import { describe, it, expect } from 'vitest';
import {
  PlayerSchema,
  StaffSchema,
  ClubSchema,
  LeagueSchema,
  FixtureSchema,
  SeasonSchema,
  DatasetSchema,
  validateDataset,
  validateUniqueIds,
  validateUniqueNamesPerLeague,
  validateAttributeRanges,
  validateSquadSizes,
  ValidationError,
} from '../src/schema.js';
import type { Player, Club, Staff, League, Fixture, Season, Dataset } from '../src/schema.js';

describe('Schema Validation System', () => {
  describe('Player Schema', () => {
    it('should validate correct player data', () => {
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
          determination: 15,
        },
        ca: 125,
        pa: 150,
        morale: 75,
        condition: 95,
        contract: {
          wage: 8500,
          expires: '2027-06-30',
        },
      };

      expect(() => PlayerSchema.parse(validPlayer)).not.toThrow();
    });

    it('should reject players with invalid IDs', () => {
      const invalidPlayer = {
        id: 'INVALID-ID',
        clubId: 'CLB-0001',
        name: 'Test Player',
        age: 25,
        nationality: 'ALX',
        position: 'ST',
        foot: 'R',
        attributes: {},
        ca: 125,
        pa: 150,
        morale: 75,
        condition: 95,
        contract: { wage: 8500, expires: '2027-06-30' },
      };

      expect(() => PlayerSchema.parse(invalidPlayer)).toThrow();
    });

    it('should reject players with attributes outside 1-20 range', () => {
      const invalidPlayer = {
        id: 'PLY-000001',
        clubId: 'CLB-0001',
        name: 'Test Player',
        age: 25,
        nationality: 'ALX',
        position: 'ST',
        foot: 'R',
        attributes: {
          finishing: 25, // Invalid: > 20
          pace: 0,      // Invalid: < 1
        },
        ca: 125,
        pa: 150,
        morale: 75,
        condition: 95,
        contract: { wage: 8500, expires: '2027-06-30' },
      };

      expect(() => PlayerSchema.parse(invalidPlayer)).toThrow();
    });

    it('should validate goalkeeper attributes', () => {
      const goalkeeper = {
        id: 'PLY-000001',
        clubId: 'CLB-0001',
        name: 'Test Keeper',
        age: 25,
        nationality: 'ALX',
        position: 'GK',
        foot: 'R',
        attributes: {
          finishing: 5,
          firstTouch: 12,
          dribbling: 8,
          technique: 10,
          crossing: 5,
          passing: 12,
          heading: 10,
          tackling: 8,
          pace: 10,
          acceleration: 10,
          agility: 15,
          balance: 13,
          strength: 14,
          stamina: 13,
          jumpingReach: 16,
          decisions: 15,
          anticipation: 16,
          positioning: 17,
          offTheBall: 8,
          vision: 12,
          workRate: 14,
          bravery: 15,
          composure: 16,
          determination: 14,
          handling: 16,
          reflexes: 17,
          aerialReach: 15,
          oneOnOnes: 14,
          kicking: 13,
        },
        ca: 125,
        pa: 150,
        morale: 75,
        condition: 95,
        contract: { wage: 8500, expires: '2027-06-30' },
      };

      expect(() => PlayerSchema.parse(goalkeeper)).not.toThrow();
    });
  });

  describe('Club Schema', () => {
    it('should validate correct club data', () => {
      const validClub = {
        id: 'CLB-0001',
        name: 'Test FC',
        shortName: 'TEST',
        nationality: 'ALX',
        division: 'AlbionX-D1',
        budget: 15000000,
        reputation: 85,
        stadium: {
          name: 'Test Stadium',
          capacity: 45000,
        },
      };

      expect(() => ClubSchema.parse(validClub)).not.toThrow();
    });

    it('should reject clubs with invalid budget', () => {
      const invalidClub = {
        id: 'CLB-0001',
        name: 'Test FC',
        shortName: 'TEST',
        nationality: 'ALX',
        division: 'AlbionX-D1',
        budget: 50000, // Too low
        reputation: 85,
        stadium: { name: 'Test Stadium', capacity: 45000 },
      };

      expect(() => ClubSchema.parse(invalidClub)).toThrow();
    });
  });

  describe('League Schema', () => {
    it('should validate correct league structure', () => {
      const validLeague = {
        id: 'LEA-A',
        name: 'Test League',
        nationality: 'ALX',
        divisions: [
          {
            name: 'Test-D1',
            level: 1,
            teams: 18,
            promotion: 0,
            relegation: 3,
            playoffs: 0,
          },
          {
            name: 'Test-D2',
            level: 2,
            teams: 16,
            promotion: 3,
            relegation: 0,
            playoffs: 4,
          },
        ],
        cupName: 'Test Cup',
      };

      expect(() => LeagueSchema.parse(validLeague)).not.toThrow();
    });

    it('should validate foreigner rules', () => {
      const leagueWithForeignerRule = {
        id: 'LEA-E',
        name: 'Test League',
        nationality: 'ITA',
        divisions: [
          { name: 'Test-D1', level: 1, teams: 18, promotion: 0, relegation: 3, playoffs: 0 },
        ],
        cupName: 'Test Cup',
        foreignerRule: {
          maxOnPitch: 5,
          division: 'D1',
        },
      };

      expect(() => LeagueSchema.parse(leagueWithForeignerRule)).not.toThrow();
    });
  });

  describe('Business Rule Validators', () => {
    it('should validate unique IDs correctly', () => {
      const validPlayers = [
        { id: 'PLY-000001', name: 'Player 1' },
        { id: 'PLY-000002', name: 'Player 2' },
      ];

      expect(() => validateUniqueIds(validPlayers, 'player')).not.toThrow();

      const duplicatePlayers = [
        { id: 'PLY-000001', name: 'Player 1' },
        { id: 'PLY-000001', name: 'Player 2' }, // Duplicate ID
      ];

      expect(() => validateUniqueIds(duplicatePlayers, 'player')).toThrow(ValidationError);
    });

    it('should validate unique names per league', () => {
      const clubs = [
        { id: 'CLB-0001', nationality: 'ALX' },
        { id: 'CLB-0002', nationality: 'LUX' },
      ];

      const validPlayers = [
        { name: 'John Smith', nationality: 'ALX' },
        { name: 'João Silva', nationality: 'LUX' },
        { name: 'John Smith', nationality: 'LUX' }, // Same name, different league - OK
      ];

      expect(() => validateUniqueNamesPerLeague(validPlayers as Player[], clubs as Club[])).not.toThrow();

      const duplicateNames = [
        { name: 'John Smith', nationality: 'ALX' },
        { name: 'John Smith', nationality: 'ALX' }, // Duplicate in same league
      ];

      expect(() => validateUniqueNamesPerLeague(duplicateNames as Player[], clubs as Club[])).toThrow(ValidationError);
    });

    it('should validate CA/PA consistency', () => {
      const validPlayer = {
        id: 'PLY-000001',
        name: 'Valid Player',
        position: 'ST',
        ca: 100,
        pa: 120, // PA > CA - valid
        attributes: { finishing: 10 },
      };

      expect(() => validateAttributeRanges([validPlayer] as Player[])).not.toThrow();

      const invalidPlayer = {
        id: 'PLY-000002',
        name: 'Invalid Player',
        position: 'ST',
        ca: 120,
        pa: 100, // PA < CA - invalid
        attributes: { finishing: 10 },
      };

      expect(() => validateAttributeRanges([invalidPlayer] as Player[])).toThrow(ValidationError);
    });

    it('should validate goalkeeper-specific attributes', () => {
      const outfieldWithGKAttrs = {
        id: 'PLY-000001',
        name: 'Outfield Player',
        position: 'ST',
        ca: 100,
        pa: 120,
        attributes: {
          finishing: 15,
          handling: 10, // Outfield player shouldn't have GK attributes
        },
      };

      expect(() => validateAttributeRanges([outfieldWithGKAttrs] as Player[])).toThrow(ValidationError);

      const gkWithoutGKAttrs = {
        id: 'PLY-000002',
        name: 'Goalkeeper',
        position: 'GK',
        ca: 100,
        pa: 120,
        attributes: {
          finishing: 5,
          // Missing required GK attributes
        },
      };

      expect(() => validateAttributeRanges([gkWithoutGKAttrs] as Player[])).toThrow(ValidationError);
    });

    it('should validate squad sizes', () => {
      const club = { id: 'CLB-0001', name: 'Test FC' };
      
      // Valid squad size
      const validSquad = Array.from({ length: 25 }, (_, i) => ({
        id: `PLY-${(i + 1).toString().padStart(6, '0')}`,
        clubId: 'CLB-0001',
        position: i < 3 ? 'GK' : 'ST', // 3 goalkeepers
      }));

      expect(() => validateSquadSizes(validSquad as Player[], [club] as Club[])).not.toThrow();

      // Too few players
      const smallSquad = Array.from({ length: 15 }, (_, i) => ({
        id: `PLY-${(i + 1).toString().padStart(6, '0')}`,
        clubId: 'CLB-0001',
        position: 'ST',
      }));

      expect(() => validateSquadSizes(smallSquad as Player[], [club] as Club[])).toThrow(ValidationError);

      // Too few goalkeepers
      const noGKSquad = Array.from({ length: 25 }, (_, i) => ({
        id: `PLY-${(i + 1).toString().padStart(6, '0')}`,
        clubId: 'CLB-0001',
        position: 'ST', // No goalkeepers
      }));

      expect(() => validateSquadSizes(noGKSquad as Player[], [club] as Club[])).toThrow(ValidationError);
    });
  });

  describe('Contract Validation', () => {
    it('should validate contract structure', () => {
      const validContract = {
        wage: 8500,
        expires: '2027-06-30',
        releaseClause: 20000000,
        goalBonus: 1000,
        appearanceBonus: 500,
        signingBonus: 50000,
      };

      expect(() => PlayerSchema.shape.contract.parse(validContract)).not.toThrow();
    });

    it('should reject invalid contract dates', () => {
      const invalidContract = {
        wage: 8500,
        expires: 'invalid-date',
      };

      expect(() => PlayerSchema.shape.contract.parse(invalidContract)).toThrow();
    });

    it('should reject negative wages', () => {
      const invalidContract = {
        wage: -1000,
        expires: '2027-06-30',
      };

      expect(() => PlayerSchema.shape.contract.parse(invalidContract)).toThrow();
    });
  });

  describe('Enum Validations', () => {
    it('should validate player positions', () => {
      const validPositions = ['GK', 'DC', 'DL', 'DR', 'WBL', 'WBR', 'MC', 'ML', 'MR', 'AMC', 'AML', 'AMR', 'ST'];
      
      validPositions.forEach(position => {
        expect(() => PlayerSchema.shape.position.parse(position)).not.toThrow();
      });

      expect(() => PlayerSchema.shape.position.parse('INVALID')).toThrow();
    });

    it('should validate nationalities', () => {
      const validNationalities = ['ALX', 'LUX', 'CAL', 'IBE', 'ITA', 'GER'];
      
      validNationalities.forEach(nationality => {
        expect(() => PlayerSchema.shape.nationality.parse(nationality)).not.toThrow();
      });

      expect(() => PlayerSchema.shape.nationality.parse('INVALID')).toThrow();
    });

    it('should validate foot preferences', () => {
      const validFeet = ['L', 'R', 'Both'];
      
      validFeet.forEach(foot => {
        expect(() => PlayerSchema.shape.foot.parse(foot)).not.toThrow();
      });

      expect(() => PlayerSchema.shape.foot.parse('INVALID')).toThrow();
    });
  });

  describe('Attribute Range Validation', () => {
    it('should accept valid attribute ranges', () => {
      for (let i = 1; i <= 20; i++) {
        expect(() => PlayerSchema.shape.attributes.shape.finishing.parse(i)).not.toThrow();
      }
    });

    it('should reject attributes outside 1-20 range', () => {
      expect(() => PlayerSchema.shape.attributes.shape.finishing.parse(0)).toThrow();
      expect(() => PlayerSchema.shape.attributes.shape.finishing.parse(21)).toThrow();
      expect(() => PlayerSchema.shape.attributes.shape.finishing.parse(-5)).toThrow();
    });

    it('should require all mandatory attributes', () => {
      const incompleteAttributes = {
        finishing: 15,
        // Missing required attributes
      };

      expect(() => PlayerSchema.shape.attributes.parse(incompleteAttributes)).toThrow();
    });
  });

  describe('Age and Ability Validation', () => {
    it('should validate realistic age ranges', () => {
      expect(() => PlayerSchema.shape.age.parse(16)).not.toThrow(); // Minimum
      expect(() => PlayerSchema.shape.age.parse(42)).not.toThrow(); // Maximum
      expect(() => PlayerSchema.shape.age.parse(25)).not.toThrow(); // Typical

      expect(() => PlayerSchema.shape.age.parse(15)).toThrow(); // Too young
      expect(() => PlayerSchema.shape.age.parse(45)).toThrow(); // Too old
    });

    it('should validate CA/PA ranges', () => {
      expect(() => PlayerSchema.shape.ca.parse(20)).not.toThrow(); // Minimum
      expect(() => PlayerSchema.shape.ca.parse(200)).not.toThrow(); // Maximum
      expect(() => PlayerSchema.shape.pa.parse(20)).not.toThrow(); // Minimum
      expect(() => PlayerSchema.shape.pa.parse(200)).not.toThrow(); // Maximum

      expect(() => PlayerSchema.shape.ca.parse(19)).toThrow(); // Too low
      expect(() => PlayerSchema.shape.ca.parse(201)).toThrow(); // Too high
    });

    it('should validate morale and condition ranges', () => {
      expect(() => PlayerSchema.shape.morale.parse(1)).not.toThrow(); // Minimum
      expect(() => PlayerSchema.shape.morale.parse(100)).not.toThrow(); // Maximum
      expect(() => PlayerSchema.shape.condition.parse(1)).not.toThrow(); // Minimum
      expect(() => PlayerSchema.shape.condition.parse(100)).not.toThrow(); // Maximum

      expect(() => PlayerSchema.shape.morale.parse(0)).toThrow(); // Too low
      expect(() => PlayerSchema.shape.morale.parse(101)).toThrow(); // Too high
    });
  });

  describe('Staff Schema', () => {
    it('should validate staff roles', () => {
      const validRoles = [
        'Manager',
        'Assistant Manager',
        'First Team Coach',
        'Goalkeeping Coach',
        'Fitness Coach',
        'Chief Scout',
        'Scout',
      ];

      validRoles.forEach(role => {
        const staff = {
          id: 'STF-0001',
          clubId: 'CLB-0001',
          name: 'Test Staff',
          age: 45,
          nationality: 'ALX',
          role,
          attributes: {
            tacticalKnowledge: 15,
            trainingAttack: 14,
            trainingDefense: 13,
            setPieces: 12,
            manManagement: 16,
            motivation: 15,
            discipline: 14,
            adaptability: 13,
            judgingAbility: 15,
            judgingPotential: 14,
            negotiating: 13,
          },
          contract: { wage: 10000, expires: '2026-06-30' },
        };

        expect(() => StaffSchema.parse(staff)).not.toThrow();
      });
    });

    it('should validate staff age ranges', () => {
      expect(() => StaffSchema.shape.age.parse(25)).not.toThrow(); // Minimum
      expect(() => StaffSchema.shape.age.parse(70)).not.toThrow(); // Maximum

      expect(() => StaffSchema.shape.age.parse(24)).toThrow(); // Too young
      expect(() => StaffSchema.shape.age.parse(71)).toThrow(); // Too old
    });
  });

  describe('Fixture Schema', () => {
    it('should validate fixture structure', () => {
      const validFixture = {
        id: 'FX-000001',
        season: 2025,
        competition: 'AlbionX-D1',
        round: 1,
        date: '2024-08-10',
        homeClubId: 'CLB-0001',
        awayClubId: 'CLB-0002',
        played: false,
      };

      expect(() => FixtureSchema.parse(validFixture)).not.toThrow();
    });

    it('should validate played fixtures with scores', () => {
      const playedFixture = {
        id: 'FX-000001',
        season: 2025,
        competition: 'AlbionX-D1',
        round: 1,
        date: '2024-08-10',
        homeClubId: 'CLB-0001',
        awayClubId: 'CLB-0002',
        homeScore: 2,
        awayScore: 1,
        played: true,
      };

      expect(() => FixtureSchema.parse(playedFixture)).not.toThrow();
    });

    it('should reject invalid dates', () => {
      const invalidFixture = {
        id: 'FX-000001',
        season: 2025,
        competition: 'AlbionX-D1',
        round: 1,
        date: 'invalid-date',
        homeClubId: 'CLB-0001',
        awayClubId: 'CLB-0002',
        played: false,
      };

      expect(() => FixtureSchema.parse(invalidFixture)).toThrow();
    });
  });

  describe('Dataset Validation', () => {
    it('should validate complete dataset structure', () => {
      const validDataset: Dataset = {
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
            { name: 'Winter', startDate: '2025-01-01', endDate: '2025-01-31' },
          ],
        },
      };

      expect(() => validateDataset(validDataset)).not.toThrow();
    });

    it('should reject malformed datasets', () => {
      const invalidDataset = {
        version: 123, // Should be string
        generatedAt: new Date().toISOString(),
        seed: 42,
        leagues: [],
        clubs: [],
        players: [],
        staff: [],
        fixtures: [],
        season: {},
      };

      expect(() => validateDataset(invalidDataset)).toThrow(ValidationError);
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages', () => {
      try {
        const invalidPlayer = {
          id: 'INVALID',
          name: '',
          age: 15,
        };
        PlayerSchema.parse(invalidPlayer);
      } catch (error: any) {
        expect(error.issues).toBeDefined();
        expect(error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should handle ValidationError correctly', () => {
      const error = new ValidationError('Test error', []);
      
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test error');
      expect(error.issues).toEqual([]);
    });
  });

  describe('Performance', () => {
    it('should validate large datasets efficiently', () => {
      // Create a larger dataset for performance testing
      const largePlayers = Array.from({ length: 1000 }, (_, i) => ({
        id: `PLY-${(i + 1).toString().padStart(6, '0')}`,
        clubId: 'CLB-0001',
        name: `Player ${i + 1}`,
        age: 20 + (i % 15),
        nationality: 'ALX',
        position: 'ST',
        foot: 'R',
        attributes: {
          finishing: 10 + (i % 10),
          firstTouch: 10,
          dribbling: 10,
          technique: 10,
          crossing: 10,
          passing: 10,
          heading: 10,
          tackling: 10,
          pace: 10,
          acceleration: 10,
          agility: 10,
          balance: 10,
          strength: 10,
          stamina: 10,
          jumpingReach: 10,
          decisions: 10,
          anticipation: 10,
          positioning: 10,
          offTheBall: 10,
          vision: 10,
          workRate: 10,
          bravery: 10,
          composure: 10,
          determination: 10,
        },
        ca: 100,
        pa: 120,
        morale: 75,
        condition: 95,
        contract: { wage: 8500, expires: '2027-06-30' },
      }));

      const startTime = performance.now();
      
      expect(() => {
        largePlayers.forEach(player => PlayerSchema.parse(player));
      }).not.toThrow();
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      console.log(`Validated 1000 players in ${totalTime.toFixed(2)}ms`);
      
      // Should be reasonably fast
      expect(totalTime).toBeLessThan(1000); // 1 second for 1000 players
    });
  });
});
