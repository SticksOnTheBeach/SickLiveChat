// src/index.ts
// Point d'entrée principal.
// Charge les variables d'environnement (dotenv) et lance le serveur.

import "dotenv/config"; // Charge .env avant tout autre import
import { runServer } from "./server";

async function main(): Promise<void> {
  try {
    await runServer();
    console.log(`[main] Application démarrée avec succès.`);
  } catch (err) {
    console.error("[main] Erreur fatale au démarrage :", err);
    process.exit(1);
  }
}

void main();
