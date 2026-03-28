// apps/api/src/index.ts
import "dotenv/config";
import { runServer } from "./server";

async function main() {
  try {
    await runServer();
    console.log("[main] API démarrée.");
  } catch (err) {
    console.error("[main] Erreur fatale :", err);
    process.exit(1);
  }
}

void main();
