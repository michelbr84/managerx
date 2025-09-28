import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createPrng } from "../../core-sim/src/prng";
import { Club, Fixture, GOLDEN_SEASON_SEED, League, Player, Staff } from "./schema";

export interface GeneratedDataBundle {
  leagues: League[];
  clubs: Club[];
  players: Player[];
  staff: Staff[];
  fixtures: Fixture[];
  meta: { seed: string; season: string };
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function sampleTriangular01(rnd: () => number): number {
  // Sum of two uniforms approximates triangular distribution centered at 1
  const u1 = rnd();
  const u2 = rnd();
  return (u1 + u2) / 2; // mean ~0.5
}

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)]!;
}

const FIRST_NAMES = [
  "Alex",
  "Bruno",
  "Carlos",
  "Diego",
  "Edu",
  "Felipe",
  "Gustavo",
  "Hugo",
  "Igor",
  "Joao",
  "Kai",
  "Leo",
  "Mateo",
  "Nico",
  "Otavio",
  "Paulo",
  "Rafa",
  "Sergio",
  "Thiago",
  "Vitor",
  "Will",
];

const LAST_NAMES = [
  "Almeida",
  "Barros",
  "Cardoso",
  "Dias",
  "Esteves",
  "Ferreira",
  "Gomes",
  "Henrique",
  "Ibarra",
  "Jesus",
  "Klein",
  "Lima",
  "Moreira",
  "Nascimento",
  "Oliveira",
  "Pereira",
  "Queiroz",
  "Ribeiro",
  "Silva",
  "Teixeira",
  "Vasquez",
];

function generatePlayerName(rnd: () => number, uniqueSet: Set<string>): string {
  let attempt = 0;
  while (attempt < 5) {
    const name = `${pick(rnd, FIRST_NAMES)} ${pick(rnd, LAST_NAMES)}`;
    if (!uniqueSet.has(name)) {
      uniqueSet.add(name);
      return name;
    }
    attempt++;
  }
  // Fallback to guaranteed-unique suffix
  let suffix = 2;
   
  while (true) {
    const base = `${pick(rnd, FIRST_NAMES)} ${pick(rnd, LAST_NAMES)}`;
    const candidate = `${base} ${suffix}`;
    if (!uniqueSet.has(candidate)) {
      uniqueSet.add(candidate);
      return candidate;
    }
    suffix++;
  }
}

function attributeFromMean(rnd: () => number, mean: number, spread: number = 5): number {
  const tri = sampleTriangular01(rnd); // 0..1
  const val = mean + (tri - 0.5) * 2 * spread; // mean +/- spread
  return clampInt(val, 1, 20);
}

function generateLeagues(): League[] {
  const leagues: League[] = [];
  const ids = ["A", "B", "C", "D", "E", "F"];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]!;
    leagues.push({ id, name: `Liga ${id}`, country: `País ${id}`, tier: 1 });
  }
  return leagues;
}

function generateClubs(rnd: () => number, leagues: League[]): Club[] {
  // Distribute club counts to sum to 200: [34,34,34,34,32,32]
  const perLeagueCounts = [34, 34, 34, 34, 32, 32];
  const clubs: Club[] = [];
  for (let i = 0; i < leagues.length; i++) {
    const league = leagues[i]!;
    const count = perLeagueCounts[i]!;
    const nameSet = new Set<string>();
    for (let j = 1; j <= count; j++) {
      const idx = String(j).padStart(2, "0");
      const baseName = `${league.name} Clube ${idx}`;
      // ensure uniqueness per league
      let name = baseName;
      let k = 2;
      while (nameSet.has(name)) {
        name = `${baseName} ${k}`;
        k++;
      }
      nameSet.add(name);
      const strength = clampInt(55 + (rnd() - 0.5) * 30, 1, 100);
      clubs.push({
        id: `${league.id}-${idx}`,
        name,
        shortName: `${league.id}${idx}`,
        leagueId: league.id,
        strength,
      });
    }
  }
  return clubs;
}

function generateSquads(
  rnd: () => number,
  leagues: League[],
  clubs: Club[],
): { players: Player[]; staff: Staff[] } {
  const players: Player[] = [];
  const staff: Staff[] = [];

  const leagueToPlayerNames = new Map<string, Set<string>>();
  for (const league of leagues) {
    leagueToPlayerNames.set(league.id, new Set());
  }

  for (const club of clubs) {
    // Squad size around 24-26
    const squadSize = 24 + Math.floor(rnd() * 3); // 24..26
    // Position quotas
    const numGK = 2;
    const numDEF = clampInt(squadSize * 0.35, 8, 12);
    const numMID = clampInt(squadSize * 0.35, 8, 12);
    const numFWD = squadSize - numGK - numDEF - numMID;

    const nameSet = leagueToPlayerNames.get(club.leagueId)!;

    const pushPlayer = (position: Player["position"]) => {
      const id = `${club.id}-P${players.length + 1}`;
      const name = generatePlayerName(rnd, nameSet);
      const age = clampInt(18 + rnd() * 14, 15, 45);
      const baseMean = 11.5;
      const attributes = {
        pace: attributeFromMean(rnd, baseMean, 5),
        technique: attributeFromMean(rnd, baseMean, 5),
        passing: attributeFromMean(rnd, baseMean, 5),
        defending: attributeFromMean(rnd, baseMean, 5),
        finishing: attributeFromMean(rnd, baseMean, 5),
        goalkeeping: attributeFromMean(rnd, position === "GK" ? 13.5 : 7.5, 3),
      } as Player["attributes"];
      players.push({
        id,
        clubId: club.id,
        leagueId: club.leagueId,
        name,
        age,
        position,
        attributes,
      });
    };

    for (let i = 0; i < numGK; i++) pushPlayer("GK");
    for (let i = 0; i < numDEF; i++) pushPlayer("DEF");
    for (let i = 0; i < numMID; i++) pushPlayer("MID");
    for (let i = 0; i < numFWD; i++) pushPlayer("FWD");

    // Staff (2 per club)
    const coachName = generatePlayerName(rnd, nameSet);
    const asstName = generatePlayerName(rnd, nameSet);
    const staffBaseMean = 11.5;
    staff.push({
      id: `${club.id}-S1`,
      clubId: club.id,
      leagueId: club.leagueId,
      name: coachName,
      role: "HeadCoach",
      attributes: {
        tactical: attributeFromMean(rnd, staffBaseMean, 4),
        manManagement: attributeFromMean(rnd, staffBaseMean, 4),
        fitness: attributeFromMean(rnd, staffBaseMean, 4),
        youth: attributeFromMean(rnd, staffBaseMean, 4),
      },
    });
    staff.push({
      id: `${club.id}-S2`,
      clubId: club.id,
      leagueId: club.leagueId,
      name: asstName,
      role: "AssistantCoach",
      attributes: {
        tactical: attributeFromMean(rnd, staffBaseMean, 4),
        manManagement: attributeFromMean(rnd, staffBaseMean, 4),
        fitness: attributeFromMean(rnd, staffBaseMean, 4),
        youth: attributeFromMean(rnd, staffBaseMean, 4),
      },
    });
  }

  return { players, staff };
}

function generateFixtures(leagues: League[], clubs: Club[], seasonId: string): Fixture[] {
  const fixtures: Fixture[] = [];
  const leagueToClubs = new Map<string, Club[]>();
  for (const league of leagues) {
    leagueToClubs.set(
      league.id,
      clubs.filter((c) => c.leagueId === league.id),
    );
  }

  const baseDate = new Date("2025-08-02T15:00:00.000Z");

  for (const league of leagues) {
    const list = leagueToClubs.get(league.id)!;
    const n = list.length;
    // Circle method schedule for even n, double round-robin
    const rounds = n - 1;
    const half = n / 2;
    const teamIds = list.map((c) => c.id);
    const arr = [...teamIds];
    for (let r = 0; r < rounds; r++) {
      const roundDate = new Date(baseDate.getTime());
      roundDate.setUTCDate(baseDate.getUTCDate() + r * 7);
      for (let i = 0; i < half; i++) {
        const home = arr[i]!;
        const away = arr[n - 1 - i]!;
        fixtures.push({
          id: `${league.id}-S1-R${r + 1}-${home}-vs-${away}`,
          seasonId,
          leagueId: league.id,
          round: r + 1,
          date: roundDate.toISOString(),
          homeClubId: home,
          awayClubId: away,
        });
      }
      // rotate
      const fixed = arr[0]!;
      const moved = arr.splice(1, 1)[0]!;
      arr.splice(n - 1, 0, moved);
      arr[0] = fixed;
    }
    // reverse fixtures second half
    const offset = fixtures.length;
    for (let r = 0; r < rounds; r++) {
      const roundStart = offset - rounds * half + r * half;
      const roundDate = new Date(baseDate.getTime());
      roundDate.setUTCDate(baseDate.getUTCDate() + (rounds + r) * 7);
      for (let i = 0; i < half; i++) {
        const f = fixtures[roundStart + i]!;
        fixtures.push({
          id: `${league.id}-S1-R${rounds + r + 1}-${f.awayClubId}-vs-${f.homeClubId}`,
          seasonId,
          leagueId: league.id,
          round: rounds + r + 1,
          date: roundDate.toISOString(),
          homeClubId: f.awayClubId,
          awayClubId: f.homeClubId,
        });
      }
    }
  }
  return fixtures;
}

export function generateBundle(seed: string = GOLDEN_SEASON_SEED): GeneratedDataBundle {
  const prng = createPrng(seed);
  const rnd = () => prng.next();
  const leagues = generateLeagues();
  const clubs = generateClubs(rnd, leagues);
  const { players, staff } = generateSquads(rnd, leagues, clubs);
  const fixtures = generateFixtures(leagues, clubs, "S1");
  return {
    leagues,
    clubs,
    players,
    staff,
    fixtures,
    meta: { seed, season: "S1" },
  };
}

function writeJson(path: string, data: unknown) {
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

export function writeGeneratedFiles(bundle: GeneratedDataBundle, baseDir: string) {
  mkdirSync(baseDir, { recursive: true });
  writeJson(join(baseDir, "leagues.json"), bundle.leagues);
  writeJson(join(baseDir, "clubs.json"), bundle.clubs);
  writeJson(join(baseDir, "players.json"), bundle.players);
  writeJson(join(baseDir, "staff.json"), bundle.staff);
  writeJson(join(baseDir, "fixtures.season1.json"), bundle.fixtures);
  writeJson(join(baseDir, "meta.json"), bundle.meta);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const bundle = generateBundle();
  const outDir = join(process.cwd(), "src", "data");
  writeGeneratedFiles(bundle, outDir);
  // eslint-disable-next-line no-console
  console.log("Generated content data at", outDir);
}
