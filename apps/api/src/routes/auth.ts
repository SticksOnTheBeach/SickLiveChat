// apps/api/src/routes/auth.ts
// Routes OAuth discord : /auth/url, /auth/callback, /auth/me, /auth/logout

import type { FastifyInstance } from "fastify";
import {
  getOAuthUrl,
  exchangeCode,
  getDiscordUser,
  upsertUser,
  createSession,
  getUserFromSession,
  deleteSession,
} from "../services/discordOAuth";
import { isCloud } from "../services/env";

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Mode self-hosted : pas d'OAuth nécessaire
  if (!isCloud) {
    fastify.get("/auth/me", async (_req, reply) => {
      return reply.send({
        data: { id: "local", discordId: "local", username: "Self-hosted", avatar: null, createdAt: new Date().toISOString() },
      });
    });
    return;
  }

    // ── GET /auth/url — redirige vers la page de login Discord ─────────────────────
    fastify.get("/auth/url", async (_req, reply) => {
        const state = Math.random().toString(36).slice(2);
        const url = getOAuthUrl(state);
        return reply.redirect(url);
    });

  // ── GET /auth/callback — reçoit le code discord et crée la session ───────
  fastify.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    "/auth/callback",
    async (req, reply) => {
      const { code, error } = req.query;

      if (error || !code) {
        return reply.redirect(`${process.env["FRONTEND_URL"]}/?error=oauth_denied`);
      }

      try {
        const tokens = await exchangeCode(code);
        const discordUser = await getDiscordUser(tokens.access_token);
        const user = await upsertUser(discordUser, tokens.access_token, tokens.refresh_token);
        const sessionToken = await createSession(user.id);

          return reply
              .setCookie("session", sessionToken, {
                  httpOnly: true,
                  secure: true,
                  sameSite: "none",
                  maxAge: 30 * 24 * 60 * 60,
                  path: "/",
              })
          .redirect(`${process.env["FRONTEND_URL"]}/dashboard`);
      } catch (err) {
        console.error("[auth] Erreur callback OAuth :", err);
        return reply.redirect(`${process.env["FRONTEND_URL"]}/?error=oauth_failed`);
      }
    }
  );

  // ── GET /auth/me — retourne l'utilisateur connecté ──────────────────────
  fastify.get("/auth/me", async (req, reply) => {
    const token = req.cookies?.["session"];
    if (!token) return reply.status(401).send({ error: "Non authentifié" });

    const user = await getUserFromSession(token);
    if (!user) return reply.status(401).send({ error: "Session expirée" });

    return reply.send({ data: user });
  });

  // ── POST /auth/logout ────────────────────────────────────────────────────
  fastify.post("/auth/logout", async (req, reply) => {
    const token = req.cookies?.["session"];
    if (token) await deleteSession(token);

    return reply
      .clearCookie("session", { path: "/" })
      .send({ data: { ok: true } });
  });
}
