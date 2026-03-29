// apps/web/src/routes/dashboard/layout.tsx
import { component$, Slot, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";

const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:3000";

interface UserInfo {
    username: string;
    avatar: string | null;
}

export default component$(() => {
    const loc = useLocation();
    const user = useSignal<UserInfo | null>(null);

    // Lit le token depuis localStorage et charge l'utilisateur côté client
    useVisibleTask$(async () => {
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: "include",
            });
            const data = await res.json();
            if (data?.data) {
                user.value = { username: data.data.username, avatar: data.data.avatar };
            }
        } catch {
            // silencieux
        }
    });

    const navItems = [
        { href: "/dashboard", label: "Mes rooms", icon: "▦" },
        { href: "/dashboard/settings", label: "Paramètres", icon: "⚙" },
    ];

    return (
        <div class="min-h-screen bg-[#0f0f13] text-white flex">
            <aside class="w-60 border-r border-white/10 flex flex-col shrink-0">
                <div class="px-5 py-5 border-b border-white/10 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">S</div>
                    <span class="font-semibold tracking-tight">StreamOverlay</span>
                </div>

                <nav class="flex-1 p-3 flex flex-col gap-1">
                    {navItems.map((item) => {
                        const active = loc.url.pathname === item.href ||
                            (item.href !== "/dashboard" && loc.url.pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                class={[
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                                    active
                                        ? "bg-indigo-600/20 text-indigo-400 font-medium"
                                        : "text-white/50 hover:text-white hover:bg-white/5",
                                ].join(" ")}
                            >
                                <span class="text-base">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User info en bas */}
                <div class="p-4 border-t border-white/10">
                    {user.value ? (
                        <div class="flex items-center gap-3">
                            {user.value.avatar ? (
                                <img
                                    src={user.value.avatar}
                                    alt=""
                                    class="w-8 h-8 rounded-full object-cover"
                                    width={32}
                                    height={32}
                                />
                            ) : (
                                <div class="w-8 h-8 rounded-full bg-indigo-600/40 flex items-center justify-center text-xs font-bold">
                                    {user.value.username[0]?.toUpperCase()}
                                </div>
                            )}
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-medium truncate">{user.value.username}</div>
                                <div class="text-white/30 text-xs">Connecté</div>
                            </div>
                            <button
                                onClick$={() => {
                                    localStorage.removeItem("auth_token");
                                    window.location.href = "/";
                                }}
                                class="text-white/30 hover:text-white/60 transition-colors text-xs"
                                title="Se déconnecter"
                            >
                                ↪
                            </button>
                        </div>
                    ) : (
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                            <div class="flex-1">
                                <div class="h-3 bg-white/10 rounded animate-pulse w-24" />
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            <main class="flex-1 overflow-auto">
                <Slot />
            </main>
        </div>
    );
});