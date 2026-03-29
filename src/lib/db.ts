import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { assertEnv, env } from "@/lib/env";

assertEnv();

declare global {
  var __guesthubPool__: Pool | undefined;
}

const pool =
  global.__guesthubPool__ ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 15,
    idleTimeoutMillis: 30_000,
  });

if (env.NODE_ENV !== "production") {
  global.__guesthubPool__ = pool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  return pool.query<T>(text, values);
}

export async function tx<T>(fn: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
