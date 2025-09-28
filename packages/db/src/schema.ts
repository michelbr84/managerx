import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const leagues = sqliteTable("leagues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  tier: integer("tier").notNull(),
});

export const clubs = sqliteTable("clubs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  leagueId: text("league_id")
    .references(() => leagues.id)
    .notNull(),
  strength: integer("strength").notNull(),
});

