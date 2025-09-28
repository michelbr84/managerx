export interface Club {
  id: string;
  name: string;
  shortName: string;
  leagueId: string;
  strength: number; // 0..100
}

export interface League {
  id: string;
  name: string;
  country: string;
  tier: number;
}

export interface DataBundle {
  leagues: League[];
  clubs: Club[];
}

export const leagues: League[] = [
  { id: "prem", name: "Premier League", country: "England", tier: 1 },
  { id: "laliga", name: "La Liga", country: "Spain", tier: 1 },
  { id: "seriea", name: "Serie A", country: "Italy", tier: 1 },
  { id: "bund", name: "Bundesliga", country: "Germany", tier: 1 },
  { id: "ligue1", name: "Ligue 1", country: "France", tier: 1 },
  { id: "brasileirao", name: "Brasileirão", country: "Brazil", tier: 1 },
];

function generateClubs(): Club[] {
  // Create ~200 clubs, distributed evenly across 6 leagues
  const clubs: Club[] = [];
  const perLeague = Math.floor(200 / leagues.length);
  let counter = 1;
  for (const league of leagues) {
    for (let i = 0; i < perLeague; i++) {
      const id = `${league.id}-${counter}`;
      clubs.push({
        id,
        name: `${league.name} Club ${counter}`,
        shortName: `${league.id.toUpperCase()}${counter}`,
        leagueId: league.id,
        strength: Math.max(10, Math.min(95, 50 + ((counter * 7) % 45) - 5)),
      });
      counter++;
    }
  }
  // If not exactly 200, pad with extra clubs in the last league
  while (clubs.length < 200) {
    const league = leagues[leagues.length - 1]!;
    const id = `${league.id}-${counter}`;
    clubs.push({
      id,
      name: `${league.name} Club ${counter}`,
      shortName: `${league.id.toUpperCase()}${counter}`,
      leagueId: league.id,
      strength: 50,
    });
    counter++;
  }
  return clubs;
}

export const clubs: Club[] = generateClubs();

export const bundle: DataBundle = { leagues, clubs };
