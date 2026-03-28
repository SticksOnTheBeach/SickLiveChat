// packages/types/src/index.ts
// Types partagés entre le backend et le frontend Qwik.

export interface User {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  guildId: string;
  guildName: string;
  overlayUrl: string;
  defaultMediaTime: number;
  maxMediaTime: number;
  displayMediaFull: boolean;
  ownerId: string;
  createdAt: string;
}

export interface QueueItem {
  id: string;
  type: "image" | "video";
  content: string;
  author: string | null;
  authorImage: string | null;
  submissionDate: string;
  executionDate: string;
  duration: number;
  discordGuildId: string;
}

export interface MediaPayload {
  id: string;
  type: "image" | "video";
  content: string;
  author: string | null;
  authorImage: string | null;
  duration: number;
  discordGuildId: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}
