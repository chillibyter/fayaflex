import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Prevent unhandled 'error' events from crashing the server.
// Neon serverless terminates WebSocket connections periodically — this is normal.
pool.on('error', (err) => {
  console.error('[DB] Pool connection error (non-fatal):', err.message);
});
