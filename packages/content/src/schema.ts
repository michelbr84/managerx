import { z } from 'zod';

// Base types
export const PlayerPositionSchema = z.enum([
  'GK', 'DC', 'DL', 'DR', 'WBL', 'WBR', 'MC', 'ML', 'MR', 'AMC', 'AML', 'AMR', 'ST'
]);

export const FootSchema = z.enum(['L', 'R', 'Both']);
export const NationalitySchema = z.enum(['ALX', 'LUX', 'CAL', 'IBE', 'ITA', 'GER']);
export const DivisionSchema = z.enum(['D1', 'D2']);

// Attribute validation (1-20 range)
const AttributeSchema = z.number().int().min(1).max(20);

// Player attributes schema
export const PlayerAttributesSchema = z.object({
  // Technical
  finishing: AttributeSchema,
  firstTouch: AttributeSchema,
  dribbling: AttributeSchema,
  technique: AttributeSchema,
  crossing: AttributeSchema,
  passing: AttributeSchema,
  heading: AttributeSchema,
  tackling: AttributeSchema,
  
  // Physical
  pace: AttributeSchema,
  acceleration: AttributeSchema,
  agility: AttributeSchema,
  balance: AttributeSchema,
  strength: AttributeSchema,
  stamina: AttributeSchema,
  jumpingReach: AttributeSchema,
  
  // Mental
  decisions: AttributeSchema,
  anticipation: AttributeSchema,
  positioning: AttributeSchema,
  offTheBall: AttributeSchema,
  vision: AttributeSchema,
  workRate: AttributeSchema,
  bravery: AttributeSchema,
  composure: AttributeSchema,
  determination: AttributeSchema,
  
  // Goalkeeper specific (optional for outfield players)
  handling: AttributeSchema.optional(),
  reflexes: AttributeSchema.optional(),
  aerialReach: AttributeSchema.optional(),
  oneOnOnes: AttributeSchema.optional(),
  kicking: AttributeSchema.optional(),
});

// Staff attributes schema
export const StaffAttributesSchema = z.object({
  // Technical-Tactical
  tacticalKnowledge: AttributeSchema,
  trainingAttack: AttributeSchema,
  trainingDefense: AttributeSchema,
  setPieces: AttributeSchema,
  
  // Management
  manManagement: AttributeSchema,
  motivation: AttributeSchema,
  discipline: AttributeSchema,
  adaptability: AttributeSchema,
  
  // Scouting
  judgingAbility: AttributeSchema,
  judgingPotential: AttributeSchema,
  negotiating: AttributeSchema,
});

// Contract schema
export const ContractSchema = z.object({
  wage: z.number().int().min(1000), // Monthly wage in euros
  expires: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  releaseClause: z.number().int().min(0).optional(), // Optional release clause
  goalBonus: z.number().int().min(0).optional(), // Bonus per goal
  appearanceBonus: z.number().int().min(0).optional(), // Bonus per appearance
  signingBonus: z.number().int().min(0).optional(), // One-time signing bonus
});

// Player schema
export const PlayerSchema = z.object({
  id: z.string().regex(/^PLY-\d{6}$/), // PLY-000001 format
  clubId: z.string().regex(/^CLB-\d{4}$/), // CLB-0001 format
  name: z.string().min(2).max(50),
  age: z.number().int().min(16).max(42),
  nationality: NationalitySchema,
  position: PlayerPositionSchema,
  foot: FootSchema,
  attributes: PlayerAttributesSchema,
  ca: z.number().int().min(20).max(200), // Current Ability
  pa: z.number().int().min(20).max(200), // Potential Ability
  morale: z.number().int().min(1).max(100),
  condition: z.number().int().min(1).max(100),
  contract: ContractSchema,
});

// Staff schema
export const StaffSchema = z.object({
  id: z.string().regex(/^STF-\d{4}$/), // STF-0001 format
  clubId: z.string().regex(/^CLB-\d{4}$/),
  name: z.string().min(2).max(50),
  age: z.number().int().min(25).max(70),
  nationality: NationalitySchema,
  role: z.enum([
    'Manager',
    'Assistant Manager', 
    'First Team Coach',
    'Goalkeeping Coach',
    'Fitness Coach',
    'Chief Scout',
    'Scout'
  ]),
  attributes: StaffAttributesSchema,
  contract: ContractSchema,
});

// Club schema
export const ClubSchema = z.object({
  id: z.string().regex(/^CLB-\d{4}$/), // CLB-0001 format
  name: z.string().min(2).max(50),
  shortName: z.string().min(2).max(20),
  nationality: NationalitySchema,
  division: z.string(), // e.g., "AlbionX-D1"
  budget: z.number().int().min(100000), // Annual budget in euros
  reputation: z.number().int().min(1).max(100),
  stadium: z.object({
    name: z.string().min(2).max(50),
    capacity: z.number().int().min(1000).max(100000),
  }),
});

// League schema
export const LeagueSchema = z.object({
  id: z.string().regex(/^LEA-[A-F]$/), // LEA-A format
  name: z.string().min(2).max(50),
  nationality: NationalitySchema,
  divisions: z.array(z.object({
    name: z.string(), // e.g., "AlbionX-D1"
    level: z.number().int().min(1).max(2),
    teams: z.number().int().min(16).max(20),
    promotion: z.number().int().min(0).max(5),
    relegation: z.number().int().min(0).max(5),
    playoffs: z.number().int().min(0).max(8),
  })),
  cupName: z.string().min(2).max(50),
  foreignerRule: z.object({
    maxOnPitch: z.number().int().min(0).max(11).optional(),
    division: DivisionSchema.optional(),
  }).optional(),
});

// Fixture schema
export const FixtureSchema = z.object({
  id: z.string().regex(/^FX-\d{6}$/), // FX-000001 format
  season: z.number().int().min(2024).max(2040),
  competition: z.string(), // e.g., "AlbionX-D1", "AlbionX-Cup"
  round: z.number().int().min(1).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  homeClubId: z.string().regex(/^CLB-\d{4}$/),
  awayClubId: z.string().regex(/^CLB-\d{4}$/),
  homeScore: z.number().int().min(0).max(20).optional(), // null if not played
  awayScore: z.number().int().min(0).max(20).optional(),
  played: z.boolean().default(false),
});

// Season schema
export const SeasonSchema = z.object({
  year: z.number().int().min(2024).max(2040),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  transferWindows: z.array(z.object({
    name: z.enum(['Summer', 'Winter']),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })),
});

// Complete dataset schema
export const DatasetSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  seed: z.number().int(), // For reproducibility
  leagues: z.array(LeagueSchema),
  clubs: z.array(ClubSchema),
  players: z.array(PlayerSchema),
  staff: z.array(StaffSchema),
  fixtures: z.array(FixtureSchema),
  season: SeasonSchema,
});

// Export types
export type PlayerPosition = z.infer<typeof PlayerPositionSchema>;
export type Foot = z.infer<typeof FootSchema>;
export type Nationality = z.infer<typeof NationalitySchema>;
export type Division = z.infer<typeof DivisionSchema>;
export type PlayerAttributes = z.infer<typeof PlayerAttributesSchema>;
export type StaffAttributes = z.infer<typeof StaffAttributesSchema>;
export type Contract = z.infer<typeof ContractSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type Staff = z.infer<typeof StaffSchema>;
export type Club = z.infer<typeof ClubSchema>;
export type League = z.infer<typeof LeagueSchema>;
export type Fixture = z.infer<typeof FixtureSchema>;
export type Season = z.infer<typeof SeasonSchema>;
export type Dataset = z.infer<typeof DatasetSchema>;

// Validation utilities
export class ValidationError extends Error {
  constructor(message: string, public issues: z.ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateDataset(data: unknown): Dataset {
  const result = DatasetSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Dataset validation failed', result.error.issues);
  }
  return result.data;
}

export function validateUniqueIds<T extends { id: string }>(
  items: T[],
  itemType: string
): void {
  const ids = new Set<string>();
  const duplicates: string[] = [];
  
  for (const item of items) {
    if (ids.has(item.id)) {
      duplicates.push(item.id);
    } else {
      ids.add(item.id);
    }
  }
  
  if (duplicates.length > 0) {
    throw new ValidationError(
      `Duplicate ${itemType} IDs found: ${duplicates.join(', ')}`,
      []
    );
  }
}

export function validateUniqueNamesPerLeague(
  players: Player[],
  clubs: Club[]
): void {
  // Group players by nationality (league)
  const playersByNationality = new Map<string, Player[]>();
  for (const player of players) {
    const nationality = player.nationality;
    if (!playersByNationality.has(nationality)) {
      playersByNationality.set(nationality, []);
    }
    playersByNationality.get(nationality)!.push(player);
  }
  
  // Check for duplicate names within each nationality
  for (const [nationality, playersInLeague] of playersByNationality) {
    const names = new Set<string>();
    const duplicates: string[] = [];
    
    for (const player of playersInLeague) {
      if (names.has(player.name)) {
        duplicates.push(player.name);
      } else {
        names.add(player.name);
      }
    }
    
    if (duplicates.length > 0) {
      throw new ValidationError(
        `Duplicate player names in ${nationality}: ${duplicates.join(', ')}`,
        []
      );
    }
  }
}

export function validateAttributeRanges(players: Player[]): void {
  const issues: string[] = [];
  
  for (const player of players) {
    const attrs = player.attributes;
    
    // Check CA/PA consistency
    if (player.ca > player.pa) {
      issues.push(`Player ${player.id} (${player.name}): CA (${player.ca}) > PA (${player.pa})`);
    }
    
    // Position-specific attribute validation
    if (player.position === 'GK') {
      // Goalkeepers should have goalkeeper attributes
      if (!attrs.handling || !attrs.reflexes || !attrs.aerialReach || !attrs.oneOnOnes || !attrs.kicking) {
        issues.push(`Goalkeeper ${player.id} (${player.name}) missing required GK attributes`);
      }
    } else {
      // Outfield players shouldn't have goalkeeper attributes
      if (attrs.handling || attrs.reflexes || attrs.aerialReach || attrs.oneOnOnes || attrs.kicking) {
        issues.push(`Outfield player ${player.id} (${player.name}) has GK attributes`);
      }
    }
  }
  
  if (issues.length > 0) {
    throw new ValidationError(
      `Attribute validation failed:\n${issues.join('\n')}`,
      []
    );
  }
}

export function validateSquadSizes(players: Player[], clubs: Club[]): void {
  const playersByClub = new Map<string, Player[]>();
  
  // Group players by club
  for (const player of players) {
    if (!playersByClub.has(player.clubId)) {
      playersByClub.set(player.clubId, []);
    }
    playersByClub.get(player.clubId)!.push(player);
  }
  
  const issues: string[] = [];
  
  for (const club of clubs) {
    const squad = playersByClub.get(club.id) || [];
    const squadSize = squad.length;
    
    // Check squad size (reasonable range: 20-35 players)
    if (squadSize < 20 || squadSize > 35) {
      issues.push(`Club ${club.id} (${club.name}) has ${squadSize} players (expected 20-35)`);
    }
    
    // Check goalkeeper count (should have 2-4 goalkeepers)
    const goalkeepers = squad.filter(p => p.position === 'GK').length;
    if (goalkeepers < 2 || goalkeepers > 4) {
      issues.push(`Club ${club.id} (${club.name}) has ${goalkeepers} goalkeepers (expected 2-4)`);
    }
  }
  
  if (issues.length > 0) {
    throw new ValidationError(
      `Squad validation failed:\n${issues.join('\n')}`,
      []
    );
  }
}
