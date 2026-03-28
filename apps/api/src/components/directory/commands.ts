// apps/api/src/components/discord/commands.ts

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import { prisma } from "../../services/prisma";
import { env } from "../../services/env";

const DEFAULT_DURATION = 30;
const MAX_DURATION = 300;
const VIDEO_EXT = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i;

const imageCmd = new SlashCommandBuilder()
  .setName("image")
  .setDescription("Affiche une image en pièce jointe sur l'overlay.")
  .addAttachmentOption((o) => o.setName("fichier").setDescription("Image à afficher").setRequired(true))
  .addIntegerOption((o) => o.setName("duree").setDescription("Durée en secondes").setMinValue(1).setMaxValue(MAX_DURATION).setRequired(false))
  .addStringOption((o) => o.setName("texte").setDescription("Texte sous l'image").setRequired(false));

const videoCmd = new SlashCommandBuilder()
  .setName("video")
  .setDescription("Affiche une vidéo en pièce jointe sur l'overlay.")
  .addAttachmentOption((o) => o.setName("fichier").setDescription("Vidéo à afficher").setRequired(true))
  .addIntegerOption((o) => o.setName("duree").setDescription("Durée en secondes").setMinValue(1).setMaxValue(MAX_DURATION).setRequired(false))
  .addStringOption((o) => o.setName("texte").setDescription("Texte sous la vidéo").setRequired(false));

const urlCmd = new SlashCommandBuilder()
  .setName("url")
  .setDescription("Affiche un média depuis une URL directe.")
  .addStringOption((o) => o.setName("lien").setDescription("URL du média").setRequired(true))
  .addIntegerOption((o) => o.setName("duree").setDescription("Durée en secondes").setMinValue(1).setMaxValue(MAX_DURATION).setRequired(false))
  .addStringOption((o) => o.setName("texte").setDescription("Texte sous le média").setRequired(false));

const clientCmd = new SlashCommandBuilder()
  .setName("client")
  .setDescription("Affiche l'URL overlay à coller dans OBS/Streamlabs.");

export const commandDefinitions: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
  imageCmd.toJSON(), videoCmd.toJSON(), urlCmd.toJSON(), clientCmd.toJSON(),
];

export async function handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: "Utilisez cette commande dans un serveur Discord.", ephemeral: true });
    return;
  }

  switch (interaction.commandName) {
    case "image": await handleAttachment(interaction, "image"); break;
    case "video": await handleAttachment(interaction, "video"); break;
    case "url":   await handleUrl(interaction); break;
    case "client": await handleClient(interaction); break;
    default: await interaction.reply({ content: "Commande inconnue.", ephemeral: true });
  }
}

async function enqueueMedia(
  interaction: ChatInputCommandInteraction,
  mediaUrl: string,
  mediaType: "image" | "video",
  duration: number,
  texte: string | null
): Promise<void> {
  const guildId = interaction.guildId!;

  // Récupère la room associée à ce serveur Discord
  const room = await prisma.room.findUnique({
    where: { guildId },
    include: { guild: true },
  });

  if (!room) {
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(Colors.Red).setTitle("❌ Room introuvable")
        .setDescription(`Aucune room n'est configurée pour ce serveur.\nConnectez-vous sur **${env.PUBLIC_URL}** pour en créer une.`)],
    });
    return;
  }

  const finalDuration = Math.min(duration, room.maxMediaTime);
  const now = new Date();

  const lastPending = await prisma.queue.findFirst({
    where: { discordGuildId: guildId },
    orderBy: { executionDate: "desc" },
    select: { executionDate: true, duration: true },
  });

  let executionDate: Date;
  if (lastPending) {
    executionDate = new Date(lastPending.executionDate.getTime() + lastPending.duration * 1_000);
  } else if (room.guild?.busyUntil && room.guild.busyUntil > now) {
    executionDate = room.guild.busyUntil;
  } else {
    executionDate = now;
  }

  const content = texte ? `${mediaUrl}||${texte}` : mediaUrl;

  await prisma.queue.create({
    data: {
      type: mediaType,
      content,
      author: interaction.user.username,
      authorImage: interaction.user.displayAvatarURL({ size: 64, extension: "png" }),
      duration: finalDuration,
      executionDate,
      discordGuildId: guildId,
      roomId: room.id,
    },
  });

  const isQueued = executionDate > now;
  const position = await prisma.queue.count({ where: { discordGuildId: guildId } });

  const embed = new EmbedBuilder()
    .setColor(isQueued ? Colors.Orange : Colors.Green)
    .setTitle(isQueued ? "📬 Mis en file d'attente" : `✅ ${mediaType === "video" ? "Vidéo" : "Image"} envoyée`)
    .addFields(
      { name: "Type", value: mediaType === "video" ? "🎬 Vidéo" : "🖼️ Image", inline: true },
      { name: "Durée", value: `${finalDuration}s`, inline: true },
      { name: isQueued ? "Position" : "Diffusion", value: isQueued ? `#${position} dans la file` : "Immédiate", inline: true }
    )
    .setTimestamp();

  if (texte) embed.addFields({ name: "Texte", value: texte });
  await interaction.editReply({ embeds: [embed] });
}

async function handleAttachment(interaction: ChatInputCommandInteraction, expectedType: "image" | "video"): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  const attachment = interaction.options.getAttachment("fichier", true);
  const texte = interaction.options.getString("texte") ?? null;
  const duree = interaction.options.getInteger("duree") ?? DEFAULT_DURATION;
  const ct = attachment.contentType ?? "";

  if (expectedType === "image" && !ct.startsWith("image/")) {
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setTitle("❌ Fichier invalide").setDescription("La pièce jointe doit être une image.")] });
    return;
  }
  if (expectedType === "video" && !ct.startsWith("video/")) {
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setTitle("❌ Fichier invalide").setDescription("La pièce jointe doit être une vidéo.")] });
    return;
  }

  await enqueueMedia(interaction, attachment.proxyURL, expectedType, duree, texte);
}

async function handleUrl(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  const rawUrl = interaction.options.getString("lien", true).trim();
  const texte = interaction.options.getString("texte") ?? null;
  const duree = interaction.options.getInteger("duree") ?? DEFAULT_DURATION;

  const mediaType = VIDEO_EXT.test(rawUrl) ? "video" : IMAGE_EXT.test(rawUrl) ? "image" : null;
  if (!mediaType) {
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setTitle("❌ Format non reconnu").setDescription("L'URL doit se terminer par jpg, png, gif, webp, mp4 ou webm.")] });
    return;
  }
  await enqueueMedia(interaction, rawUrl, mediaType, duree, texte);
}

async function handleClient(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId!;
  const room = await prisma.room.findUnique({ where: { guildId } });

  if (!room) {
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(Colors.Orange).setTitle("⚠️ Aucune room configurée")
        .setDescription(`Connectez-vous sur **${env.PUBLIC_URL}** pour créer votre room et obtenir votre URL overlay.`)],
      ephemeral: true,
    });
    return;
  }

  const overlayUrl = `${env.PUBLIC_URL}/overlay.html?guildId=${guildId}`;
  const embed = new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle("🖥️ URL de votre Overlay")
    .setDescription(`Ajoutez cette URL comme **Source Navigateur** dans OBS/Streamlabs :\n\`\`\`${overlayUrl}\`\`\``)
    .addFields(
      { name: "Room", value: room.name, inline: true },
      { name: "Largeur", value: "1920px", inline: true },
      { name: "Hauteur", value: "1080px", inline: true }
    )
    .setFooter({ text: "Gardez cette URL secrète." })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
