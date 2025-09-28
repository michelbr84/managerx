import Database from 'better-sqlite3';

async function main() {
  const { bundle } = await import('@managerx/content/dist/index.js');
  const sqlite = new Database('./dev.sqlite');

  sqlite.prepare(`CREATE TABLE IF NOT EXISTS leagues (id TEXT PRIMARY KEY, name TEXT NOT NULL, country TEXT NOT NULL, tier INTEGER NOT NULL)`).run();
  sqlite.prepare(`CREATE TABLE IF NOT EXISTS clubs (id TEXT PRIMARY KEY, name TEXT NOT NULL, short_name TEXT NOT NULL, league_id TEXT NOT NULL, strength INTEGER NOT NULL, FOREIGN KEY(league_id) REFERENCES leagues(id))`).run();

  const insertLeague = sqlite.prepare(`INSERT OR REPLACE INTO leagues (id, name, country, tier) VALUES (@id, @name, @country, @tier)`);
  const insertClub = sqlite.prepare(`INSERT OR REPLACE INTO clubs (id, name, short_name, league_id, strength) VALUES (@id, @name, @shortName, @leagueId, @strength)`);

  const tx = sqlite.transaction((leaguesArg, clubsArg) => {
    for (const l of leaguesArg) insertLeague.run(l);
    for (const c of clubsArg) insertClub.run(c);
  });

  tx(bundle.leagues, bundle.clubs);
  console.log('Seed completed:', { leagues: bundle.leagues.length, clubs: bundle.clubs.length });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


