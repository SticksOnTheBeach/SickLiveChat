// apps/web/src/routes/auth/callback/index.tsx
// Cette page gère le retour OAuth Discord.
// Le backend redirige ici après avoir créé la session.
// On redirige simplement vers le dashboard.

import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";

export const useRedirect = routeLoader$(async ({ url, redirect }) => {
  const error = url.searchParams.get("error");
  if (error) throw redirect(302, `/?error=${error}`);
  throw redirect(302, "/dashboard");
});

export default component$(() => {
  return (
    <div class="min-h-screen bg-[#0f0f13] flex items-center justify-center text-white">
      <div class="text-white/40 text-sm">Connexion en cours...</div>
    </div>
  );
});
