// Re-export schema types and validators
export * from './schema.js';

// Re-export data loading utilities
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Dataset, League, Club, Player, Staff, Fixture, Season } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Lazy-loaded data
let _dataset: Dataset | null = null;
let _leagues: League[] | null = null;
let _clubs: Club[] | null = null;
let _players: Player[] | null = null;
let _staff: Staff[] | null = null;
let _fixtures: Fixture[] | null = null;
let _season: Season | null = null;

async function loadJsonFile<T>(filename: string): Promise<T> {
  const filePath = path.join(__dirname, 'data', filename);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

// Dataset loader
export async function loadDataset(): Promise<Dataset> {
  if (!_dataset) {
    _dataset = await loadJsonFile<Dataset>('dataset.json');
  }
  return _dataset;
}

// Individual data loaders
export async function loadLeagues(): Promise<League[]> {
  if (!_leagues) {
    _leagues = await loadJsonFile<League[]>('leagues.json');
  }
  return _leagues;
}

export async function loadClubs(): Promise<Club[]> {
  if (!_clubs) {
    _clubs = await loadJsonFile<Club[]>('clubs.json');
  }
  return _clubs;
}

export async function loadPlayers(): Promise<Player[]> {
  if (!_players) {
    _players = await loadJsonFile<Player[]>('players.json');
  }
  return _players;
}

export async function loadStaff(): Promise<Staff[]> {
  if (!_staff) {
    _staff = await loadJsonFile<Staff[]>('staff.json');
  }
  return _staff;
}

export async function loadFixtures(): Promise<Fixture[]> {
  if (!_fixtures) {
    _fixtures = await loadJsonFile<Fixture[]>('fixtures.json');
  }
  return _fixtures;
}

export async function loadSeason(): Promise<Season> {
  if (!_season) {
    _season = await loadJsonFile<Season>('season.json');
  }
  return _season;
}

// Utility functions
export async function getClubsByDivision(division: string): Promise<Club[]> {
  const clubs = await loadClubs();
  return clubs.filter(club => club.division === division);
}

export async function getPlayersByClub(clubId: string): Promise<Player[]> {
  const players = await loadPlayers();
  return players.filter(player => player.clubId === clubId);
}

export async function getStaffByClub(clubId: string): Promise<Staff[]> {
  const staff = await loadStaff();
  return staff.filter(member => member.clubId === clubId);
}

export async function getFixturesByCompetition(competition: string): Promise<Fixture[]> {
  const fixtures = await loadFixtures();
  return fixtures.filter(fixture => fixture.competition === competition);
}

export async function getPlayersByPosition(position: string): Promise<Player[]> {
  const players = await loadPlayers();
  return players.filter(player => player.position === position);
}

export async function getPlayersByNationality(nationality: string): Promise<Player[]> {
  const players = await loadPlayers();
  return players.filter(player => player.nationality === nationality);
}

// Synchronous getters (for compatibility with existing tests)
export const leagues: League[] = [];
export const clubs: Club[] = [];
export const players: Player[] = [];
export const staff: Staff[] = [];
export const fixtures: Fixture[] = [];

// Bundle for compatibility
export const bundle = {
  leagues,
  clubs,
  players,
  staff,
  fixtures,
  season: null as Season | null
};

// Initialize synchronous data (for testing)
export async function initializeSyncData(): Promise<void> {
  try {
    const [loadedLeagues, loadedClubs, loadedPlayers, loadedStaff, loadedFixtures, loadedSeason] = await Promise.all([
      loadLeagues(),
      loadClubs(), 
      loadPlayers(),
      loadStaff(),
      loadFixtures(),
      loadSeason()
    ]);

    leagues.splice(0, leagues.length, ...loadedLeagues);
    clubs.splice(0, clubs.length, ...loadedClubs);
    players.splice(0, players.length, ...loadedPlayers);
    staff.splice(0, staff.length, ...loadedStaff);
    fixtures.splice(0, fixtures.length, ...loadedFixtures);
    bundle.season = loadedSeason;
    
    bundle.leagues = leagues;
    bundle.clubs = clubs;
    bundle.players = players;
    bundle.staff = staff;
    bundle.fixtures = fixtures;
  } catch (error) {
    console.warn('Could not load content data files. Run `pnpm content:generate` first.');
  }
}