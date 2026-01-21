import { useEffect } from "react";

export function useFavicon(faviconUrl: string | null) {
  useEffect(() => {
    if (!faviconUrl) {
      // Reset to default favicon
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (link) {
        link.href = "/favicon.png";
      }
      return;
    }

    // Remove existing favicon links
    const existingLinks = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']");
    existingLinks.forEach((link) => link.remove());

    // Create new favicon link
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = faviconUrl.endsWith(".svg") ? "image/svg+xml" : "image/png";
    link.href = faviconUrl;
    document.head.appendChild(link);

    // Also update apple-touch-icon if it's the same URL
    const appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (appleTouchIcon) {
      appleTouchIcon.href = faviconUrl;
    }
  }, [faviconUrl]);
}

