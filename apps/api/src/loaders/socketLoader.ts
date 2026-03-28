// apps/api/src/loaders/socketLoader.ts
import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyInstance { io: import("socket.io").Server; }
}

export function initSocketLoader(fastify: FastifyInstance): void {
  const { io } = fastify;

  io.on("connection", (socket) => {
    console.log(`[socket] Connexion : ${socket.id}`);

    socket.on("join-room", (guildId: unknown) => {
      if (typeof guildId !== "string" || !guildId.trim()) {
        socket.emit("error", { code: "INVALID_GUILD_ID" });
        return;
      }
      for (const room of socket.rooms) {
        if (room !== socket.id) socket.leave(room);
      }
      socket.join(guildId.trim());
      socket.emit("room:joined", { guildId: guildId.trim(), socketId: socket.id });
      console.log(`[socket] ${socket.id} → room "${guildId.trim()}"`);
    });

    socket.on("ping", () => socket.emit("pong", { timestamp: Date.now() }));
    socket.on("disconnect", (r) => console.log(`[socket] ${socket.id} déconnecté (${r})`));
  });

  console.log("[socket] Socket.io initialisé.");
}
