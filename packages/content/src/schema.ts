import { z } from "zod";

export const LeagueSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string().min(1),
  tier: z.number().int().min(1),
});

export type League = z.infer<typeof LeagueSchema>;

export const ClubSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  leagueId: z.string().min(1),
  strength: z.number().int().min(1).max(100),
});

export type Club = z.infer<typeof ClubSchema>;

export const PlayerSchema = z.object({
  id: z.string().min(1),
  clubId: z.string().min(1),
  leagueId: z.string().min(1),
  name: z.string().min(1),
  age: z.number().int().min(15).max(45),
  position: z.enum(["GK", "DEF", "MID", "FWD"]),
  attributes: z.object({
    pace: z.number().int().min(1).max(20),
    technique: z.number().int().min(1).max(20),
    passing: z.number().int().min(1).max(20),
    defending: z.number().int().min(1).max(20),
    finishing: z.number().int().min(1).max(20),
    goalkeeping: z.number().int().min(1).max(20),
  }),
});

export type Player = z.infer<typeof PlayerSchema>;

export const StaffSchema = z.object({
  id: z.string().min(1),
  clubId: z.string().min(1),
  leagueId: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(["HeadCoach", "AssistantCoach"]),
  attributes: z.object({
    tactical: z.number().int().min(1).max(20),
    manManagement: z.number().int().min(1).max(20),
    fitness: z.number().int().min(1).max(20),
    youth: z.number().int().min(1).max(20),
  }),
});

export type Staff = z.infer<typeof StaffSchema>;

export const FixtureSchema = z.object({
  id: z.string().min(1),
  seasonId: z.string().min(1),
  leagueId: z.string().min(1),
  round: z.number().int().min(1),
  date: z.string().datetime(),
  homeClubId: z.string().min(1),
  awayClubId: z.string().min(1),
});

export type Fixture = z.infer<typeof FixtureSchema>;

export const DataBundleSchema = z.object({
  leagues: z.array(LeagueSchema),
  clubs: z.array(ClubSchema),
  players: z.array(PlayerSchema),
  staff: z.array(StaffSchema),
  fixtures: z.array(FixtureSchema),
  meta: z.object({
    seed: z.string().min(1),
    season: z.string().min(1),
  }),
});

export type DataBundle = z.infer<typeof DataBundleSchema>;

export const GOLDEN_SEASON_SEED = "golden-season-v1";
