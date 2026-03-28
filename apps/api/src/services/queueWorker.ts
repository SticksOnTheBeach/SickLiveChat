// apps/api/src/services/queueWorker.ts

import type { Server as SocketIOServer } from "socket.io";
import { prisma } from "./prisma";
import type { MediaPayload } from "@stream-overlay/types";

const POLL_INTERVAL_MS = 2_000;

export function startQueueWorker(io: SocketIOServer): () => void {
  console.log("[worker] Démarrage du worker...");
  const timer = setInterval(() => void tick(io), POLL_INTERVAL_MS);
  return () => {
    clearInterval(timer);
    console.log("[worker] Worker arrêté.");
  };
}

async function tick(io: SocketIOServer): Promise<void> {
  try {
    const now = new Date();

    const freeGuilds = await prisma.guild.findMany({
      where: { OR: [{ busyUntil: null }, { busyUntil: { lte: now } }] },
      select: { id: true },
    });

    if (freeGuilds.length === 0) return;
    await Promise.all(freeGuilds.map((g) => processGuild(io, g.id, now)));
  } catch (err) {
    console.error("[worker] Erreur tick :", err);
  }
}

async function processGuild(io: SocketIOServer, guildId: string, now: Date): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const nextItem = await tx.queue.findFirst({
      where: { discordGuildId: guildId, executionDate: { lte: now } },
      orderBy: { executionDate: "asc" },
    });

    if (!nextItem) return;

    const newBusyUntil = new Date(now.getTime() + nextItem.duration * 1_000);

    await Promise.all([
      tx.guild.update({ where: { id: guildId }, data: { busyUntil: newBusyUntil } }),
      tx.queue.delete({ where: { id: nextItem.id } }),
    ]);

    const payload: MediaPayload = {
      id: nextItem.id,
      type: nextItem.type as "image" | "video",
      content: nextItem.content,
      author: nextItem.author,
      authorImage: nextItem.authorImage,
      duration: nextItem.duration,
      discordGuildId: nextItem.discordGuildId,
    };

    io.to(guildId).emit("media:play", payload);
    console.log(`[worker] Guilde ${guildId} → ${payload.type} (${payload.duration}s)`);
  });
}
