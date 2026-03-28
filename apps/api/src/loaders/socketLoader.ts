// src/loaders/socketLoader.ts
// Gère les connexions Socket.io, l'attribution aux rooms par guildId,
// et les événements de cycle de vie des clients overlay.

import type { FastifyInstance } from "fastify";

// Déclaration augmentée pour fastify-socket.io
declare module "fastify" {
  interface FastifyInstance {
    io: import("socket.io").Server;
  }
}

/**
 * Attache les gestionnaires d'événements Socket.io à l'instance Fastify.
 * Doit être appelé après l'enregistrement du plugin fastify-socket.io.
 */
export function initSocketLoader(fastify: FastifyInstance): void {
  const { io } = fastify;

  io.on("connection", (socket) => {
    const remoteAddress = socket.handshake.address;
    console.log(`[socket] Nouvelle connexion : ${socket.id} (${remoteAddress})`);

    // ── Rejoindre une room ─────────────────────────────────────────────────
    socket.on("join-room", (guildId: unknown) => {
      if (typeof guildId !== "string" || guildId.trim() === "") {
        socket.emit("error", {
          code: "INVALID_GUILD_ID",
          message: "Le guildId fourni est invalide ou manquant.",
        });
        console.warn(
          `[socket] ${socket.id} a tenté de rejoindre une room avec un guildId invalide.`
        );
        return;
      }

      const sanitizedGuildId = guildId.trim();

      // Quitte toutes les rooms précédentes (sauf la room par défaut = socket.id)
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.leave(room);
        }
      }

      socket.join(sanitizedGuildId);
      console.log(
        `[socket] ${socket.id} a rejoint la room "${sanitizedGuildId}"`
      );

      socket.emit("room:joined", {
        guildId: sanitizedGuildId,
        socketId: socket.id,
      });
    });

    // ── Ping de keepalive ──────────────────────────────────────────────────
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });

    // ── Déconnexion ────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(
        `[socket] Déconnexion de ${socket.id} — raison : ${reason}`
      );
    });

    // ── Erreurs socket ─────────────────────────────────────────────────────
    socket.on("error", (err) => {
      console.error(`[socket] Erreur sur ${socket.id} :`, err);
    });
  });

  console.log("[socket] Gestionnaire Socket.io initialisé.");
}
