// apps/web/src/routes/dashboard/index.tsx
import { component$, useSignal, $, type QRL } from "@builder.io/qwik";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import { api } from "../../lib/api";
import type { Room, DiscordGuild } from "@stream-overlay/types";

export const useRooms = routeLoader$(async () => {
    const res = await api.rooms.list();
    return res.data ?? [];
});

export default component$(() => {
    const rooms = useRooms();
    const showModal = useSignal(false);
    const loading = useSignal(false);
    const error = useSignal("");

    // Form state
    const roomName = useSignal("");
    const selectedGuild = useSignal<DiscordGuild | null>(null);
    const guilds = useSignal<DiscordGuild[]>([]);
    const loadingGuilds = useSignal(false);

    const loadGuilds = $(async () => {
        loadingGuilds.value = true;
        try {
            const res = await fetch("/api/discord/guilds", { credentials: "include" });
            const data = await res.json();
            guilds.value = data.data ?? [];
        } catch {
            guilds.value = [];
        } finally {
            loadingGuilds.value = false;
        }
    });

    const openModal = $(async () => {
        showModal.value = true;
        await loadGuilds();
    });

    const createRoom = $(async () => {
        if (!selectedGuild.value || !roomName.value.trim()) {
            error.value = "Sélectionnez un serveur et donnez un nom à la room.";
            return;
        }
        loading.value = true;
        error.value = "";

        const res = await api.rooms.create({
            guildId: selectedGuild.value.id,
            guildName: selectedGuild.value.name,
            name: roomName.value.trim(),
        });

        loading.value = false;

        if (res.error) {
            error.value = res.error;
            return;
        }

        showModal.value = false;
        // Reload page to show new room
        window.location.reload();
    });

    return (
        <div class="p-8">
            {/* Header */}
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h1 class="text-2xl font-bold">Mes rooms</h1>
                    <p class="text-white/40 text-sm mt-1">Gérez vos overlays par serveur Discord</p>
                </div>
                <button
                    onClick$={openModal}
                    class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                    <span class="text-lg leading-none">+</span>
                    Nouvelle room
                </button>
            </div>

            {/* Room list */}
            {rooms.value.length === 0 ? (
                <EmptyState onCreateClick$={openModal} />
            ) : (
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.value.map((room) => (
                        <RoomCard key={room.id} room={room} />
                    ))}
                </div>
            )}

            {/* Create modal */}
            {showModal.value && (
                <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div class="bg-[#1a1a24] border border-white/10 rounded-2xl w-full max-w-md p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-lg font-semibold">Créer une room</h2>
                            <button
                                onClick$={() => { showModal.value = false; error.value = ""; }}
                                class="text-white/40 hover:text-white text-xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div class="flex flex-col gap-4">
                            {/* Room name */}
                            <div>
                                <label class="text-xs text-white/50 font-medium mb-1.5 block">Nom de la room</label>
                                <input
                                    type="text"
                                    placeholder="Mon stream"
                                    value={roomName.value}
                                    onInput$={(e) => { roomName.value = (e.target as HTMLInputElement).value; }}
                                    class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            {/* Guild picker */}
                            <div>
                                <label class="text-xs text-white/50 font-medium mb-1.5 block">Serveur Discord</label>
                                {loadingGuilds.value ? (
                                    <div class="text-white/30 text-sm py-2">Chargement des serveurs...</div>
                                ) : guilds.value.length === 0 ? (
                                    <div class="text-white/30 text-sm py-2">Aucun serveur trouvé où vous êtes admin.</div>
                                ) : (
                                    <div class="flex flex-col gap-1 max-h-48 overflow-y-auto">
                                        {guilds.value.map((guild) => (
                                            <button
                                                key={guild.id}
                                                onClick$={() => { selectedGuild.value = guild; }}
                                                class={[
                                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors",
                                                    selectedGuild.value?.id === guild.id
                                                        ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300"
                                                        : "bg-white/5 border border-transparent hover:border-white/10 text-white/70",
                                                ].join(" ")}
                                            >
                                                {guild.icon ? (
                                                    <img
                                                        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=32`}
                                                        alt=""
                                                        class="w-6 h-6 rounded-full"
                                                        width={24} height={24}
                                                    />
                                                ) : (
                                                    <div class="w-6 h-6 rounded-full bg-indigo-600/40 flex items-center justify-center text-xs font-bold">
                                                        {guild.name[0]}
                                                    </div>
                                                )}
                                                <span class="truncate">{guild.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {error.value && (
                                <div class="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg px-4 py-3">
                                    {error.value}
                                </div>
                            )}

                            <button
                                onClick$={createRoom}
                                disabled={loading.value}
                                class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm mt-2"
                            >
                                {loading.value ? "Création..." : "Créer la room"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

const RoomCard = component$(({ room }: { room: Room }) => (
    <Link
        href={`/dashboard/rooms/${room.id}`}
        class="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-indigo-500/30 rounded-xl p-5 transition-all flex flex-col gap-4"
    >
        <div class="flex items-start justify-between">
            <div>
                <div class="font-semibold text-sm group-hover:text-indigo-300 transition-colors">{room.name}</div>
                <div class="text-white/40 text-xs mt-0.5">{room.guildName}</div>
            </div>
            <div class="w-2 h-2 rounded-full bg-emerald-500 mt-1" title="Actif" />
        </div>

        <div class="flex gap-3 text-xs text-white/30">
            <span>⏱ Défaut {room.defaultMediaTime}s</span>
            <span>·</span>
            <span>Max {room.maxMediaTime}s</span>
        </div>

        <div class="bg-black/30 rounded-lg px-3 py-2 text-xs text-white/30 font-mono truncate">
            {room.overlayUrl}
        </div>
    </Link>
));

const EmptyState = component$(({ onCreateClick$ }: { onCreateClick$: QRL<() => void> }) => (
    <div class="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div class="text-5xl">📡</div>
        <h2 class="text-lg font-semibold">Aucune room</h2>
        <p class="text-white/40 text-sm max-w-xs">
            Créez votre première room pour obtenir votre URL overlay et connecter votre bot Discord.
        </p>
        <button
            onClick$={onCreateClick$}
            class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors mt-2"
        >
            Créer une room
        </button>
    </div>
));