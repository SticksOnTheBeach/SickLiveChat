// apps/api/src/loaders/discordLoader.ts
import { Client, GatewayIntentBits, REST, Routes, Events, ActivityType, type Interaction } from "discord.js";
import { env } from "../services/env";
import { commandDefinitions, handleInteraction } from "../components/discord/commands";

export async function startDiscordLoader(): Promise<() => Promise<void>> {
  console.log("[discord] Déploiement des Slash Commands...");

  const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: commandDefinitions });
  console.log(`[discord] ${commandDefinitions.length} commande(s) déployée(s).`);

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, (c) => {
    console.log(`[discord] Connecté : ${c.user.tag}`);
    c.user.setActivity("les overlays 🎬", { type: ActivityType.Watching });
  });

  client.on(Events.InteractionCreate, (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    void (async () => {
      try {
        await handleInteraction(interaction);
      } catch (err) {
        console.error(`[discord] Erreur /${interaction.commandName} :`, err);
        try {
          const msg = { embeds: [{ color: 0xe74c3c, title: "❌ Erreur interne" }] };
          if (interaction.deferred || interaction.replied) await interaction.editReply(msg);
          else await interaction.reply({ ...msg, ephemeral: true });
        } catch { /* interaction expirée */ }
      }
    })();
  });

  client.on(Events.Error, (err) => console.error("[discord] Erreur client :", err));
  await client.login(env.DISCORD_TOKEN);

  return async () => { client.destroy(); console.log("[discord] Client déconnecté."); };
}
