// apps/web/src/lib/api.ts
// Client HTTP vers le backend Fastify.

import type { Room, User, ApiResponse, QueueItem } from "./types";

    // const API_URL = import.meta.env.PUBLIC_API_URL ?? "http://localhost:3000";
const API_URL = import.meta.env.PUBLIC_API_URL || 'https://fin-december-kit-concept.trycloudflare.com';
async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    try {
        const res = await fetch(`${API_URL}${path}`, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token ? `Bearer ${token}` : "",
                ...options.headers
            },
        });
        return res.json() as Promise<ApiResponse<T>>;
    } catch {
        return { error: "Erreur réseau" };
    }
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
    auth: {
        me: () => request<User>("/auth/me"),
        url: () => request<{ url: string; state: string }>("/auth/url"),
        logout: () => request("/auth/logout", { method: "POST" }),
    },

    rooms: {
        list: () => request<Room[]>("/api/rooms"),
        get: (id: string) => request<Room>(`/api/rooms/${id}`),
        create: (body: { guildId: string; guildName: string; name: string }) =>
            request<Room>("/api/rooms", { method: "POST", body: JSON.stringify(body) }),
        update: (id: string, body: Partial<Room>) =>
            request<Room>(`/api/rooms/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
        delete: (id: string) =>
            request(`/api/rooms/${id}`, { method: "DELETE" }),
        status: (id: string) =>
            request<{ room: Room; busyUntil: string | null; queueCount: number; overlayUrl: string }>(
                `/api/rooms/${id}/status`
            ),
        queue: (id: string) => request<QueueItem[]>(`/api/rooms/${id}/queue`),
    },
};