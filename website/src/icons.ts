import { addIcon } from "@iconify/react";

// Offline embedded icon registry for Zeno Official Website
// Ensures 100% reliable rendering without external CDN dependency, even behind ad-blockers or firewall rules.

interface IconData {
  body: string;
  width?: number;
  height?: number;
}

const register = (names: string[], data: IconData) => {
  for (const name of names) {
    addIcon(name, data);
  }
};

// 1. Code Snippet (< / >)
register(["mage:code", "lucide:code", "tabler:code"], {
  width: 24,
  height: 24,
  body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16 18l6-6l-6-6M8 6l-6 6l6 6"/>'
});

// 2. Download Icon
register(["mage:download", "lucide:download"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 3v13m0 0l-4-4m4 4l4-4"/><path d="M5 21h14"/></g>'
});

// 3. Check Circle
register(["mage:check-circle", "lucide:check-circle", "lucide:check-circle-2"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12l2 2l4-4"/></g>'
});

// 4. Lock
register(["mage:lock", "lucide:lock"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></g>'
});

// 5. Shield Check / Privacy Shield
register(["mage:shield-check", "lucide:shield-check", "mage:shield"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3l-8 3v7c0 6 8 10 8 10z"/><path d="m9 12l2 2l4-4"/></g>'
});

// 6. Sparkles / AI / Smart
register(["mage:sparkles", "lucide:sparkles"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"/><path d="M19 4v4m2-2h-4"/></g>'
});

// 7. CPU / Lightweight Performance
register(["mage:cpu", "lucide:cpu"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="14" height="14" x="5" y="5" rx="2"/><rect width="6" height="6" x="9" y="9"/><path d="M9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4"/></g>'
});

// 8. Key / Sovereign Keys
register(["mage:key", "lucide:key"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m15.5 8.5l-9 9l-3.5-3.5l9-9a4.95 4.95 0 1 1 3.5 3.5z"/><circle cx="17.5" cy="6.5" r="1.5"/></g>'
});

// 9. Message Conversation / Chat
register(["mage:message-conversation", "lucide:message-square"], {
  width: 24,
  height: 24,
  body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
});

// 10. Radar / Discovery
register(["mage:radar", "lucide:radar"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M16.24 7.76A6 6 0 0 0 7.76 16.24M13.41 10.59a2 2 0 0 0-2.82 2.82"/><path d="m12 12l4-4"/></g>'
});

// 11. Radio / Decentralized Relays
register(["mage:radio", "lucide:radio"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M4.93 4.93a10 10 0 0 1 14.14 0m-11.31 2.83a6 6 0 0 1 8.48 0M9.17 9.17a2 2 0 0 1 2.83 0"/><circle cx="12" cy="12" r="1" fill="currentColor"/><path d="M12 13v8"/></g>'
});

// 12. File Records / Documents
register(["mage:file-records", "lucide:file-text"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8m8 4H8m2-8H8"/></g>'
});

// 13. Volume Up / Voice Channels
register(["mage:volume-up", "lucide:volume-2"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></g>'
});

// 14. Platform: Apple macOS
register(["mdi:apple"], {
  width: 24,
  height: 24,
  body: '<path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47c-1.34.03-1.77-.79-3.29-.79c-1.53 0-2 .77-3.27.82c-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51c1.28-.02 2.5.87 3.29.87c.78 0 2.26-1.07 3.81-.91c.65.03 2.47.26 3.64 1.98c-.09.06-2.17 1.28-2.15 3.81c.03 3.02 2.65 4.03 2.68 4.04c-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.85c-.9.04-2 .6-2.65 1.35c-.56.64-1.05 1.71-.92 2.74c1.01.08 2.01-.54 2.56-1.24"/>'
});

// 15. Email / Contact
register(["mdi:email-outline", "lucide:mail"], {
  width: 24,
  height: 24,
  body: '<path fill="currentColor" d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2zm-2 0l-8 5l-8-5zm0 12H4V8l8 5l8-5z"/>'
});

// 16. Platform: GitHub
register(["mdi:github", "mage:github-circle"], {
  width: 24,
  height: 24,
  body: '<path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"/>'
});

// 17. Platform: Linux
register(["mdi:linux"], {
  width: 24,
  height: 24,
  body: '<path fill="currentColor" d="M14.7 13.3c-.1-.1-.3-.2-.4-.2c-.3 0-.5.2-.6.4c-.4.8-1 1.4-1.7 1.4s-1.3-.6-1.7-1.4c-.1-.2-.3-.4-.6-.4c-.1 0-.3.1-.4.2c-.3.3-.3.8 0 1.1c.6 1.2 1.6 2 2.7 2s2.1-.8 2.7-2c.3-.3.3-.8 0-1.1M12 3c-2.8 0-4 2.8-4 5.5c0 1.2.3 2.8 1 3.5c-.3.7-.8 1.4-1.3 2c-1.3 1.5-2.7 3.1-2.7 5c0 1.7 1.3 3 3 3c.6 0 2.3-.3 3.6-.9c.8.3 1.6.4 2.4.4s1.6-.1 2.4-.4c1.3.6 3 .9 3.6.9c1.7 0 3-1.3 3-3c0-1.9-1.4-3.5-2.7-5c-.5-.6-1-1.3-1.3-2c.7-.7 1-2.3 1-3.5C16 5.8 14.8 3 12 3m0 2c1.7 0 2 2.2 2 3.5c0 .6-.2 1.3-.5 1.8c-.5-.2-1-.3-1.5-.3s-1 .1-1.5.3c-.3-.5-.5-1.2-.5-1.8C10 7.2 10.3 5 12 5m-1.2 1.8c.4 0 .7.3.7.7s-.3.7-.7.7s-.7-.3-.7-.7s.3-.7.7-.7m2.4 0c.4 0 .7.3.7.7s-.3.7-.7.7s-.7-.3-.7-.7s.3-.7.7-.7"/>'
});

// 18. Platform: Windows
register(["mdi:microsoft-windows"], {
  width: 24,
  height: 24,
  body: '<path fill="currentColor" d="M3 12V6.75l6-1.12v6.37zm7.5-6.66L21 3.75v8.25h-10.5zM3 13.5h6v6.38l-6-1.13zm7.5 0H21v8.25l-10.5-1.59z"/>'
});

// 19. Sun / Dark Mode Toggle
register(["mage:sun", "lucide:sun"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></g>'
});

// 20. Moon / Dark Mode Toggle
register(["mage:moon", "lucide:moon"], {
  width: 24,
  height: 24,
  body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3a6 6 0 0 0 9 9a9 9 0 1 1-9-9z"/>'
});

// 21. Chevron Down
register(["mage:chevron-down", "lucide:chevron-down"], {
  width: 24,
  height: 24,
  body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9l6 6l6-6"/>'
});

// 22. Copy
register(["mage:copy", "lucide:copy"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="13" height="13" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></g>'
});
