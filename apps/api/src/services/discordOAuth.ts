// apps/api/src/services/discordOAuth.ts
// Gère le flux OAuth2 discord pour la connexion via le site web.

import { env } from "./env";
import { prisma } from "./prisma";
import type { DiscordGuild, User } from "@stream-overlay/types";

const DISCORD_API = "https://discord.com/api/v10";
const SCOPES = ["identify", "guilds"].join("%20");

// ---------------------------------------------------------------------------
// URL de redirection OAuth discord
// ---------------------------------------------------------------------------
export function getOAuthUrl(state: string): string {
  return (
    `https://discord.com/api/oauth2/authorize` +
    `?client_id=${env.DISCORD_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(`${env.PUBLIC_URL}/auth/callback`)}` +
    `&response_type=code` +
    `&scope=${SCOPES}` +
    `&state=${state}`
  );
}

// ---------------------------------------------------------------------------
// Échange le code OAuth contre un access_token
// ---------------------------------------------------------------------------
export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: `${env.PUBLIC_URL}/auth/callback`,
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) {
    throw new Error(`Discord token exchange failed: ${res.status}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>;
}

// ---------------------------------------------------------------------------
// Récupère le profil discord de l'utilisateur
// ---------------------------------------------------------------------------
export async function getDiscordUser(
  accessToken: string
): Promise<{ id: string; username: string; discriminator: string; avatar: string | null }> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error("Failed to fetch discord user");
  return res.json() as Promise<{ id: string; username: string; discriminator: string; avatar: string | null }>;
}

// ---------------------------------------------------------------------------
// Récupère les serveurs discord de l'utilisateur
// ---------------------------------------------------------------------------
export async function getDiscordGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error("Failed to fetch discord guilds");
  return res.json() as Promise<DiscordGuild[]>;
}

// ---------------------------------------------------------------------------
// Crée ou met à jour un utilisateur en DB après le login OAuth
// ---------------------------------------------------------------------------
export async function upsertUser(
  discordUser: { id: string; username: string; discriminator: string; avatar: string | null },
  accessToken: string,
  refreshToken: string
): Promise<User> {
  const avatarUrl = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
    : null;

  const user = await prisma.user.upsert({
    where: { discordId: discordUser.id },
    update: {
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: avatarUrl,
      accessToken,
      refreshToken,
    },
    create: {
      discordId: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: avatarUrl,
      accessToken,
      refreshToken,
    },
  });

  return {
    id: user.id,
    discordId: user.discordId,
    username: user.username,
    avatar: user.avatar,
    createdAt: user.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Crée une session après login
// ---------------------------------------------------------------------------
export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours

  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });

  return session.token;
}

// ---------------------------------------------------------------------------
// Vérifie un token de session et retourne l'utilisateur
// ---------------------------------------------------------------------------
export async function getUserFromSession(token: string): Promise<User | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;

  return {
    id: session.user.id,
    discordId: session.user.discordId,
    username: session.user.username,
    avatar: session.user.avatar,
    createdAt: session.user.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Supprime une session (logout)
// ---------------------------------------------------------------------------
export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}
