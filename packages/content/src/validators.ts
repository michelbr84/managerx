import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import {
  ClubSchema,
  DataBundleSchema,
  FixtureSchema,
  LeagueSchema,
  PlayerSchema,
  StaffSchema,
} from "./schema";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

function uniq<T, K extends string | number>(items: T[], keyFn: (t: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key) || [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

export function validateDuplicates(dataDir: string): ValidationResult {
  const errors: string[] = [];
  const _leagues = z
    .array(LeagueSchema)
    .parse(JSON.parse(readFileSync(join(dataDir, "leagues.json"), "utf-8")));
  const clubs = z
    .array(ClubSchema)
    .parse(JSON.parse(readFileSync(join(dataDir, "clubs.json"), "utf-8")));
  const players = z
    .array(PlayerSchema)
    .parse(JSON.parse(readFileSync(join(dataDir, "players.json"), "utf-8")));
  const staff = z
    .array(StaffSchema)
    .parse(JSON.parse(readFileSync(join(dataDir, "staff.json"), "utf-8")));

  // No duplicate club names per league
  const byLeagueClubName = uniq(clubs, (c) => `${c.leagueId}|${c.name.toLowerCase()}`);
  for (const [key, list] of byLeagueClubName.entries()) {
    if (list.length > 1) {
      errors.push(`Duplicate club name within league: ${key} (${list.length})`);
    }
  }

  // No duplicate player names per league
  const byLeaguePlayerName = uniq(players, (p) => `${p.leagueId}|${p.name.toLowerCase()}`);
  for (const [key, list] of byLeaguePlayerName.entries()) {
    if (list.length > 1) {
      errors.push(`Duplicate player name within league: ${key} (${list.length})`);
    }
  }

  // No duplicate staff names per league
  const byLeagueStaffName = uniq(staff, (s) => `${s.leagueId}|${s.name.toLowerCase()}`);
  for (const [key, list] of byLeagueStaffName.entries()) {
    if (list.length > 1) {
      errors.push(`Duplicate staff name within league: ${key} (${list.length})`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateAttributeRanges(dataDir: string): ValidationResult {
  const errors: string[] = [];
  const players = z
    .array(PlayerSchema)
    .parse(JSON.parse(readFileSync(join(dataDir, "players.json"), "utf-8")));
  const staff = z
    .array(StaffSchema)
    .parse(JSON.parse(readFileSync(join(dataDir, "staff.json"), "utf-8")));

  function mean(nums: number[]): number {
    return nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
  }

  const pAttrs = [
    players.map((p) => p.attributes.pace),
    players.map((p) => p.attributes.technique),
    players.map((p) => p.attributes.passing),
    players.map((p) => p.attributes.defending),
    players.map((p) => p.attributes.finishing),
  ];
  const pMeans = pAttrs.map(mean);
  for (const m of pMeans) {
    if (m < 9 || m > 13.5) {
      errors.push(`Player attribute mean out of realistic range: ${m.toFixed(2)}`);
    }
  }
  const gkMean = mean(players.map((p) => p.attributes.goalkeeping));
  if (gkMean < 7 || gkMean > 14) {
    errors.push(`Goalkeeping mean out of range: ${gkMean.toFixed(2)}`);
  }

  const sAttrs = [
    staff.map((s) => s.attributes.tactical),
    staff.map((s) => s.attributes.manManagement),
    staff.map((s) => s.attributes.fitness),
    staff.map((s) => s.attributes.youth),
  ];
  const sMeans = sAttrs.map(mean);
  for (const m of sMeans) {
    if (m < 9 || m > 13.5) {
      errors.push(`Staff attribute mean out of realistic range: ${m.toFixed(2)}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateSquads(dataDir: string): ValidationResult {
  const errors: string[] = [];
  const clubs = z
    .array(ClubSchema)
    .parse(JSON.parse(readFileSync(join(dataDir, "clubs.json"), "utf-8")));
  const players = z
    .array(PlayerSchema)
    .parse(JSON.parse(readFileSync(join(dataDir, "players.json"), "utf-8")));

  const byClub = new Map<string, typeof players>();
  for (const p of players) {
    const list = byClub.get(p.clubId) || ([] as typeof players);
    list.push(p);
    byClub.set(p.clubId, list);
  }
  for (const club of clubs) {
    const list = byClub.get(club.id) || [];
    if (list.length < 22 || list.length > 28) {
      errors.push(`Club ${club.id} squad size ${list.length} out of 22..28`);
    }
    const gk = list.filter((p) => p.position === "GK").length;
    if (gk < 2) {
      errors.push(`Club ${club.id} has less than 2 goalkeepers (${gk})`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function validateFixtures(dataDir: string): ValidationResult {
  const errors: string[] = [];
  const leagues = z
    .array(LeagueSchema)
    .parse(JSON.parse(readFileSync(join(dataDir, "leagues.json"), "utf-8")));
  const clubs = z
    .array(ClubSchema)
    .parse(JSON.parse(readFileSync(join(dataDir, "clubs.json"), "utf-8")));
  const fixtures = z
    .array(FixtureSchema)
    .parse(JSON.parse(readFileSync(join(dataDir, "fixtures.season1.json"), "utf-8")));

  // For each league: double round-robin => each ordered pair appears exactly once
  const byLeague = new Map<string, typeof fixtures>();
  for (const f of fixtures) {
    const list = byLeague.get(f.leagueId) || ([] as typeof fixtures);
    list.push(f);
    byLeague.set(f.leagueId, list);
  }
  const byLeagueClubs = new Map<string, string[]>();
  for (const league of leagues) {
    byLeagueClubs.set(
      league.id,
      clubs.filter((c) => c.leagueId === league.id).map((c) => c.id),
    );
  }
  for (const [leagueId, list] of byLeague.entries()) {
    const ids = byLeagueClubs.get(leagueId)!;
    const expected = ids.length * (ids.length - 1);
    if (list.length !== expected) {
      errors.push(`League ${leagueId} fixtures ${list.length} != expected ${expected}`);
    }
    const keySet = new Set<string>();
    for (const f of list) {
      const key = `${f.homeClubId}|${f.awayClubId}`;
      if (f.homeClubId === f.awayClubId) {
        errors.push(`Fixture self-match ${key}`);
      }
      if (keySet.has(key)) {
        errors.push(`Duplicate fixture ${leagueId} ${key}`);
      }
      keySet.add(key);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function validateBundleShape(dataDir: string): ValidationResult {
  const leagues = JSON.parse(readFileSync(join(dataDir, "leagues.json"), "utf-8"));
  const clubs = JSON.parse(readFileSync(join(dataDir, "clubs.json"), "utf-8"));
  const players = JSON.parse(readFileSync(join(dataDir, "players.json"), "utf-8"));
  const staff = JSON.parse(readFileSync(join(dataDir, "staff.json"), "utf-8"));
  const fixtures = JSON.parse(readFileSync(join(dataDir, "fixtures.season1.json"), "utf-8"));
  const meta = JSON.parse(readFileSync(join(dataDir, "meta.json"), "utf-8"));
  const result = DataBundleSchema.safeParse({
    leagues,
    clubs,
    players,
    staff,
    fixtures,
    meta,
  });
  if (result.success) return { ok: true, errors: [] };
  return { ok: false, errors: result.error.errors.map((e) => e.message) };
}
