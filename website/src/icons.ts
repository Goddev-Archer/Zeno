import { addIcon } from "@iconify/react";

// Offline embedded icon registry for Zeno Official Website
// Official SVGs from Mage Icons & Lucide / MDI sets (24x24 grid)
// Ensures 100% reliable rendering without clipping or CDN failure.

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
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path stroke-miterlimit="10" d="M12 15.238V3.213"/><path stroke-linejoin="round" d="m7.375 10.994l3.966 3.966a.937.937 0 0 0 1.318 0l3.966-3.966"/><path stroke-linejoin="round" d="M2.75 13.85v4.625a2.313 2.313 0 0 0 2.313 2.313h13.874a2.313 2.313 0 0 0 2.313-2.313V13.85"/></g>'
});

// 3. Check Circle
register(["mage:check-circle", "lucide:check-circle", "lucide:check-circle-2"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="m6.9 12.087l2.664 2.663a1.01 1.01 0 0 0 1.433 0l5.367-5.368"/><path d="M12 21.5a9.5 9.5 0 1 0 0-19a9.5 9.5 0 0 0 0 19"/></g>'
});

// 4. Lock
register(["mage:lock", "lucide:lock"], {
  width: 24,
  height: 24,
  body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 9.688H7c-1.38 0-2.5 1.035-2.5 2.312v6.938c0 1.277 1.12 2.312 2.5 2.312h10c1.38 0 2.5-1.035 2.5-2.312V12c0-1.277-1.12-2.312-2.5-2.312m-9.625 0V7.374a4.625 4.625 0 0 1 9.25 0v2.313m-8.094 8.094h6.938"/>'
});

// 5. Shield Check / Privacy Shield
register(["mage:shield-check", "lucide:shield-check", "mage:shield"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="m8.67 10.909l1.875 1.874a.71.71 0 0 0 1.008 0l3.777-3.777"/><path d="M20.672 11.89V6.61a1.93 1.93 0 0 0-1.32-1.831L14.438 3.14a7.8 7.8 0 0 0-4.876 0L4.648 4.778a1.93 1.93 0 0 0-1.32 1.83v5.28a7.71 7.71 0 0 0 3.603 6.524l4.048 2.544a1.93 1.93 0 0 0 2.042 0l4.047-2.544a7.71 7.71 0 0 0 3.604-6.523"/></g>'
});

// 6. Sparkles / AI / Smart
register(["mage:sparkles", "lucide:sparkles"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594zM20 2v4m2-2h-4"/><circle cx="4" cy="20" r="2"/></g>'
});

// 7. CPU / Lightweight Performance
register(["mage:cpu", "lucide:cpu"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 20v2m0-20v2m5 16v2m0-20v2M2 12h2m-2 5h2M2 7h2m16 5h2m-2 5h2M20 7h2M7 20v2M7 2v2"/><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="8" height="8" x="8" y="8" rx="1"/></g>'
});

// 8. Key / Sovereign Keys (Official Mage Key)
register(["mage:key", "lucide:key"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M19.543 4.471A6.501 6.501 0 0 0 8.618 7.255a6.52 6.52 0 0 0 .34 4.447L2.5 18.179V21.5h3.364l-.318-1.99l1.965.33l1.67-1.661l-.318-1.99l1.976.318l1.47-1.472a6.5 6.5 0 0 0 8.06-2.261a6.52 6.52 0 0 0-.838-8.338z"/><path d="M16.99 10.23a2.258 2.258 0 0 1-3.476-2.853a2.26 2.26 0 0 1 3.477-.339a2.275 2.275 0 0 1 0 3.192"/></g>'
});

// 9. Message Conversation / Chat
register(["mage:message-conversation", "lucide:message-square"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M12.686 18.222q.603.117 1.218.123a7.3 7.3 0 0 0 2.992-.64l3.095.455a1.03 1.03 0 0 0 1.032-1.135l-.372-3.126a7.2 7.2 0 0 0 .599-2.9a7.304 7.304 0 0 0-7.336-7.284a7.295 7.295 0 0 0-7.109 5.654"/><path d="M13.904 14.745a5.66 5.66 0 0 1-1.218 3.477a5.61 5.61 0 0 1-4.375 2.063a5.7 5.7 0 0 1-2.29-.495l-2.311.413a.754.754 0 0 1-.826-.877l.32-2.363a5.5 5.5 0 0 1-.454-2.219A5.58 5.58 0 0 1 6.805 9.37a5.2 5.2 0 0 1 1.517-.217a5.59 5.59 0 0 1 5.582 5.593"/></g>'
});

// 10. Radar / Discovery (Official Lucide Radar)
register(["mage:radar", "lucide:radar"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34M4 6h.01M2.29 9.62a10 10 0 1 0 19.02-1.27"/><path d="M16.24 7.76a6 6 0 1 0-8.01 8.91M12 18h.01m5.98-6.34a6 6 0 0 1-2.22 5.01"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59l5.66-5.66"/></g>'
});

// 11. Radio / Decentralized Relays (Official Lucide Radio)
register(["mage:radio", "lucide:radio"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M16.247 7.761a6 6 0 0 1 0 8.478m2.828-11.306a10 10 0 0 1 0 14.134m-14.15 0a10 10 0 0 1 0-14.134m2.828 11.306a6 6 0 0 1 0-8.478"/><circle cx="12" cy="12" r="2"/></g>'
});

// 12. File Records / Documents
register(["mage:file-records", "lucide:file-text"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M8.593 3.217H4.698A1.95 1.95 0 0 0 2.75 5.164v13.633c0 1.075.872 1.947 1.948 1.947h3.895a1.95 1.95 0 0 0 1.947-1.947V5.164a1.95 1.95 0 0 0-1.947-1.947"/><path d="M6.645 17.379a1.503 1.503 0 1 0 0-3.007a1.503 1.503 0 0 0 0 3.007M10.54 7.93l3.116 11.685a1.95 1.95 0 0 0 2.386 1.373l3.768-.974a1.947 1.947 0 0 0 1.373-2.386L17.658 4.385a1.947 1.947 0 0 0-2.386-1.373l-3.758 1.003c-.406.111-.764.35-1.023.682"/><path d="M16.665 17.241a1.502 1.502 0 1 0 0-3.004a1.502 1.502 0 0 0 0 3.004"/></g>'
});

// 13. Volume Up / Voice Channels
register(["mage:volume-up", "lucide:volume-2"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path stroke-linejoin="round" d="M3 14.088V9.912c0-.416.142-.814.395-1.108c.254-.293.597-.458.955-.458h1.89c.237-.001.47-.073.675-.21l3.97-2.63c.204-.135.436-.205.672-.204s.467.074.67.212c.205.137.374.334.492.57c.118.237.18.506.181.78v10.273c0 .273-.063.542-.181.778a1.5 1.5 0 0 1-.491.571c-.204.137-.435.21-.671.212a1.2 1.2 0 0 1-.673-.204l-3.969-2.631a1.23 1.23 0 0 0-.675-.209H4.35c-.358 0-.701-.165-.955-.459A1.7 1.7 0 0 1 3 14.089"/><path stroke-miterlimit="10" d="M16.228 15.715a5.344 5.344 0 0 0 0-7.559m2.267 9.884a8.55 8.55 0 0 0 0-12.093"/></g>'
});

// 14. Platform: Apple macOS
register(["mdi:apple"], {
  width: 24,
  height: 24,
  body: '<path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47c-1.34.03-1.77-.79-3.29-.79c-1.53 0-2 .77-3.27.82c-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51c1.28-.02 2.5.87 3.29.87c.78 0 2.26-1.07 3.81-.91c.65.03 2.47.26 3.64 1.98c-.09.06-2.17 1.28-2.15 3.81c.03 3.02 2.65 4.03 2.68 4.04c-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5c.13 1.17-.34 2.35-1.04 3.19c-.69.85-1.83 1.51-2.95 1.42c-.15-1.15.41-2.35 1.05-3.11"/>'
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
  body: '<path fill="currentColor" d="M14.62 8.35c-.42.28-1.75 1.04-1.95 1.19c-.39.31-.75.29-1.14-.01c-.2-.16-1.53-.92-1.95-1.19c-.48-.31-.45-.7.08-.92c1.64-.69 3.28-.64 4.91.03c.49.21.51.6.05.9m7.22 7.28c-.93-2.09-2.2-3.99-3.84-5.66a4.3 4.3 0 0 1-1.06-1.88c-.1-.33-.17-.67-.24-1.01c-.2-.88-.29-1.78-.7-2.61c-.73-1.58-2-2.4-3.84-2.47c-1.81.05-3.16.81-3.95 2.4c-.21.43-.36.88-.46 1.34c-.17.76-.32 1.55-.5 2.32c-.15.65-.45 1.21-.96 1.71c-1.61 1.57-2.9 3.37-3.88 5.35c-.14.29-.28.58-.37.88c-.19.66.29 1.12.99.96c.44-.09.88-.18 1.3-.31c.41-.15.57-.05.67.35c.65 2.15 2.07 3.66 4.24 4.5c4.12 1.56 8.93-.66 9.97-4.58c.07-.27.17-.37.47-.27c.46.14.93.24 1.4.35c.49.09.85-.16.92-.64c.03-.26-.06-.49-.16-.73"/>'
});

// 18. Platform: Windows
register(["mdi:microsoft-windows"], {
  width: 24,
  height: 24,
  body: '<path fill="currentColor" d="M3 12V6.75l6-1.32v6.48zm17-9v8.75l-10 .15V5.21zM3 13l6 .09v6.81l-6-1.15zm17 .25V22l-10-1.91V13.1z"/>'
});

// 19. Sun / Dark Mode Toggle
register(["mage:sun", "lucide:sun"], {
  width: 24,
  height: 24,
  body: '<g fill="none"><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M12 17.885a5.885 5.885 0 1 0 0-11.77a5.885 5.885 0 0 0 0 11.77m-9.281-5.879H1.5m21 0h-1.207m-9.287-9.287V1.5m0 21v-1.207M5.435 5.435l-.859-.859m14.848 14.848l-.86-.86m.001-13.129l.858-.859M4.576 19.424l.86-.86"/></g></g>'
});

// 20. Moon / Dark Mode Toggle
register(["mage:moon", "lucide:moon"], {
  width: 24,
  height: 24,
  body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.182 14.86A9.474 9.474 0 1 1 9.139 2.819a1.053 1.053 0 0 1 1.38 1.295a7.7 7.7 0 0 0-.085 4.642a7 7 0 0 0 4.81 4.811c1.52.45 3.14.42 4.643-.084a1.053 1.053 0 0 1 1.295 1.379"/>'
});

// 21. Chevron Down
register(["mage:chevron-down", "lucide:chevron-down"], {
  width: 24,
  height: 24,
  body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m4 8.417l6.587 6.587a2.013 2.013 0 0 0 2.826 0L20 8.417"/>'
});

// 22. Copy
register(["mage:copy", "lucide:copy"], {
  width: 24,
  height: 24,
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M18.327 7.286h-8.044a1.93 1.93 0 0 0-1.925 1.938v10.088c0 1.07.862 1.938 1.925 1.938h8.044a1.93 1.93 0 0 0 1.925-1.938V9.224c0-1.07-.862-1.938-1.925-1.938"/><path d="M15.642 7.286V4.688c0-.514-.203-1.007-.564-1.37a1.92 1.92 0 0 0-1.361-.568H5.673c-.51 0-1 .204-1.36.568a1.95 1.95 0 0 0-.565 1.37v10.088c0 .514.203 1.007.564 1.37s.85.568 1.361.568h2.685"/></g>'
});
