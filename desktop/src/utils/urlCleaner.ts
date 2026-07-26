// --- ZENO URL PRIVACY & CLEANING UTILITY ---

export const KNOWN_TRACKING_PARAMS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id",
  "fbclid", "gclid", "msclkid", "ttclid", "si", "igsh", "ref", "_hsenc", "mc_eid",
  "twclid", "yclid"
];

export function cleanUrl(rawUrl: string): { cleanedUrl: string; strippedParams: string[] } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { cleanedUrl: "", strippedParams: [] };
  }
  try {
    const validUrl = rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(validUrl);
    const strippedParams: string[] = [];

    const searchParams = new URLSearchParams(parsed.search);
    const keysToDelete: string[] = [];

    searchParams.forEach((_, key) => {
      const lowerKey = key.toLowerCase();
      if (KNOWN_TRACKING_PARAMS.includes(lowerKey) || lowerKey.startsWith("utm_")) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      strippedParams.push(key);
      searchParams.delete(key);
    });

    parsed.search = searchParams.toString();
    return {
      cleanedUrl: parsed.toString(),
      strippedParams
    };
  } catch {
    return { cleanedUrl: rawUrl, strippedParams: [] };
  }
}
