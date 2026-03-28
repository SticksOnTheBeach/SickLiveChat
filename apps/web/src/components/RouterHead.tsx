// apps/web/src/components/RouterHead.tsx
import { component$ } from "@builder.io/qwik";
import { useDocumentHead, useLocation } from "@builder.io/qwik-city";

export const RouterHead = component$(() => {
  const head = useDocumentHead();
  const loc = useLocation();

  return (
    <>
      <title>{head.title || "StreamOverlay — Alert box temps réel"}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <meta name="description" content="Affiche des images et vidéos depuis Discord directement sur votre stream OBS en temps réel." />
      <link rel="canonical" href={loc.url.href} />
      {head.meta.map((m) => <meta key={m.key} {...m} />)}
      {head.links.map((l) => <link key={l.key} {...l} />)}
      {head.styles.map((s) => <style key={s.key} {...s.props} dangerouslySetInnerHTML={s.style} />)}
    </>
  );
});
