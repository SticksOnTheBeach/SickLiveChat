// apps/api/src/routes/guilds.ts
// Retourne les serveurs Discord de l'utilisateur connecté

import type { FastifyInstance } from "fastify";
import { getUserFromSession } from "../services/discordOAuth";
import { getDiscordGuilds } from "../services/discordOAuth";
import { prisma } from "../services/prisma";
import { isSelfHosted } from "../services/env";

export async function guildRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/discord/guilds", async (req: any, reply) => {
    if (isSelfHosted) {
      return reply.send({ data: [] });
    }

    // Récupère le token depuis le cookie ou le header Authorization
    let token = req.cookies?.["session"];
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace("Bearer ", "").trim();
    }

    if (!token) return reply.status(401).send({ error: "Non authentifié" });

    const user = await getUserFromSession(token);
    if (!user) return reply.status(401).send({ error: "Session expirée" });

    // Récupère l'access token Discord de l'utilisateur
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.accessToken) {
      return reply.status(400).send({ error: "Token Discord manquant" });
    }

    try {
      const guilds = await getDiscordGuilds(dbUser.accessToken);
      // Filtre uniquement les serveurs où l'utilisateur est admin (permission 0x8)
      const adminGuilds = guilds.filter(
        (g) => (parseInt(g.permissions) & 0x8) !== 0
      );
      return reply.send({ data: adminGuilds });
    } catch (err) {
      console.error("[guilds] Erreur fetch guilds Discord :", err);
      return reply.status(500).send({ error: "Impossible de récupérer les serveurs Discord" });
    }
  });
}
