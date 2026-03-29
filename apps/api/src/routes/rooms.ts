// apps/api/src/routes/rooms.ts
// CRUD des rooms : création, lecture, paramètres, suppression.

import type { FastifyInstance } from "fastify";
import { prisma } from "../services/prisma";
import { getUserFromSession } from "../services/discordOAuth";
import { getDiscordGuilds } from "../services/discordOAuth";
import { env, isSelfHosted } from "../services/env";
import type { Room } from "@stream-overlay/types";

// Middleware : vérifie la session et injecte l'utilisateur
async function requireAuth(req: any, reply: any) {
    if (isSelfHosted) return;
    let token = req.cookies?.["session"];

    if (!token && req.headers.authorization) {
        token = req.headers.authorization.replace("Bearer ", "");
    }
    if (!token) return reply.status(401).send({ error: "Non authentifié" });
    const user = await getUserFromSession(token);
    if (!user) return reply.status(401).send({ error: "Session expirée" });

    req.user = user;
}

function buildOverlayUrl(guildId: string): string {
  return `${env.PUBLIC_URL}/overlay.html?guildId=${guildId}`;
}

function formatRoom(room: any): Room {
  return {
    id: room.id,
    name: room.name,
    guildId: room.guildId,
    guildName: room.guildName,
    overlayUrl: buildOverlayUrl(room.guildId),
    defaultMediaTime: room.defaultMediaTime,
    maxMediaTime: room.maxMediaTime,
    displayMediaFull: room.displayMediaFull,
    ownerId: room.ownerId,
    createdAt: room.createdAt.toISOString(),
  };
}

export async function roomRoutes(fastify: FastifyInstance): Promise<void> {

  // ── GET /rooms — liste les rooms de l'utilisateur ───────────────────────
  fastify.get("/rooms", { preHandler: requireAuth }, async (req: any, reply) => {
    const where = isSelfHosted ? {} : { ownerId: req.user.id };

    const rooms = await prisma.room.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return reply.send({ data: rooms.map(formatRoom) });
  });

  // ── POST /rooms — crée une room pour un serveur discord ─────────────────
  fastify.post<{
    Body: { guildId: string; guildName: string; name: string };
  }>("/rooms", { preHandler: requireAuth }, async (req: any, reply) => {
    const { guildId, guildName, name } = req.body;

    if (!guildId || !guildName || !name) {
      return reply.status(400).send({ error: "guildId, guildName et name sont requis" });
    }

    // Vérifie que la room n'existe pas déjà
    const existing = await prisma.room.findUnique({ where: { guildId } });
    if (existing) {
      return reply.status(409).send({ error: "Une room existe déjà pour ce serveur discord" });
    }

    // En mode cloud : vérifie que l'utilisateur est bien admin du serveur
    if (!isSelfHosted) {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (user?.accessToken) {
        const guilds = await getDiscordGuilds(user.accessToken);
        const guild = guilds.find((g) => g.id === guildId);
        // Permission 0x8 = ADMINISTRATOR
        const isAdmin = guild && (parseInt(guild.permissions) & 0x8) !== 0;
        if (!isAdmin) {
          return reply.status(403).send({ error: "Vous devez être administrateur de ce serveur" });
        }
      }
    }

    const ownerId = isSelfHosted ? "local" : req.user.id;

    const room = await prisma.room.create({
      data: {
        name,
        guildId,
        guildName,
        ownerId,
        guild: {
          create: { id: guildId },
        },
      },
    });

    return reply.status(201).send({ data: formatRoom(room) });
  });

  // ── GET /rooms/:id — détails d'une room ─────────────────────────────────
  fastify.get<{ Params: { id: string } }>(
    "/rooms/:id",
    { preHandler: requireAuth },
    async (req: any, reply) => {
      const room = await prisma.room.findUnique({ where: { id: req.params.id } });

      if (!room) return reply.status(404).send({ error: "Room introuvable" });
      if (!isSelfHosted && room.ownerId !== req.user.id) {
        return reply.status(403).send({ error: "Accès refusé" });
      }

      return reply.send({ data: formatRoom(room) });
    }
  );

  // ── PATCH /rooms/:id — met à jour les paramètres ─────────────────────────
  fastify.patch<{
    Params: { id: string };
    Body: {
      name?: string;
      defaultMediaTime?: number;
      maxMediaTime?: number;
      displayMediaFull?: boolean;
    };
  }>("/rooms/:id", { preHandler: requireAuth }, async (req: any, reply) => {
    const room = await prisma.room.findUnique({ where: { id: req.params.id } });

    if (!room) return reply.status(404).send({ error: "Room introuvable" });
    if (!isSelfHosted && room.ownerId !== req.user.id) {
      return reply.status(403).send({ error: "Accès refusé" });
    }

    const { name, defaultMediaTime, maxMediaTime, displayMediaFull } = req.body;

    const updated = await prisma.room.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(defaultMediaTime !== undefined && { defaultMediaTime }),
        ...(maxMediaTime !== undefined && { maxMediaTime }),
        ...(displayMediaFull !== undefined && { displayMediaFull }),
      },
    });

    return reply.send({ data: formatRoom(updated) });
  });

  // ── DELETE /rooms/:id ────────────────────────────────────────────────────
  fastify.delete<{ Params: { id: string } }>(
    "/rooms/:id",
    { preHandler: requireAuth },
    async (req: any, reply) => {
      const room = await prisma.room.findUnique({ where: { id: req.params.id } });

      if (!room) return reply.status(404).send({ error: "Room introuvable" });
      if (!isSelfHosted && room.ownerId !== req.user.id) {
        return reply.status(403).send({ error: "Accès refusé" });
      }

      await prisma.room.delete({ where: { id: req.params.id } });
      return reply.send({ data: { ok: true } });
    }
  );

  // ── GET /rooms/:id/queue — file d'attente en cours ───────────────────────
  fastify.get<{ Params: { id: string } }>(
    "/rooms/:id/queue",
    { preHandler: requireAuth },
    async (req: any, reply) => {
      const room = await prisma.room.findUnique({ where: { id: req.params.id } });
      if (!room) return reply.status(404).send({ error: "Room introuvable" });

      const items = await prisma.queue.findMany({
        where: { roomId: req.params.id },
        orderBy: { executionDate: "asc" },
      });

      return reply.send({ data: items });
    }
  );

  // ── GET /rooms/:id/history — 50 derniers médias diffusés ─────────────────
  // Note : pour l'historique complet il faudrait une table History séparée.
  // Pour l'instant on retourne la queue + les infos de la guild (busyUntil).
  fastify.get<{ Params: { id: string } }>(
    "/rooms/:id/status",
    { preHandler: requireAuth },
    async (req: any, reply) => {
      const room = await prisma.room.findUnique({
        where: { id: req.params.id },
        include: { guild: true },
      });

      if (!room) return reply.status(404).send({ error: "Room introuvable" });

      const queueCount = await prisma.queue.count({ where: { roomId: req.params.id } });

      return reply.send({
        data: {
          room: formatRoom(room),
          busyUntil: room.guild?.busyUntil ?? null,
          queueCount,
          overlayUrl: buildOverlayUrl(room.guildId),
        },
      });
    }
  );
}
