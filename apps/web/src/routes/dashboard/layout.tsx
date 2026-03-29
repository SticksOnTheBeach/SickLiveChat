// apps/web/src/routes/dashboard/layout.tsx
import { component$, Slot } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { useCurrentUser } from "../layout";

export default component$(() => {
    const user = useCurrentUser();
    const loc = useLocation();

    const navItems = [
        { href: "/dashboard", label: "Mes rooms", icon: "▦" },
        { href: "/dashboard/settings", label: "Paramètres", icon: "⚙" },
    ];

    return (
        <div class="min-h-screen bg-[#0f0f13] text-white flex">

            {/* ── Sidebar ── */}
            <aside class="w-60 border-r border-white/10 flex flex-col shrink-0">
                {/* Logo */}
                <div class="px-5 py-5 border-b border-white/10 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">S</div>
                    <span class="font-semibold tracking-tight">StreamOverlay</span>
                </div>

                {/* Nav */}
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

                {/* User */}
                {user.value && (
                    <div class="p-4 border-t border-white/10">
                        <div class="flex items-center gap-3">
                            {user.value.avatar ? (
                                <img src={user.value.avatar} alt="" class="w-8 h-8 rounded-full" width={32} height={32} />
                            ) : (
                                <div class="w-8 h-8 rounded-full bg-indigo-600/40 flex items-center justify-center text-xs font-bold">
                                    {user.value.username[0]?.toUpperCase()}
                                </div>
                            )}
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-medium truncate">{user.value.username}</div>
                            </div>
                            <Link href="/auth/logout" class="text-white/30 hover:text-white/60 transition-colors text-xs">
                                ↪
                            </Link>
                        </div>
                    </div>
                )}
            </aside>

            {/* ── Main content ── */}
            <main class="flex-1 overflow-auto">
                <Slot />
            </main>
        </div>
    );
});