import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzle>;

export function openDatabase(path: string = "./dev.sqlite") {
  const sqlite = new Database(path);
  return drizzle(sqlite, { schema });
}

export { schema };

