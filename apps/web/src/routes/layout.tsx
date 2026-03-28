// apps/web/src/routes/layout.tsx
import { component$, Slot } from "@builder.io/qwik";
import { routeLoader$, type RequestHandler } from "@builder.io/qwik-city";
import { api } from "../lib/api";
import type { User } from "@stream-overlay/types";

export const onRequest: RequestHandler = async ({ cookie, redirect, url }) => {
  const publicPaths = ["/", "/auth/callback"];
  const isPublic = publicPaths.some((p) => url.pathname === p);
  if (isPublic) return;

  const session = cookie.get("session");
  if (!session?.value) {
    throw redirect(302, "/");
  }
};

export const useCurrentUser = routeLoader$(async ({ cookie }) => {
  const session = cookie.get("session");
  if (!session?.value) return null;
  const res = await api.auth.me();
  return res.data ?? null as User | null;
});

export default component$(() => {
  return <Slot />;
});
