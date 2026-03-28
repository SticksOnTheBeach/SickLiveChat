// src/services/env.ts
// Valide et expose les variables d'environnement avec typage strict.
// Le process s'arrête immédiatement si une variable requise est absente.

interface Env {
  DATABASE_URL: string;
  DISCORD_TOKEN: string;
  DISCORD_CLIENT_ID: string;
  PORT: number;
  HOST: string;
  PUBLIC_URL: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`[env] Variable d'environnement manquante : ${key}`);
    process.exit(1);
  }
  return value;
}

export const env: Env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  DISCORD_TOKEN: requireEnv("DISCORD_TOKEN"),
  DISCORD_CLIENT_ID: requireEnv("DISCORD_CLIENT_ID"),
  PORT: parseInt(process.env["PORT"] ?? "3000", 10),
  HOST: process.env["HOST"] ?? "0.0.0.0",
  PUBLIC_URL: process.env["PUBLIC_URL"] ?? "http://localhost:3000",
};
