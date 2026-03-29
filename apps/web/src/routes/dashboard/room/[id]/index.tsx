// apps/web/src/routes/dashboard/rooms/[id]/index.tsx
import { component$, useSignal, $, Slot } from "@builder.io/qwik";
import { routeLoader$, useNavigate } from "@builder.io/qwik-city";
import { api } from "../../../../lib/api";
import type { QueueItem } from "../../../../lib/types";

export const useRoomData = routeLoader$(async ({ params, redirect }) => {
    const [statusRes, queueRes] = await Promise.all([
        api.rooms.status(params["id"]),
        api.rooms.queue(params["id"]),
    ]);

    if (!statusRes.data) throw redirect(302, "/dashboard");

    return {
        room: statusRes.data.room,
        busyUntil: statusRes.data.busyUntil,
        queueCount: statusRes.data.queueCount,
        overlayUrl: statusRes.data.overlayUrl,
        queue: queueRes.data ?? [],
    };
});

export default component$(() => {
    const data = useRoomData();
    const nav = useNavigate();
    const copied = useSignal(false);
    const activeTab = useSignal<"overview" | "settings">("overview");
    const saving = useSignal(false);
    const deleting = useSignal(false);

    // Settings form
    const roomName = useSignal(data.value.room.name);
    const defaultTime = useSignal(data.value.room.defaultMediaTime);
    const maxTime = useSignal(data.value.room.maxMediaTime);
    const displayFull = useSignal(data.value.room.displayMediaFull);

    const copyOverlayUrl = $(async () => {
        await navigator.clipboard.writeText(data.value.overlayUrl);
        copied.value = true;
        setTimeout(() => { copied.value = false; }, 2000);
    });

    const saveSettings = $(async () => {
        saving.value = true;
        await api.rooms.update(data.value.room.id, {
            name: roomName.value,
            defaultMediaTime: defaultTime.value,
            maxMediaTime: maxTime.value,
            displayMediaFull: displayFull.value,
        });
        saving.value = false;
    });

    const deleteRoom = $(async () => {
        if (!confirm(`Supprimer la room "${data.value.room.name}" ? Cette action est irréversible.`)) return;
        deleting.value = true;
        await api.rooms.delete(data.value.room.id);
        await nav("/dashboard");
    });

    return (
        <div class="p-8 max-w-4xl">
            {/* Header */}
            <div class="flex items-center gap-3 mb-2">
                <a href="/dashboard" class="text-white/30 hover:text-white text-sm transition-colors">← Mes rooms</a>
            </div>
            <div class="flex items-start justify-between mb-8">
                <div>
                    <h1 class="text-2xl font-bold">{data.value.room.name}</h1>
                    <p class="text-white/40 text-sm mt-1">{data.value.room.guildName}</p>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-emerald-500" />
                    <span class="text-emerald-400 text-xs font-medium">Actif</span>
                </div>
            </div>

            {/* Tabs */}
            <div class="flex gap-1 mb-6 border-b border-white/10">
                {(["overview", "settings"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick$={() => { activeTab.value = tab; }}
                        class={[
                            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                            activeTab.value === tab
                                ? "border-indigo-500 text-indigo-400"
                                : "border-transparent text-white/40 hover:text-white",
                        ].join(" ")}
                    >
                        {tab === "overview" ? "Vue d'ensemble" : "Paramètres"}
                    </button>
                ))}
            </div>

            {/* Overview tab */}
            {activeTab.value === "overview" && (
                <div class="flex flex-col gap-6">
                    {/* Overlay URL card */}
                    <div class="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div class="text-xs text-white/50 font-medium mb-3 uppercase tracking-wider">URL Overlay OBS</div>
                        <div class="flex items-center gap-3">
                            <div class="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white/60 truncate">
                                {data.value.overlayUrl}
                            </div>
                            <button
                                onClick$={copyOverlayUrl}
                                class={[
                                    "shrink-0 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    copied.value
                                        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-indigo-600 hover:bg-indigo-500 text-white",
                                ].join(" ")}
                            >
                                {copied.value ? "✓ Copié" : "Copier"}
                            </button>
                        </div>
                        <p class="text-white/30 text-xs mt-3">
                            Collez cette URL dans OBS/Streamlabs → Source Navigateur · 1920×1080 · Fond transparent
                        </p>
                    </div>

                    {/* Stats row */}
                    <div class="grid grid-cols-3 gap-4">
                        <StatCard label="File d'attente" value={String(data.value.queueCount)} unit="médias" />
                        <StatCard label="Durée par défaut" value={String(data.value.room.defaultMediaTime)} unit="secondes" />
                        <StatCard label="Durée max" value={String(data.value.room.maxMediaTime)} unit="secondes" />
                    </div>

                    {/* Queue */}
                    <div class="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div class="text-xs text-white/50 font-medium mb-4 uppercase tracking-wider">
                            File d'attente ({data.value.queue.length})
                        </div>
                        {data.value.queue.length === 0 ? (
                            <div class="text-white/25 text-sm py-4 text-center">Aucun média en attente</div>
                        ) : (
                            <div class="flex flex-col gap-2">
                                {data.value.queue.map((item: QueueItem, i: number) => (
                                    <QueueRow key={item.id} item={item} index={i} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* OBS Instructions */}
                    <div class="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-5">
                        <div class="text-indigo-400 font-medium text-sm mb-3">Instructions OBS</div>
                        <ol class="text-white/50 text-xs flex flex-col gap-1.5 list-decimal list-inside leading-relaxed">
                            <li>Ouvrez OBS Studio ou Streamlabs</li>
                            <li>Ajoutez une <strong class="text-white/70">Source Navigateur</strong></li>
                            <li>Collez l'URL overlay ci-dessus</li>
                            <li>Réglez la largeur à <strong class="text-white/70">1920</strong> et la hauteur à <strong class="text-white/70">1080</strong></li>
                            <li>Cochez <strong class="text-white/70">Fond personnalisé transparent</strong></li>
                        </ol>
                    </div>
                </div>
            )}

            {/* Settings tab */}
            {activeTab.value === "settings" && (
                <div class="flex flex-col gap-6 max-w-lg">
                    <div class="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-4">
                        <div class="text-xs text-white/50 font-medium uppercase tracking-wider">Général</div>

                        <Field label="Nom de la room">
                            <input
                                type="text"
                                value={roomName.value}
                                onInput$={(e) => { roomName.value = (e.target as HTMLInputElement).value; }}
                                class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                            />
                        </Field>

                        <Field label="Durée par défaut (secondes)">
                            <input
                                type="number"
                                min="1"
                                max="300"
                                value={defaultTime.value}
                                onInput$={(e) => { defaultTime.value = parseInt((e.target as HTMLInputElement).value) || 30; }}
                                class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                            />
                        </Field>

                        <Field label="Durée maximale (secondes)">
                            <input
                                type="number"
                                min="1"
                                max="300"
                                value={maxTime.value}
                                onInput$={(e) => { maxTime.value = parseInt((e.target as HTMLInputElement).value) || 120; }}
                                class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                            />
                        </Field>

                        <Field label="Affichage plein écran">
                            <button
                                onClick$={() => { displayFull.value = !displayFull.value; }}
                                class={[
                                    "relative w-10 h-6 rounded-full transition-colors",
                                    displayFull.value ? "bg-indigo-600" : "bg-white/20",
                                ].join(" ")}
                            >
                <span class={[
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    displayFull.value ? "translate-x-5" : "translate-x-1",
                ].join(" ")} />
                            </button>
                        </Field>

                        <button
                            onClick$={saveSettings}
                            disabled={saving.value}
                            class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors mt-2"
                        >
                            {saving.value ? "Enregistrement..." : "Enregistrer les modifications"}
                        </button>
                    </div>

                    {/* Danger zone */}
                    <div class="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                        <div class="text-xs text-red-400 font-medium uppercase tracking-wider mb-3">Zone de danger</div>
                        <p class="text-white/40 text-xs mb-4">
                            Supprimer cette room effacera toutes les données associées (file d'attente, paramètres). Cette action est irréversible.
                        </p>
                        <button
                            onClick$={deleteRoom}
                            disabled={deleting.value}
                            class="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                            {deleting.value ? "Suppression..." : "Supprimer la room"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

const StatCard = component$(({ label, value, unit }: { label: string; value: string; unit: string }) => (
    <div class="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
        <div class="text-2xl font-bold">{value}</div>
        <div class="text-white/30 text-xs mt-1">{unit}</div>
        <div class="text-white/50 text-xs mt-0.5">{label}</div>
    </div>
));

const QueueRow = component$(({ item, index }: { item: QueueItem; index: number }) => {
    const [url] = item.content.split("||");
    return (
        <div class="flex items-center gap-3 bg-black/20 rounded-lg px-4 py-3">
            <span class="text-white/20 text-xs w-4 text-center">{index + 1}</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 font-medium">
        {item.type === "video" ? "🎬" : "🖼"} {item.type}
      </span>
            {item.author && (
                <span class="text-white/40 text-xs">{item.author}</span>
            )}
            <span class="flex-1 text-white/25 text-xs font-mono truncate">{url}</span>
            <span class="text-white/30 text-xs shrink-0">{item.duration}s</span>
        </div>
    );
});

const Field = component$(({ label }: { label: string }) => (
    <div class="flex flex-col gap-1.5">
        <label class="text-xs text-white/50 font-medium">{label}</label>
        <Slot />
    </div>
));