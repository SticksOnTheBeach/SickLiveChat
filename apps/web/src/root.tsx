// apps/web/src/root.tsx
import { component$ } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister } from "@builder.io/qwik-city";
import { RouterHead } from "./components/RouterHead";
import "./global.css";

export default component$(() => (
  <QwikCityProvider>
    <head>
      <meta charset="utf-8" />
      <link rel="manifest" href="/manifest.json" />
      <RouterHead />
    </head>
    <body lang="fr">
      <RouterOutlet />
      <ServiceWorkerRegister />
    </body>
  </QwikCityProvider>
));
