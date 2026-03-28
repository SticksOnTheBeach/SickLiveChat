// src/components/discord/commands.ts
// Slash Commands :
//   /image  [duree] [texte]  — pièce jointe image obligatoire
//   /video  [duree] [texte]  — pièce jointe vidéo obligatoire
//   /url    <url> [duree] [texte] — URL directe (image ou vidéo)
//   /client                  — affiche l'URL de l'overlay

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import { prisma } from "../services/prisma";
import { env } from "../services/env";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const DEFAULT_DURATION_SECONDS = 30;
const MAX_DURATION_SECONDS = 300;

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i;

// ---------------------------------------------------------------------------
// Définitions des commandes
// ---------------------------------------------------------------------------

const imageCommand = new SlashCommandBuilder()
  .setName("image")
  .setDescription("Affiche une image en pièce jointe sur l'overlay.")
  .addAttachmentOption((opt) =>
    opt
      .setName("fichier")
      .setDescription("L'image à afficher (jpg, png, gif, webp…)")
      .setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt
      .setName("duree")
      .setDescription("Durée en secondes (défaut : 30, max : 300)")
      .setMinValue(1)
      .setMaxValue(MAX_DURATION_SECONDS)
      .setRequired(false)
  )
  .addStringOption((opt) =>
    opt
      .setName("texte")
      .setDescription("Texte affiché sous l'image")
      .setRequired(false)
  );

const videoCommand = new SlashCommandBuilder()
  .setName("video")
  .setDescription("Affiche une vidéo en pièce jointe sur l'overlay.")
  .addAttachmentOption((opt) =>
    opt
      .setName("fichier")
      .setDescription("La vidéo à afficher (mp4, webm…)")
      .setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt
      .setName("duree")
      .setDescription("Durée en secondes (défaut : 30, max : 300)")
      .setMinValue(1)
      .setMaxValue(MAX_DURATION_SECONDS)
      .setRequired(false)
  )
  .addStringOption((opt) =>
    opt
      .setName("texte")
      .setDescription("Texte affiché sous la vidéo")
      .setRequired(false)
  );

const urlCommand = new SlashCommandBuilder()
  .setName("url")
  .setDescription("Affiche un média depuis une URL directe sur l'overlay.")
  .addStringOption((opt) =>
    opt
      .setName("lien")
      .setDescription("URL directe de l'image ou de la vidéo")
      .setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt
      .setName("duree")
      .setDescription("Durée en secondes (défaut : 30, max : 300)")
      .setMinValue(1)
      .setMaxValue(MAX_DURATION_SECONDS)
      .setRequired(false)
  )
  .addStringOption((opt) =>
    opt
      .setName("texte")
      .setDescription("Texte affiché sous le média")
      .setRequired(false)
  );

const clientCommand = new SlashCommandBuilder()
  .setName("client")
  .setDescription("Affiche l'URL unique de votre overlay à ajouter dans OBS/Streamlabs.");

export const commandDefinitions: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
  imageCommand.toJSON(),
  videoCommand.toJSON(),
  urlCommand.toJSON(),
  clientCommand.toJSON(),
];

// ---------------------------------------------------------------------------
// Gestionnaire principal
// ---------------------------------------------------------------------------

export async function handleInteraction(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "Cette commande doit être utilisée dans un serveur Discord.",
      ephemeral: true,
    });
    return;
  }

  switch (interaction.commandName) {
    case "image":
      await handleAttachment(interaction, "image");
      break;
    case "video":
      await handleAttachment(interaction, "video");
      break;
    case "url":
      await handleUrl(interaction);
      break;
    case "client":
      await handleClient(interaction);
      break;
    default:
      await interaction.reply({ content: "Commande inconnue.", ephemeral: true });
  }
}

// ---------------------------------------------------------------------------
// Utilitaire commun : calcule la file et enregistre en DB
// ---------------------------------------------------------------------------

async function enqueueMedia(
  interaction: ChatInputCommandInteraction,
  mediaUrl: string,
  mediaType: "image" | "video",
  duration: number,
  texte: string | null
): Promise<void> {
  const guildId = interaction.guildId!;

  const guild = await prisma.guild.upsert({
    where: { id: guildId },
    update: {},
    create: { id: guildId },
  });

  const maxTime = guild.maxMediaTime ?? MAX_DURATION_SECONDS;
  const defaultTime = guild.defaultMediaTime ?? DEFAULT_DURATION_SECONDS;
  const finalDuration = Math.min(duration ?? defaultTime, maxTime);

  const now = new Date();

  // Calcule executionDate : se place après le dernier item en attente
  const lastPending = await prisma.queue.findFirst({
    where: { discordGuildId: guildId },
    orderBy: { executionDate: "desc" },
    select: { executionDate: true, duration: true },
  });

  let executionDate: Date;
  if (lastPending) {
    executionDate = new Date(lastPending.executionDate.getTime() + lastPending.duration * 1_000);
  } else if (guild.busyUntil && guild.busyUntil > now) {
    executionDate = guild.busyUntil;
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
      {
        name: isQueued ? "Position" : "Diffusion",
        value: isQueued ? `#${position} dans la file` : "Immédiate",
        inline: true,
      }
    )
    .setTimestamp();

  if (texte) embed.addFields({ name: "Texte", value: texte });

  await interaction.editReply({ embeds: [embed] });
}

// ---------------------------------------------------------------------------
// /image et /video — pièce jointe Discord
// ---------------------------------------------------------------------------

async function handleAttachment(
  interaction: ChatInputCommandInteraction,
  expectedType: "image" | "video"
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const attachment = interaction.options.getAttachment("fichier", true);
  const texte = interaction.options.getString("texte") ?? null;
  const duree = interaction.options.getInteger("duree") ?? DEFAULT_DURATION_SECONDS;

  const contentType = attachment.contentType ?? "";
  const isImage = contentType.startsWith("image/");
  const isVideo = contentType.startsWith("video/");

  if (expectedType === "image" && !isImage) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("❌ Fichier invalide")
          .setDescription("La pièce jointe doit être une image (jpg, png, gif, webp…)."),
      ],
    });
    return;
  }

  if (expectedType === "video" && !isVideo) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("❌ Fichier invalide")
          .setDescription("La pièce jointe doit être une vidéo (mp4, webm…)."),
      ],
    });
    return;
  }

  // On utilise l'URL CDN Discord (proxyURL = URL stable même après suppression du message)
  const mediaUrl = attachment.proxyURL;

  await enqueueMedia(interaction, mediaUrl, expectedType, duree, texte);
}

// ---------------------------------------------------------------------------
// /url — URL directe
// ---------------------------------------------------------------------------

async function handleUrl(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const rawUrl = interaction.options.getString("lien", true).trim();
  const texte = interaction.options.getString("texte") ?? null;
  const duree = interaction.options.getInteger("duree") ?? DEFAULT_DURATION_SECONDS;

  const mediaType = VIDEO_EXTENSIONS.test(rawUrl)
    ? "video"
    : IMAGE_EXTENSIONS.test(rawUrl)
    ? "image"
    : null;

  if (!mediaType) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("❌ Format non reconnu")
          .setDescription(
            "L'URL doit se terminer par une extension reconnue.\n" +
            "**Images :** jpg, png, gif, webp, avif, svg\n" +
            "**Vidéos :** mp4, webm, ogg, mov"
          ),
      ],
    });
    return;
  }

  await enqueueMedia(interaction, rawUrl, mediaType, duree, texte);
}

// ---------------------------------------------------------------------------
// /client
// ---------------------------------------------------------------------------

async function handleClient(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guildId = interaction.guildId!;
  const overlayUrl = `${env.PUBLIC_URL}/overlay.html?guildId=${guildId}`;

  const embed = new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle("🖥️ URL de votre Overlay")
    .setDescription(
      "Copiez cette URL et ajoutez-la comme **Source Navigateur** dans OBS ou Streamlabs.\n\n" +
        `\`\`\`${overlayUrl}\`\`\``
    )
    .addFields(
      { name: "Largeur recommandée", value: "1920px", inline: true },
      { name: "Hauteur recommandée", value: "1080px", inline: true },
      { name: "Fond transparent", value: "✅ Oui", inline: true }
    )
    .setFooter({ text: "Gardez cette URL secrète — elle est unique à votre serveur." })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}