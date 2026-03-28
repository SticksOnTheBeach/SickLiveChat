// src/loaders/discordLoader.ts
// Initialise le client discord.js, déploie les Slash Commands globalement
// et écoute les interactions.

import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  ChatInputCommandInteraction,
  Interaction,
  Events,
  ActivityType,
} from "discord.js";
import { env } from "../services/env";
import {
  commandDefinitions,
  handleInteraction,
} from "../components/commands";

let discordClient: Client | null = null;

/**
 * Démarre le bot Discord :
 * 1. Déploie les Slash Commands via l'API REST Discord
 * 2. Connecte le client WebSocket Discord
 * 3. Attache le gestionnaire d'événements interactionCreate
 *
 * Retourne une fonction de nettoyage pour l'arrêt propre.
 */
export async function startDiscordLoader(): Promise<() => Promise<void>> {
  // ── Déploiement des Slash Commands ──────────────────────────────────────
  console.log("[discord] Déploiement des Slash Commands globales...");

  const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

  try {
    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
      body: commandDefinitions,
    });
    console.log(
      `[discord] ${commandDefinitions.length} commande(s) déployée(s) avec succès.`
    );
  } catch (err) {
    console.error("[discord] Échec du déploiement des commandes :", err);
    throw err;
  }

  // ── Client Discord ───────────────────────────────────────────────────────
  discordClient = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  // Événement : bot connecté et prêt
  discordClient.once(Events.ClientReady, (client) => {
    console.log(`[discord] Connecté en tant que ${client.user.tag}`);
    client.user.setActivity("les overlays 🎬", {
      type: ActivityType.Watching,
    });
  });

  // Événement : réception d'une interaction
  discordClient.on(Events.InteractionCreate, (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    void dispatchInteraction(interaction);
  });

  // Événement : erreurs non fatales du client
  discordClient.on(Events.Error, (err) => {
    console.error("[discord] Erreur client :", err);
  });

  // Connexion à la gateway Discord
  await discordClient.login(env.DISCORD_TOKEN);

  // ── Nettoyage ────────────────────────────────────────────────────────────
  return async () => {
    if (discordClient) {
      discordClient.destroy();
      console.log("[discord] Client Discord déconnecté proprement.");
    }
  };
}

/**
 * Wrappeur asynchrone avec gestion d'erreur pour chaque interaction.
 * Évite les erreurs non gérées (unhandledRejection) dans le listener.
 */
async function dispatchInteraction(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  try {
    await handleInteraction(interaction);
  } catch (err) {
    console.error(
      `[discord] Erreur lors du traitement de /${interaction.commandName} :`,
      err
    );

    const errorEmbed = {
      color: 0xe74c3c,
      title: "❌ Erreur interne",
      description:
        "Une erreur s'est produite lors du traitement de votre commande. Réessayez dans quelques instants.",
    };

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } catch {
      // Interaction expirée — rien à faire
    }
  }
}
