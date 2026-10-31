import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Safari affiche « Importing a module script failed » quand une page mise à jour
// cherche un ancien morceau de code. Le garde-fou principal est le script en ligne
// de __root.tsx (window.__chunkRecover), actif même si ce module ne se charge pas ;
// ici on ne fait que relayer les erreurs de préchargement Vite vers lui.
if (typeof window !== "undefined" && !(window as { __chunkGuard?: boolean }).__chunkGuard) {
  (window as { __chunkGuard?: boolean }).__chunkGuard = true;
  const recover = (msg: string) => {
    (window as { __chunkRecover?: (m: string) => boolean }).__chunkRecover?.(msg);
  };
  window.addEventListener("vite:preloadError", (e) => { e.preventDefault(); recover("Failed to fetch dynamically imported module"); });
  window.addEventListener("error", (e) => recover(String(e.message)));
  window.addEventListener("unhandledrejection", (e) => recover(String((e.reason as Error)?.message ?? e.reason)));
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
