// apps/api/src/services/env.ts

type Mode = "self-hosted" | "cloud";

interface Env {
  DATABASE_URL: string;
  DISCORD_TOKEN: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  PORT: number;
  HOST: string;
  PUBLIC_URL: string;
  FRONTEND_URL: string;
  SESSION_SECRET: string;
  MODE: Mode;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`[env] Variable manquante : ${key}`);
    process.exit(1);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

const rawMode = optionalEnv("MODE", "self-hosted");
const mode: Mode = rawMode === "cloud" ? "cloud" : "self-hosted";

export const env: Env = {
  DATABASE_URL:           requireEnv("DATABASE_URL"),
  DISCORD_TOKEN:          requireEnv("DISCORD_TOKEN"),
  DISCORD_CLIENT_ID:      requireEnv("DISCORD_CLIENT_ID"),
  // En self-hosted, le secret OAuth n'est pas requis (pas de site web)
  DISCORD_CLIENT_SECRET:  mode === "cloud"
                            ? requireEnv("DISCORD_CLIENT_SECRET")
                            : optionalEnv("DISCORD_CLIENT_SECRET", ""),
  PORT:                   parseInt(optionalEnv("PORT", "3000"), 10),
  HOST:                   optionalEnv("HOST", "0.0.0.0"),
  PUBLIC_URL:             optionalEnv("PUBLIC_URL", "http://localhost:3000"),
  FRONTEND_URL:           optionalEnv("FRONTEND_URL", "http://localhost:5173"),
  SESSION_SECRET:         optionalEnv("SESSION_SECRET", "change-me-in-production"),
  MODE:                   mode,
};

export const isSelfHosted = env.MODE === "self-hosted";
export const isCloud      = env.MODE === "cloud";
