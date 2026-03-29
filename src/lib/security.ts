import crypto from "node:crypto";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [algo, salt, digest] = hash.split("$");
  if (algo !== "scrypt" || !salt || !digest) return false;

  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  const digestBuffer = Buffer.from(digest, "hex");
  const derivedBuffer = Buffer.from(derived, "hex");

  if (digestBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(digestBuffer, derivedBuffer);
}

export function createSessionToken(): string {
  return `${crypto.randomUUID()}${crypto.randomBytes(24).toString("hex")}`;
}
