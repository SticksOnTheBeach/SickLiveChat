// src/server.ts
// Configure et démarre l'instance Fastify avec :
// - @fastify/cors
// - @fastify/static (sert public/)
// - fastify-socket.io
// - @gquittet/graceful-server
// - Hooks d'arrêt propre (Prisma, Socket.io, worker, Discord)

import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import staticPlugin from "@fastify/static";
import socketioPlugin from "fastify-socket.io";
import GracefulServer from "@gquittet/graceful-server";
import path from "path";
import { prisma } from "./services/prisma";
import { initSocketLoader } from "./loaders/socketLoader";
import { startQueueWorker } from "./services/queueWorker";
import { startDiscordLoader } from "./loaders/discordLoader";
import { env } from "./services/env";

export async function runServer(): Promise<FastifyInstance> {
  // ── Instance Fastify ─────────────────────────────────────────────────────
  const fastify = Fastify({
    logger: {
      level: process.env["NODE_ENV"] === "production" ? "warn" : "info",
    },
  });

  // ── CORS ─────────────────────────────────────────────────────────────────
  await fastify.register(cors, {
    origin: "*", // Ajuster en production selon le domaine de l'overlay
    methods: ["GET", "POST"],
  });

  // ── Fichiers statiques (overlay.html, assets) ────────────────────────────
  await fastify.register(staticPlugin, {
    root: path.join(process.cwd(), "public"),
    prefix: "/",
  });

  // ── Socket.io ────────────────────────────────────────────────────────────
  await fastify.register(socketioPlugin, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  // ── Route de santé (health check) ────────────────────────────────────────
  fastify.get("/health", async (_req, reply) => {
    return reply.send({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ── Initialisation après que tous les plugins sont chargés ───────────────
  // (fastify.ready() est appelé dans index.ts — on utilise addHook pour
  //  s'assurer que io est disponible avant d'attacher les handlers)
  fastify.addHook("onReady", async () => {
    // Socket.io rooms & events
    initSocketLoader(fastify);

    // Worker de file d'attente
    const stopWorker = startQueueWorker(fastify.io);

    // Bot Discord
    const stopDiscord = await startDiscordLoader();

    // ── Arrêt propre ───────────────────────────────────────────────────────
    fastify.addHook("onClose", async () => {
      console.log("[server] Arrêt propre en cours...");

      // 1. Arrêt du worker (plus de nouveaux dispatches)
      stopWorker();

      // 2. Déconnexion du bot Discord
      await stopDiscord();

      // 3. Fermeture des connexions Socket.io
      await new Promise<void>((resolve) => {
        fastify.io.close(() => {
          console.log("[server] Socket.io fermé.");
          resolve();
        });
      });

      // 4. Déconnexion de Prisma / PostgreSQL
      await prisma.$disconnect();
      console.log("[server] Prisma déconnecté.");
    });
  });

  // ── GracefulServer ───────────────────────────────────────────────────────
  const gracefulServer = GracefulServer(fastify.server);

  gracefulServer.on(GracefulServer.READY, () => {
    console.log("[graceful] Serveur prêt à recevoir des connexions.");
  });

  gracefulServer.on(GracefulServer.SHUTTING_DOWN, () => {
    console.log("[graceful] Signal reçu — arrêt en cours...");
  });

  gracefulServer.on(GracefulServer.SHUTDOWN, (err) => {
    if (err) {
      console.error("[graceful] Erreur lors de l'arrêt :", err);
    } else {
      console.log("[graceful] Serveur arrêté proprement.");
    }
  });

  // ── Démarrage ─────────────────────────────────────────────────────────────
  await fastify.listen({ port: env.PORT, host: env.HOST });
  gracefulServer.setReady();

  return fastify;
}