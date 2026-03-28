// src/services/queueWorker.ts
// Worker de file d'attente.
// Toutes les POLL_INTERVAL ms, il vérifie chaque guilde dont le busyUntil
// est dépassé (ou null) et envoie le prochain média en attente via Socket.io.

import type { Server as SocketIOServer } from "socket.io";
import { prisma } from "./prisma";

const POLL_INTERVAL_MS = 2_000;

export interface MediaPayload {
  id: string;
  type: string;
  content: string;
  author: string | null;
  authorImage: string | null;
  duration: number;
  discordGuildId: string;
}

/**
 * Démarre le worker en arrière-plan.
 * Retourne une fonction de nettoyage pour l'arrêt propre.
 */
export function startQueueWorker(io: SocketIOServer): () => void {
  console.log("[worker] Démarrage du worker de file d'attente...");

  const timer = setInterval(() => void tick(io), POLL_INTERVAL_MS);

  // Nettoyage pour GracefulServer
  return () => {
    clearInterval(timer);
    console.log("[worker] Worker arrêté proprement.");
  };
}

/**
 * Un tick du worker :
 * 1. Récupère toutes les guildes dont busyUntil est null ou passé.
 * 2. Pour chacune, prend le premier item en attente (executionDate la plus ancienne).
 * 3. Met à jour busyUntil et supprime l'item de la queue.
 * 4. Émet l'event Socket.io vers la room de la guilde.
 */
async function tick(io: SocketIOServer): Promise<void> {
  try {
    const now = new Date();

    // Guildes libres : busyUntil est null ou dans le passé
    const freeGuilds = await prisma.guild.findMany({
      where: {
        OR: [{ busyUntil: null }, { busyUntil: { lte: now } }],
      },
      select: { id: true },
    });

    if (freeGuilds.length === 0) return;

    // Traitement parallèle de chaque guilde libre
    await Promise.all(freeGuilds.map((guild) => processGuild(io, guild.id, now)));
  } catch (err) {
    console.error("[worker] Erreur dans le tick :", err);
  }
}

async function processGuild(
  io: SocketIOServer,
  guildId: string,
  now: Date
): Promise<void> {
  // Transaction pour éviter les race conditions si le worker tourne
  // sur plusieurs instances (futur scale-out)
  await prisma.$transaction(async (tx) => {
    // Prochain média à diffuser pour cette guilde
    const nextItem = await tx.queue.findFirst({
      where: {
        discordGuildId: guildId,
        executionDate: { lte: now },
      },
      orderBy: { executionDate: "asc" },
    });

    if (!nextItem) return;

    // Calcule la nouvelle date de fin : maintenant + durée du média
    const newBusyUntil = new Date(now.getTime() + nextItem.duration * 1_000);

    // Met à jour la guilde et supprime l'item en une seule transaction
    await Promise.all([
      tx.guild.update({
        where: { id: guildId },
        data: { busyUntil: newBusyUntil },
      }),
      tx.queue.delete({ where: { id: nextItem.id } }),
    ]);

    // Construit le payload typé
    const payload: MediaPayload = {
      id: nextItem.id,
      type: nextItem.type,
      content: nextItem.content,
      author: nextItem.author,
      authorImage: nextItem.authorImage,
      duration: nextItem.duration,
      discordGuildId: nextItem.discordGuildId,
    };

    // Émet uniquement vers la room de cette guilde
    io.to(guildId).emit("media:play", payload);

    console.log(
      `[worker] Guilde ${guildId} — émission de "${payload.type}" (${payload.duration}s) : ${payload.content}`
    );
  });
}
