import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing. Check your .env setup.");
}

const client: NeonQueryFunction<boolean, boolean> = neon(connectionString);
export const db = drizzle(client);

