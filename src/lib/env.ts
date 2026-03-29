export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  SESSION_TTL_HOURS: Number(process.env.SESSION_TTL_HOURS ?? "24"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
};

export function assertEnv() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
}
