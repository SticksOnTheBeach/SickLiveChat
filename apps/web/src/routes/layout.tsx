import { component$, Slot } from "@builder.io/qwik";
import { routeLoader$, type RequestHandler } from "@builder.io/qwik-city";
import { api } from "../lib/api";
import type { User } from "../lib/types";

export const onRequest: RequestHandler = async ({ cookie, redirect, url }) => {
    const publicPaths = ["/", "/auth/callback"];
    const isPublic = publicPaths.some((p) => url.pathname === p || url.pathname.startsWith(p));
    if (isPublic) return;

    // En self-hosted : on laisse passer sans vérifier la session
    const mode = import.meta.env.PUBLIC_MODE ?? "self-hosted";
    if (mode === "self-hosted") return;

    const session = cookie.get("session");
    if (!session?.value) {
        throw redirect(302, "/");
    }
};

export const useCurrentUser = routeLoader$(async ({ cookie }) => {
    const mode = import.meta.env.PUBLIC_MODE ?? "self-hosted";

    // Self-hosted : utilisateur fictif local
    if (mode === "self-hosted") {
        return {
            id: "local",
            discordId: "local",
            username: "Admin",
            avatar: null,
            createdAt: new Date().toISOString(),
        } as User;
    }

    const session = cookie.get("session");
    if (!session?.value) return null;
    const res = await api.auth.me();
    return res.data ?? null as User | null;
});

export default component$(() => {
    return <Slot />;
});