import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:3000";

export default component$(() => {
    const loginUrl = `${API_URL}/auth/url`;

    return (
        <div class="min-h-screen bg-[#080810] text-white flex flex-col">

            {/* ── HEADER ── */}
            <header class="sticky top-0 z-50 border-b border-white/8 bg-[#080810]/80 backdrop-blur-md">
                <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/30">S</div>
                        <span class="font-bold text-lg tracking-tight">StreamOverlay</span>
                    </div>

                    <nav class="hidden md:flex items-center gap-8 text-sm text-white/50">
                        <a href="#how-it-works" class="hover:text-white transition-colors">Comment ça marche</a>
                        <a href="#features" class="hover:text-white transition-colors">Fonctionnalités</a>
                        <a href="#rules" class="hover:text-white transition-colors">Règles</a>
                    </nav>

                    <a
                        href={loginUrl}
                        class="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                        Se connecter
                    </a>
                </div>
            </header>

            {/* ── HERO ── */}
            <section class="flex-1 flex flex-col items-center justify-center text-center px-6 py-28 relative overflow-hidden">
                <div class="absolute inset-0 pointer-events-none">
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
                </div>
                <div class="relative max-w-4xl mx-auto flex flex-col items-center gap-6">
                    <div class="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold px-4 py-1.5 rounded-full">
                        <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        Alert box temps réel pour streamers
                    </div>

                    <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none">
                        Vos viewers envoient{" "}
                        <span class="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">des médias</span>
                        <br />sur votre stream
                    </h1>

                    <p class="text-white/50 text-xl max-w-2xl leading-relaxed">
                        Connectez votre bot Discord, créez votre room, et collez l'URL dans OBS.
                        Images et vidéos apparaissent en temps réel avec une file d'attente automatique.
                    </p>

                    <div class="flex flex-col sm:flex-row gap-4 mt-4">
                        <a
                            href={loginUrl}
                            class="flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold px-8 py-4 rounded-2xl transition-all text-lg shadow-2xl shadow-indigo-500/30 hover:-translate-y-1"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                            Commencer gratuitement
                        </a>
                        <a href="#how-it-works" class="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-lg hover:-translate-y-1">
                            Voir comment ça marche
                        </a>
                    </div>

                    {/* Mockup */}
                    <div class="mt-12 w-full max-w-3xl bg-white/5 border border-white/10 rounded-2xl p-1.5 shadow-2xl shadow-black/50">
                        <div class="bg-[#0f0f18] rounded-xl p-6 flex flex-col gap-3">
                            <div class="flex items-center gap-2 mb-2">
                                <div class="w-3 h-3 rounded-full bg-red-500/60" /><div class="w-3 h-3 rounded-full bg-yellow-500/60" /><div class="w-3 h-3 rounded-full bg-green-500/60" />
                                <div class="flex-1 bg-white/5 rounded-md h-5 ml-2" />
                            </div>
                            {[
                                { user: "Sticks", cmd: "/image", file: "meme.png", duration: "15s", status: "Diffusion immédiate", color: "text-emerald-400" },
                                { user: "viewer_42", cmd: "/video", file: "clip.mp4", duration: "30s", status: "#2 dans la file", color: "text-amber-400" },
                                { user: "darkSoul99", cmd: "/url", file: "https://i.imgur.com/xxx.gif", duration: "10s", status: "#3 dans la file", color: "text-amber-400" },
                            ].map((row) => (
                                <div key={row.user} class="flex items-center gap-3 bg-white/3 border border-white/5 rounded-lg px-4 py-3 text-sm">
                                    <div class="w-6 h-6 rounded-full bg-indigo-600/40 flex items-center justify-center text-xs font-bold shrink-0">{row.user[0].toUpperCase()}</div>
                                    <span class="text-indigo-400 font-mono font-semibold">{row.cmd}</span>
                                    <span class="text-white/60 truncate flex-1">{row.file}</span>
                                    <span class="text-white/30 text-xs">{row.duration}</span>
                                    <span class={`text-xs font-medium ${row.color}`}>{row.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── COMMENT ÇA MARCHE ── */}
            <section id="how-it-works" class="py-24 px-6 border-t border-white/5">
                <div class="max-w-5xl mx-auto">
                    <div class="text-center mb-16">
                        <div class="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">Comment ça marche</div>
                        <h2 class="text-4xl font-black">Configuré en 3 étapes</h2>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { step: "01", title: "Créez votre room", desc: "Connectez-vous avec Discord, créez une room liée à votre serveur. Vous obtenez une URL unique pour votre overlay.", icon: "🏠", color: "from-indigo-500/20 to-indigo-500/5", border: "border-indigo-500/20" },
                            { step: "02", title: "Ajoutez dans OBS", desc: "Copiez l'URL overlay depuis votre dashboard et ajoutez-la comme Source Navigateur dans OBS ou Streamlabs. Fond transparent inclus.", icon: "🎬", color: "from-purple-500/20 to-purple-500/5", border: "border-purple-500/20" },
                            { step: "03", title: "Vos viewers envoient", desc: "Les membres de votre serveur Discord utilisent /image, /video ou /url. Les médias s'affichent en temps réel sur votre stream !", icon: "⚡", color: "from-pink-500/20 to-pink-500/5", border: "border-pink-500/20" },
                        ].map((s) => (
                            <div key={s.step} class={`relative bg-gradient-to-b ${s.color} border ${s.border} rounded-2xl p-7 flex flex-col gap-4`}>
                                <div class="text-5xl">{s.icon}</div>
                                <div class="text-white/20 text-7xl font-black absolute top-4 right-6 leading-none">{s.step}</div>
                                <h3 class="text-xl font-bold mt-2">{s.title}</h3>
                                <p class="text-white/50 leading-relaxed text-sm">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" class="py-24 px-6 border-t border-white/5 bg-white/2">
                <div class="max-w-5xl mx-auto">
                    <div class="text-center mb-16">
                        <div class="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">Fonctionnalités</div>
                        <h2 class="text-4xl font-black">Tout ce dont vous avez besoin</h2>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { icon: "🖼️", title: "Images & vidéos", desc: "Pièces jointes Discord (jpg, png, gif, mp4, webm) ou URLs directes." },
                            { icon: "⚡", title: "Temps réel", desc: "WebSocket — zéro délai entre la commande Discord et l'affichage sur stream." },
                            { icon: "📋", title: "File d'attente", desc: "Plusieurs médias envoyés simultanément ? Ils s'affichent les uns après les autres." },
                            { icon: "⏱️", title: "Durée personnalisable", desc: "Chaque streamer définit la durée par défaut et la durée maximale autorisée." },
                            { icon: "🏠", title: "Multi-rooms", desc: "Gérez plusieurs rooms pour plusieurs serveurs Discord depuis un seul dashboard." },
                            { icon: "🔒", title: "Sécurisé", desc: "Login via Discord OAuth2. Chaque room est isolée, votre overlay URL est unique." },
                        ].map((f) => (
                            <div key={f.title} class="bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-2xl p-6 transition-all group">
                                <div class="text-3xl mb-4">{f.icon}</div>
                                <div class="font-bold mb-2 group-hover:text-indigo-300 transition-colors">{f.title}</div>
                                <div class="text-white/40 text-sm leading-relaxed">{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── RÈGLES ── */}
            <section id="rules" class="py-24 px-6 border-t border-white/5">
                <div class="max-w-3xl mx-auto">
                    <div class="text-center mb-12">
                        <div class="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-3">Règles d'utilisation</div>
                        <h2 class="text-4xl font-black">À respecter absolument</h2>
                        <p class="text-white/40 mt-4">Le streamer est responsable de ce qui s'affiche sur son stream.</p>
                    </div>
                    <div class="flex flex-col gap-3">
                        {[
                            { icon: "🚫", rule: "Aucun contenu NSFW, choquant ou illégal", desc: "Images, vidéos ou GIFs à caractère sexuel, violent ou haineux sont strictement interdits." },
                            { icon: "🚫", rule: "Pas de spam", desc: "Envoyer des médias en masse pour saturer la file d'attente est interdit." },
                            { icon: "🚫", rule: "Pas de publicité non sollicitée", desc: "Utiliser l'overlay pour promouvoir des services sans accord du streamer est interdit." },
                            { icon: "✅", rule: "Respectez le streamer", desc: "Le streamer peut supprimer votre accès à tout moment. Ses décisions sont définitives." },
                            { icon: "✅", rule: "Contenus adaptés au stream", desc: "Envoyez des médias en rapport avec le contexte du stream en cours." },
                        ].map((r) => (
                            <div key={r.rule} class={`flex gap-4 p-5 rounded-xl border ${r.icon === "🚫" ? "bg-red-500/5 border-red-500/15" : "bg-emerald-500/5 border-emerald-500/15"}`}>
                                <span class="text-2xl shrink-0 mt-0.5">{r.icon}</span>
                                <div>
                                    <div class={`font-semibold mb-1 ${r.icon === "🚫" ? "text-red-300" : "text-emerald-300"}`}>{r.rule}</div>
                                    <div class="text-white/40 text-sm leading-relaxed">{r.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA FINAL ── */}
            <section class="py-24 px-6 border-t border-white/5 text-center">
                <div class="max-w-2xl mx-auto flex flex-col items-center gap-6">
                    <h2 class="text-4xl font-black">Prêt à enrichir votre stream ?</h2>
                    <p class="text-white/40 text-lg">Gratuit, open source, et configuré en moins de 5 minutes.</p>
                    <a href={loginUrl} class="flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold px-10 py-5 rounded-2xl transition-all text-xl shadow-2xl shadow-indigo-500/30 hover:-translate-y-1">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                        Se connecter avec Discord
                    </a>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer class="border-t border-white/8 px-6 py-10">
                <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs">S</div>
                        <span class="font-semibold">StreamOverlay</span>
                        <span class="text-white/20 text-sm">— Open source · MIT</span>
                    </div>
                    <div class="flex items-center gap-6 text-sm text-white/30">
                        <a href="#how-it-works" class="hover:text-white transition-colors">Comment ça marche</a>
                        <a href="#features" class="hover:text-white transition-colors">Fonctionnalités</a>
                        <a href="#rules" class="hover:text-white transition-colors">Règles</a>
                        <a href="https://github.com/SticksOnTheBeach/SickLiveChat" target="_blank" class="hover:text-white transition-colors flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                            GitHub
                        </a>
                    </div>
                    <div class="text-white/20 text-xs">© 2026 StreamOverlay — Fait avec ❤️ pour les streamers</div>
                </div>
            </footer>
        </div>
    );
});