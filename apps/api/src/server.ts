// apps/api/src/server.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import staticPlugin from "@fastify/static";
import socketioPlugin from "fastify-socket.io";
import GracefulServer from "@gquittet/graceful-server";
import path from "path";
import { prisma } from "./services/prisma";
import { env } from "./services/env";
import { initSocketLoader } from "./loaders/socketLoader";
import { startQueueWorker } from "./services/queueWorker";
import { startDiscordLoader } from "./loaders/discordLoader";
import { authRoutes } from "./routes/auth";
import { roomRoutes } from "./routes/rooms";
import { guildRoutes } from "./routes/guilds";

export async function runServer() {
    const fastify = Fastify({ logger: { level: "info" } });

    await fastify.register(cors, {
        origin: [env.FRONTEND_URL, "https://sick-live-chat.vercel.app"],
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        exposedHeaders: ["set-cookie"],
        allowedHeaders: ["Content-Type", "Authorization"],
    });

    await fastify.register(cookie, { secret: env.SESSION_SECRET });

    await fastify.register(staticPlugin, {
        root: path.join(process.cwd(), "public"),
        prefix: "/",
    });

    await fastify.register(socketioPlugin, {
        cors: { origin: "*", methods: ["GET", "POST"] },
        transports: ["websocket", "polling"],
    });

    // Routes
    await fastify.register(authRoutes);
    await fastify.register(roomRoutes, { prefix: "/api" });
    await fastify.register(guildRoutes, { prefix: "/api" });

    fastify.get("/health", async () => ({
        status: "ok",
        mode: env.MODE,
        timestamp: new Date().toISOString(),
    }));

    fastify.addHook("onReady", async () => {
        initSocketLoader(fastify);
        const stopWorker = startQueueWorker(fastify.io);
        const stopDiscord = await startDiscordLoader();

        fastify.addHook("onClose", async () => {
            stopWorker();
            await stopDiscord();
            await new Promise<void>((resolve) => fastify.io.close(() => resolve()));
            await prisma.$disconnect();
            console.log("[server] Arrêt propre terminé.");
        });
    });

    const graceful = GracefulServer(fastify.server);
    graceful.on(GracefulServer.READY, () => console.log("[graceful] Prêt."));
    graceful.on(GracefulServer.SHUTTING_DOWN, () => console.log("[graceful] Arrêt en cours..."));

    await fastify.listen({ port: env.PORT, host: env.HOST });
    graceful.setReady();

    return fastify;
}