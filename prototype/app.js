/**
 * @file app.js — Projekt Zeno UI Prototype Interactivity
 *
 * Vanilla ES6+ JavaScript for a JetBrains-IDE-inspired Discord alternative.
 * Handles channel/server switching, code editor modal, message input,
 * toast notifications, voice channel simulation, and micro-animations.
 *
 * @author CipherNaut
 * @version 0.1.0
 */

document.addEventListener('DOMContentLoaded', () => {
  // ──────────────────────────────────────────────
  // § 0. DOM REFERENCES (cached for performance)
  // ──────────────────────────────────────────────

  const chatChannelName   = document.getElementById('chat-channel-name');
  const serverNameEl      = document.getElementById('server-name');
  const messagesContainer = document.getElementById('messages-container');
  const messageInput      = document.getElementById('message-input');
  const editorModal       = document.getElementById('editor-modal');
  const toggleMembersBtn  = document.getElementById('toggle-members');
  const membersSidebar    = document.querySelector('.members-sidebar');
  const chatArea          = document.querySelector('.chat-area');

  // Multi-Server Channels configuration
  const serverChannels = {
    'zeno-dev': {
      name: 'Zeno Development',
      categories: [
        {
          name: 'Textkanäle',
          type: 'text',
          channels: [
            { id: 'allgemein', name: 'allgemein', active: true },
            { id: 'dev-talk', name: 'dev-talk' },
            { id: 'ui-design', name: 'ui-design' },
            { id: 'kryptografie', name: 'kryptografie' }
          ]
        },
        {
          name: 'Sprachkanäle',
          type: 'voice',
          channels: [
            { id: 'voice-lobby', name: 'Voice Lobby', connectedUsers: ['Max', 'Lena'] },
            { id: 'pair-programming', name: 'Pair Programming' }
          ]
        }
      ]
    },
    'gaming-hub': {
      name: 'Gaming Hub',
      categories: [
        {
          name: 'Textkanäle',
          type: 'text',
          channels: [
            { id: 'lobby', name: 'lobby', active: true },
            { id: 'lfg', name: 'lfg-gaming' },
            { id: 'clips', name: 'clips-and-highlights' }
          ]
        },
        {
          name: 'Sprachkanäle',
          type: 'voice',
          channels: [
            { id: 'duo-1', name: 'Duo Queue 1' },
            { id: 'duo-2', name: 'Duo Queue 2' },
            { id: 'squad-room', name: 'Squad Room' }
          ]
        }
      ]
    },
    'design-team': {
      name: 'Design Team',
      categories: [
        {
          name: 'Textkanäle',
          type: 'text',
          channels: [
            { id: 'design-system', name: 'design-system', active: true },
            { id: 'moodboards', name: 'moodboards' },
            { id: 'ux-research', name: 'ux-research' }
          ]
        },
        {
          name: 'Sprachkanäle',
          type: 'voice',
          channels: [
            { id: 'feedback-sync', name: 'Feedback Sync' },
            { id: 'brainstorming', name: 'Brainstorming' }
          ]
        }
      ]
    },
    'open-source': {
      name: 'Open Source',
      categories: [
        {
          name: 'Textkanäle',
          type: 'text',
          channels: [
            { id: 'announcements', name: 'announcements', active: true },
            { id: 'general', name: 'general' },
            { id: 'issues', name: 'issues-and-pr' }
          ]
        },
        {
          name: 'Sprachkanäle',
          type: 'voice',
          channels: [
            { id: 'community-call', name: 'Community Call' }
          ]
        }
      ]
    }
  };

  // Mock messages database
  const mockMessages = {
    'allgemein': [
      { author: 'MaxShield', text: 'Hat jemand schon den neuen SFrame-Branch getestet? Die Latenz im Voice ist deutlich besser.', time: '10:14', color: 'blue' },
      { author: 'LenaCrypt', text: 'Ja, funktioniert super! Hier ist mein Benchmark-Script:', time: '10:16', color: 'green', code: 'use aegis_core::crypto::sframe;\nuse std::time::Instant;' },
      { author: 'CipherNaut', text: 'Nice! 🔥 Die Zahlen sehen vielversprechend aus. Ich merge den Branch heute Abend.', time: '10:18', color: 'purple' }
    ],
    'dev-talk': [
      { author: 'CipherNaut', text: 'Wir müssen die WASM-Sandbox-Performance im Auge behalten.', time: '09:12', color: 'purple' },
      { author: 'MaxShield', text: 'Stimmt, ich mache dazu einen Benchmark.', time: '09:15', color: 'blue' }
    ],
    'ui-design': [
      { author: 'LenaCrypt', text: 'Ich habe die neuen Entwürfe für das Zeno-Branding hochgeladen. Was meint ihr?', time: '11:02', color: 'green' }
    ],
    'kryptografie': [
      { author: 'LenaCrypt', text: 'Das 3-Stufen-Modell für Key-Recovery (Gerätekopplung, Cloud-Backup, Social Recovery) steht.', time: '14:20', color: 'green' }
    ],
    'lobby': [
      { author: 'MaxShield', text: 'Moin, zockt heute jemand? 🎮', time: '18:44', color: 'blue' }
    ]
  };

  // ──────────────────────────────────────────────
  // § 1. CHANNEL SWITCHING
  // ──────────────────────────────────────────────

  /**
   * Loads the mock messages for a selected channel dynamically.
   * Also resets scroll positions and applies animations.
   */
  function loadChannelContent(channelId, channelName) {
    if (chatChannelName) {
      chatChannelName.textContent = `# ${channelName}`;
    }
    if (messageInput) {
      messageInput.placeholder = `Nachricht an # ${channelName}`;
    }
    if (!messagesContainer) return;

    messagesContainer.innerHTML = '';
    
    // Date Separator
    const dateSep = document.createElement('div');
    dateSep.className = 'date-separator';
    dateSep.setAttribute('role', 'separator');
    dateSep.innerHTML = `<span class="date-separator-text">— Heute —</span>`;
    messagesContainer.appendChild(dateSep);

    const msgs = mockMessages[channelId] || [
      { author: 'System', text: `Willkommen im Kanal #${channelName}! Dies ist der Beginn des Chatverlaufs.`, time: getCurrentTimestamp(), color: 'gray' }
    ];

    msgs.forEach((m, idx) => {
      const article = document.createElement('article');
      article.className = 'message';
      article.id = `msg-dynamic-${idx}`;
      article.style.opacity = '0';
      article.style.transform = 'translateY(8px)';
      
      const avatarInitial = m.author[0];
      const safeAuthor = escapeHTML(m.author);
      const safeText = escapeHTML(m.text);

      let codeHtml = '';
      if (m.code) {
        codeHtml = `
          <div class="code-block-wrapper" data-language="rust">
            <header class="code-block-header">
              <span class="code-block-language">Rust</span>
              <div class="code-block-actions">
                <button class="code-action-btn btn-open-editor" data-action="open-editor" title="Open in Editor">Open in Editor</button>
              </div>
            </header>
            <pre class="code-block"><code class="language-rust">${escapeHTML(m.code)}</code></pre>
          </div>
        `;
      }

      article.innerHTML = `
        <div class="message-avatar ${m.color}">${avatarInitial}</div>
        <div class="message-body">
          <header class="message-header">
            <span class="message-author ${m.color}">${safeAuthor}</span>
            <time class="message-timestamp">${m.time}</time>
          </header>
          <div class="message-content">
            <p>${safeText}</p>
            ${codeHtml}
          </div>
        </div>
      `;

      messagesContainer.appendChild(article);

      // Trigger stagger fade-in
      setTimeout(() => {
        article.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        article.style.opacity = '1';
        article.style.transform = 'translateY(0)';
      }, idx * 60);
    });

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Wire code blocks
    initCodeBlockInteractions();
  }

  /**
   * Renders the channel layout dynamically for the given server.
   */
  function renderServerChannels(serverId) {
    const listEl = document.getElementById('channel-list');
    if (!listEl) return;

    const server = serverChannels[serverId];
    if (!server) return;

    listEl.innerHTML = '';

    server.categories.forEach(cat => {
      const section = document.createElement('section');
      section.className = 'channel-category';
      section.dataset.category = cat.type;

      const header = document.createElement('button');
      header.className = 'category-header';
      header.innerHTML = `
        <span class="category-arrow"><span class="iconify" data-icon="mage:chevron-down"></span></span>
        <span class="category-name">${cat.name}</span>
      `;
      
      const ul = document.createElement('ul');
      ul.className = 'category-channels';
      ul.id = `${cat.type}-channels-${serverId}`;

      cat.channels.forEach(ch => {
        const li = document.createElement('li');
        const icon = cat.type === 'text' ? 'mage:hashtag' : 'mage:volume-up';
        const isVoice = cat.type === 'voice';

        const btn = document.createElement('button');
        btn.className = `channel-item ${ch.active ? 'active' : ''}`;
        if (isVoice) btn.classList.add('voice-channel');
        btn.dataset.channel = ch.name;
        btn.dataset.channelType = cat.type;
        btn.id = `channel-${ch.id}`;

        btn.innerHTML = `
          <span class="channel-icon"><span class="iconify" data-icon="${icon}"></span></span>
          <span class="channel-name">${ch.name}</span>
        `;

        li.appendChild(btn);

        // Render connected users for voice channel
        if (isVoice && ch.connectedUsers) {
          const userUl = document.createElement('ul');
          userUl.className = 'voice-connected-users';
          ch.connectedUsers.forEach(user => {
            const userLi = document.createElement('li');
            userLi.className = 'voice-user';
            userLi.innerHTML = `
              <span class="voice-user-avatar">${user[0]}</span>
              <span class="voice-user-name">${user}</span>
            `;
            userUl.appendChild(userLi);
          });
          li.appendChild(userUl);
        }

        ul.appendChild(li);
      });

      section.appendChild(header);
      section.appendChild(ul);
      listEl.appendChild(section);

      // Re-trigger Iconify scan
      if (window.Iconify) {
        window.Iconify.scan(section);
      }
    });

    // Wire up collapses
    initCategoryCollapse();
    
    // Wire up switching
    initChannelSwitching();
    initVoiceChannels();
  }

  /**
   * Initialise click handlers on every `.channel-item` element.
   * On click: transfers `.active`, updates the chat header & input placeholder,
   * and applies a fade transition to the messages container.
   */
  function initChannelSwitching() {
    const channelItems = document.querySelectorAll('.channel-item');

    channelItems.forEach((item) => {
      item.addEventListener('click', () => {
        // Skip if it's a voice channel (handled separately)
        if (item.classList.contains('voice-channel')) return;

        // Transfer .active class
        channelItems.forEach((ch) => ch.classList.remove('active'));
        item.classList.add('active');

        const channelId = item.id.replace('channel-', '');
        const channelName = item.dataset.channel || item.textContent.trim().replace(/^#\s*/, '');

        loadChannelContent(channelId, channelName);
      });
    });
  }

  // ──────────────────────────────────────────────
  // § 2. SERVER SWITCHING
  // ──────────────────────────────────────────────

  /**
   * Initialise click handlers on every `.server-icon` element.
   * On click: transfers `.active`, updates the server name in the sidebar header,
   * and animates the active indicator bar.
   */
  function initServerSwitching() {
    const serverIcons = document.querySelectorAll('.server-icon');

    serverIcons.forEach((icon) => {
      icon.addEventListener('click', () => {
        if (icon.id === 'btn-add-server') {
          showToast('Server-Erstellung ist im Prototyp deaktiviert');
          return;
        }

        // Transfer .active class
        serverIcons.forEach((si) => si.classList.remove('active'));
        icon.classList.add('active');

        // Update server name
        const serverId = icon.dataset.server || icon.id.replace('server-', '');
        const name = icon.dataset.serverName || icon.getAttribute('title') || icon.textContent.trim();
        if (serverNameEl) {
          serverNameEl.textContent = name;
        }

        // Animate active indicator (the blue bar)
        icon.classList.add('indicator-animate');
        icon.addEventListener(
          'animationend',
          () => icon.classList.remove('indicator-animate'),
          { once: true }
        );

        // Render channels for this server
        renderServerChannels(serverId);

        // Select first text channel of the new server
        const firstChan = document.querySelector('.category-channels .channel-item:not(.voice-channel)');
        if (firstChan) {
          firstChan.click();
        }

        // Animate channel items sliding in
        animateChannelSlideIn();
      });
    });
  }

  /**
   * Stagger-animate channel items sliding into view after a server switch.
   */
  function animateChannelSlideIn() {
    const channelItems = document.querySelectorAll('.channel-item');
    channelItems.forEach((item, i) => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-12px)';
      setTimeout(() => {
        item.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
      }, i * 40);
    });
  }

  // ──────────────────────────────────────────────
  // § 3. CODE BLOCK INTERACTIONS
  // ──────────────────────────────────────────────

  /**
   * Initialise code block hover actions.
   * "Open in Editor" buttons launch the code editor modal
   * with the code content from the originating `.code-block`.
   */
  function initCodeBlockInteractions() {
    const openEditorBtns = document.querySelectorAll('.btn-open-editor');

    openEditorBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Walk up to find the parent wrapper that contains the code block
        const wrapper = btn.closest('.code-block-wrapper') || btn.closest('.code-block');
        if (!wrapper) return;

        // Extract raw code text
        const codeEl = wrapper.querySelector('code') || wrapper.querySelector('pre');
        const rawCode = codeEl ? codeEl.textContent : '';

        openEditorModal(rawCode);
      });
    });
  }

  // ──────────────────────────────────────────────
  // § 4. CODE EDITOR MODAL
  // ──────────────────────────────────────────────

  /**
   * Open the code editor modal and populate it with the given source code.
   * Dynamically adds line numbers.
   *
   * @param {string} code — The source code string to display.
   */
  function openEditorModal(code) {
    if (!editorModal) return;

    const editorCode    = editorModal.querySelector('.editor-code code') || editorModal.querySelector('.editor-code') || editorModal.querySelector('code');
    const lineNumbersEl = editorModal.querySelector('.line-numbers');
    const outputPanel   = editorModal.querySelector('.editor-output');

    // Populate code
    if (editorCode) {
      editorCode.textContent = code;
    }

    // Generate line numbers
    if (lineNumbersEl) {
      const lineCount = code.split('\n').length;
      lineNumbersEl.innerHTML = Array.from({ length: lineCount }, (_, i) =>
        `<span>${i + 1}</span>`
      ).join('\n');
    }

    // Reset output panel
    if (outputPanel) {
      outputPanel.classList.add('hidden');
      outputPanel.textContent = '';
    }

    // Show modal
    openModal(editorModal);

    // Wire up modal action buttons (idempotent — uses event delegation internally)
    wireEditorActions(code);
  }

  /**
   * Close the editor modal with a fade-out.
   */
  function closeEditorModal() {
    closeModal(editorModal);
  }

  /**
   * Bind action buttons inside the editor modal.
   *
   * - **Copy**: copies code to clipboard, shows "Kopiert!" toast.
   * - **Run**: simulates execution, shows fake benchmark output.
   * - **Suggest Edit**: shows a toast that the suggestion was sent.
   *
   * @param {string} code — The current code string in the editor.
   */
  function wireEditorActions(code) {
    if (!editorModal) return;

    // — Close button & backdrop —
    const closeBtn = editorModal.querySelector('.modal-close');
    const backdrop = editorModal.querySelector('.modal-backdrop');

    if (closeBtn) {
      // Remove old listener by cloning
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      newCloseBtn.addEventListener('click', closeEditorModal);
    }

    if (backdrop) {
      const newBackdrop = backdrop.cloneNode(true);
      backdrop.parentNode.replaceChild(newBackdrop, backdrop);
      newBackdrop.addEventListener('click', closeEditorModal);
    }

    // Also close if clicking the modal overlay itself (outside the modal content)
    editorModal.addEventListener('click', (e) => {
      if (e.target === editorModal) {
        closeEditorModal();
      }
    }, { once: true });

    // — Copy button —
    const copyBtn = editorModal.querySelector('.btn-copy');
    if (copyBtn) {
      const newCopyBtn = copyBtn.cloneNode(true);
      copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
      newCopyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(code).then(() => {
          showToast('Kopiert!');
        }).catch(() => {
          // Fallback for older browsers / insecure contexts
          fallbackCopyToClipboard(code);
          showToast('Kopiert!');
        });
      });
    }

    // — Run button —
    const runBtn = editorModal.querySelector('.btn-run');
    if (runBtn) {
      const newRunBtn = runBtn.cloneNode(true);
      runBtn.parentNode.replaceChild(newRunBtn, runBtn);
      newRunBtn.addEventListener('click', () => {
        const outputPanel = editorModal.querySelector('.editor-output');
        if (outputPanel) {
          outputPanel.classList.remove('hidden');
          outputPanel.textContent = '';

          // Simulate execution with a brief delay
          setTimeout(() => {
            outputPanel.textContent = '> Running benchmark...\n';
            setTimeout(() => {
              outputPanel.textContent += '10k encryptions: 1.23ms\nBenchmark complete.';
            }, 600);
          }, 300);
        }
      });
    }

    // — Suggest Edit button —
    const suggestBtn = editorModal.querySelector('.btn-suggest-edit');
    if (suggestBtn) {
      const newSuggestBtn = suggestBtn.cloneNode(true);
      suggestBtn.parentNode.replaceChild(newSuggestBtn, suggestBtn);
      newSuggestBtn.addEventListener('click', () => {
        showToast('Änderungsvorschlag gesendet an # allgemein');
      });
    }
  }

  /**
   * Fallback clipboard copy for environments without navigator.clipboard.
   * @param {string} text — The text to copy.
   */
  function fallbackCopyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); } catch { /* noop */ }
    document.body.removeChild(textarea);
  }

  // ──────────────────────────────────────────────
  // § 5. MEMBERS SIDEBAR TOGGLE
  // ──────────────────────────────────────────────

  /**
   * Toggle the members sidebar visibility.
   * When hidden the chat area expands to fill the vacated space.
   * Transition is animated via CSS `transition` on width/max-width.
   */
  function initMembersToggle() {
    if (!toggleMembersBtn || !membersSidebar) return;

    toggleMembersBtn.addEventListener('click', () => {
      const isHidden = membersSidebar.classList.toggle('collapsed');

      // Toggle visual state of the button
      toggleMembersBtn.classList.toggle('active', !isHidden);

      // Expand chat area when sidebar is hidden
      if (chatArea) {
        chatArea.classList.toggle('expanded', isHidden);
      }
    });
  }

  // ──────────────────────────────────────────────
  // § 6. CHANNEL CATEGORY COLLAPSE
  // ──────────────────────────────────────────────

  /**
   * Initialise collapsible category headers.
   * On click the channels within the category are toggled,
   * and the arrow indicator rotates between ▸ and ▾.
   */
  function initCategoryCollapse() {
    const categoryHeaders = document.querySelectorAll('.category-header');

    categoryHeaders.forEach((header) => {
      header.addEventListener('click', () => {
        header.classList.toggle('collapsed');

        // Toggle the sibling channel list
        const channelList = header.nextElementSibling;
        if (channelList) {
          channelList.classList.toggle('hidden');
        }

        // Rotate arrow indicator
        const arrow = header.querySelector('.category-arrow');
        if (arrow) {
          arrow.textContent = header.classList.contains('collapsed') ? '▸' : '▾';
        }
      });
    });
  }

  // ──────────────────────────────────────────────
  // § 7. MESSAGE INPUT
  // ──────────────────────────────────────────────

  /**
   * Initialise the message input field.
   * - **Enter** sends the message.
   * - **Shift+Enter** inserts a newline.
   *
   * Sent messages are appended to `#messages-container` as a new DOM element
   * with avatar "C", username "CipherNaut", current timestamp, and the typed text.
   */
  function initMessageInput() {
    if (!messageInput || !messagesContainer) return;

    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();

        const text = messageInput.value.trim();
        if (!text) return;

        appendMessage({
          avatar: 'C',
          username: 'CipherNaut',
          timestamp: getCurrentTimestamp(),
          content: text,
          avatarColor: 'var(--accent-purple, #9B6BDF)',
        });

        messageInput.value = '';
      }
      // Shift+Enter: default behaviour (newline in textarea) — no action needed
    });
  }

  /**
   * Create and append a message element to the messages container.
   *
   * @param {Object} opts
   * @param {string} opts.avatar      — Single-character avatar label.
   * @param {string} opts.username    — Display name.
   * @param {string} opts.timestamp   — HH:MM formatted time string.
   * @param {string} opts.content     — The message body text.
   * @param {string} [opts.avatarColor='#9B6BDF'] — Background colour for the avatar circle.
   */
  function appendMessage({ avatar, username, timestamp, content, avatarColor = '#9B6BDF' }) {
    const msg = document.createElement('div');
    msg.className = 'message fade-in';

    // Escape HTML in user content to prevent XSS
    const safeContent = escapeHTML(content).replace(/\n/g, '<br>');

    msg.innerHTML = `
      <div class="message-avatar" style="background:${avatarColor}">${avatar}</div>
      <div class="message-body">
        <div class="message-header">
          <span class="message-username">${escapeHTML(username)}</span>
          <span class="message-timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${safeContent}</div>
      </div>
    `;

    messagesContainer.appendChild(msg);

    // Trigger reflow so the animation plays
    void msg.offsetWidth;
    msg.classList.add('visible');

    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Return the current time as a HH:MM string.
   * @returns {string}
   */
  function getCurrentTimestamp() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  /**
   * Escape HTML special characters to prevent XSS in user-generated content.
   * @param {string} str — Raw string.
   * @returns {string} Sanitised string safe for innerHTML insertion.
   */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ──────────────────────────────────────────────
  // § 8. TOAST NOTIFICATIONS
  // ──────────────────────────────────────────────

  /** @type {HTMLDivElement|null} Lazy-initialised toast container */
  let toastContainer = null;

  /**
   * Display a brief toast notification at the bottom-right of the viewport.
   * The toast slides in, auto-dismisses after `duration` ms, and slides out.
   *
   * Styled with `--bg-tertiary` background, `--border-color` border,
   * and a left `--accent-color` accent stripe.
   *
   * @param {string} message  — The text to display.
   * @param {number} [duration=3000] — Auto-dismiss delay in milliseconds.
   */
  function showToast(message, duration = 3000) {
    // Lazy-create the container
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      toastContainer.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Trigger slide-in (reflow trick)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('visible');
      });
    });

    // Auto-dismiss
    setTimeout(() => {
      toast.classList.remove('visible');
      toast.classList.add('dismissing');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      // Safety net: remove even if transitionend never fires
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 500);
    }, duration);
  }

  // ──────────────────────────────────────────────
  // § 9. VOICE CHANNEL SIMULATION
  // ──────────────────────────────────────────────

  /**
   * Initialise voice channel click handlers.
   * On click: show a voice-connection indicator in the user panel
   * at the bottom of the channel sidebar, including a disconnect button.
   */
  function initVoiceChannels() {
    const voiceChannels = document.querySelectorAll('.voice-channel');
    const userPanel     = document.querySelector('.user-panel');

    voiceChannels.forEach((vc) => {
      vc.addEventListener('click', () => {
        const channelName = vc.dataset.channel || vc.textContent.trim().replace(/^🔊\s*/, '');
        connectToVoice(channelName, userPanel);
      });
    });
  }

  /**
   * Show voice connection UI in the user panel.
   *
   * @param {string} channelName — Name of the voice channel joined.
   * @param {HTMLElement|null} userPanel — The `.user-panel` element.
   */
  function connectToVoice(channelName, userPanel) {
    if (!userPanel) return;

    // Remove any existing voice indicator
    const existing = userPanel.querySelector('.voice-indicator');
    if (existing) existing.remove();

    const indicator = document.createElement('div');
    indicator.className = 'voice-indicator fade-in';
    indicator.innerHTML = `
      <div class="voice-status">
        <span class="voice-status-icon">🔊</span>
        <span class="voice-status-text">Verbunden mit <strong>${escapeHTML(channelName)}</strong></span>
      </div>
      <button class="voice-disconnect" title="Trennen">✕</button>
    `;

    // Insert at top of user panel
    userPanel.insertBefore(indicator, userPanel.firstChild);

    // Trigger animation
    requestAnimationFrame(() => indicator.classList.add('visible'));

    // Disconnect handler
    const disconnectBtn = indicator.querySelector('.voice-disconnect');
    disconnectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      indicator.classList.remove('visible');
      indicator.classList.add('dismissing');
      indicator.addEventListener('transitionend', () => indicator.remove(), { once: true });
      setTimeout(() => { if (indicator.parentNode) indicator.remove(); }, 500);
      showToast(`Verbindung zu 🔊 ${channelName} getrennt`);
    });

    showToast(`Verbunden mit 🔊 ${channelName}`);
  }

  // ──────────────────────────────────────────────
  // § 10. MICRO-ANIMATIONS
  // ──────────────────────────────────────────────

  /**
   * Apply staggered fade-in animations to existing messages on page load.
   * Also adds a pulse animation class to the user's status dot.
   */
  function initMicroAnimations() {
    // Staggered message fade-in
    const messages = messagesContainer ? messagesContainer.querySelectorAll('.message') : [];
    messages.forEach((msg, i) => {
      msg.style.opacity = '0';
      msg.style.transform = 'translateY(8px)';
      setTimeout(() => {
        msg.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        msg.style.opacity = '1';
        msg.style.transform = 'translateY(0)';
      }, i * 80);
    });

    // Pulse animation on the user's status dot
    const statusDot = document.querySelector('.status-dot');
    if (statusDot) {
      statusDot.classList.add('pulse');
    }
  }

  /**
   * Inject required animation keyframes and utility classes into the document.
   * This keeps the JS file self-contained — no external CSS dependency for animations.
   */
  function injectAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ── Fade transition on messages container ── */
      @keyframes zeno-fade {
        0%   { opacity: 0.4; }
        100% { opacity: 1; }
      }
      .fade-transition {
        animation: zeno-fade 0.35s ease forwards;
      }

      /* ── Fade-in for new messages ── */
      .fade-in {
        opacity: 0;
        transform: translateY(8px);
        transition: opacity 0.35s ease, transform 0.35s ease;
      }
      .fade-in.visible {
        opacity: 1;
        transform: translateY(0);
      }

      /* ── Status dot pulse ── */
      @keyframes zeno-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(89, 168, 105, 0.5); }
        50%      { box-shadow: 0 0 0 4px rgba(89, 168, 105, 0); }
      }
      .status-dot.pulse {
        animation: zeno-pulse 2s ease-in-out infinite;
      }

      /* ── Server active indicator animation ── */
      @keyframes zeno-indicator-pop {
        0%   { transform: scaleY(0.4); }
        60%  { transform: scaleY(1.15); }
        100% { transform: scaleY(1); }
      }
      .server-icon.indicator-animate::before {
        animation: zeno-indicator-pop 0.3s ease forwards;
      }

      /* ── Members sidebar collapse transition ── */
      .members-sidebar {
        transition: width 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
        overflow: hidden;
      }
      .members-sidebar.collapsed {
        width: 0 !important;
        min-width: 0 !important;
        opacity: 0;
        margin: 0;
        padding: 0;
        border: none;
        pointer-events: none;
      }
      .chat-area {
        transition: flex 0.3s ease;
      }

      /* ── Toast notification system ── */
      .toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      }
      .toast {
        pointer-events: auto;
        background: var(--bg-tertiary, #1A1B1D);
        color: var(--text-primary, #DFE1E5);
        border: 1px solid var(--border-color, #393B40);
        border-left: 3px solid var(--accent-color, #3574F0);
        border-radius: 4px;
        padding: 10px 16px;
        font-family: 'Inter', 'Segoe UI', sans-serif;
        font-size: 13px;
        line-height: 1.4;
        transform: translateX(120%);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    opacity 0.3s ease;
        max-width: 360px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      }
      .toast.visible {
        transform: translateX(0);
        opacity: 1;
      }
      .toast.dismissing {
        transform: translateX(120%);
        opacity: 0;
      }

      /* ── Voice indicator ── */
      .voice-indicator {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 10px;
        background: var(--bg-tertiary, #1A1B1D);
        border: 1px solid var(--border-color, #393B40);
        border-radius: 4px;
        margin-bottom: 8px;
        font-size: 12px;
        color: var(--accent-success, #59A869);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .voice-indicator.dismissing {
        opacity: 0;
        transform: translateY(-8px);
      }
      .voice-status {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .voice-status-icon {
        font-size: 14px;
      }
      .voice-status-text {
        color: var(--text-primary, #DFE1E5);
        font-size: 12px;
      }
      .voice-status-text strong {
        color: var(--accent-success, #59A869);
      }
      .voice-disconnect {
        background: none;
        border: 1px solid var(--border-color, #393B40);
        color: var(--text-muted, #8A8A8A);
        border-radius: 4px;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 11px;
        transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
      }
      .voice-disconnect:hover {
        color: #E55050;
        border-color: #E55050;
        background: rgba(229, 80, 80, 0.1);
      }

      /* ── Category collapse ── */
      .category-header {
        cursor: pointer;
        user-select: none;
      }
      .category-header .category-arrow {
        display: inline-block;
        transition: transform 0.2s ease;
        font-size: 10px;
        margin-right: 4px;
      }
      .category-header.collapsed .category-arrow {
        transform: rotate(-90deg);
      }

      /* ── Modal overlay ── */
      #editor-modal {
        transition: opacity 0.25s ease;
      }
      #editor-modal.hidden {
        opacity: 0;
        pointer-events: none;
      }
      #editor-modal.open {
        opacity: 1;
        pointer-events: auto;
      }

      /* ── Editor output panel ── */
      .editor-output {
        font-family: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace;
        font-size: 12px;
        line-height: 1.6;
        color: var(--accent-success, #59A869);
        background: var(--bg-tertiary, #1A1B1D);
        border: 1px solid var(--border-color, #393B40);
        border-radius: 4px;
        padding: 10px 14px;
        margin-top: 12px;
        white-space: pre-wrap;
        transition: max-height 0.3s ease, opacity 0.3s ease;
      }
      .editor-output.hidden {
        display: none;
      }

      /* ── Smooth interactive transitions ── */
      .channel-item,
      .server-icon,
      .category-header,
      #toggle-members {
        transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
      }
      .channel-item:hover,
      .server-icon:hover {
        filter: brightness(1.15);
      }
      .channel-item:active,
      .server-icon:active {
        transform: scale(0.97);
      }
    `;
    document.head.appendChild(style);
  }

  // ──────────────────────────────────────────────
  // § 11. KEYBOARD SHORTCUTS
  // ──────────────────────────────────────────────

  /**
   * Helper function to convert Hex color values to RGBA with opacity.
   * Used to dynamically set transparent color stops for the radial gradient.
   *
   * @param {string} hex - The hex color string (e.g. "#3574F0").
   * @param {number} alpha - Opacity value between 0 and 1.
   * @returns {string} The RGBA color string.
   */
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  let stateCanvasColor = '#18191B';
  let stateGlowColor = '#3574F0';

  const darkPresets = [
    { color: '#18191B', title: 'Default Dark' },
    { color: '#0F1015', title: 'Deep Space' },
    { color: '#0F1411', title: 'Forest Green' },
    { color: '#150F1A', title: 'Nebula Purple' }
  ];

  const lightPresets = [
    { color: '#E3E4E8', title: 'Default Light' },
    { color: '#DCE2EC', title: 'Soft Blue' },
    { color: '#DCECE0', title: 'Soft Green' },
    { color: '#E5DCEC', title: 'Soft Lavender' }
  ];

  /**
   * Applies the background configuration (canvas background and radial glow)
   * to the document body and updates the customizer pickers and active states.
   *
   * @param {string} canvasColor - The main canvas background hex color.
   * @param {string} glowColor - The secondary radial glow hex color.
   * @param {boolean} isLight - Whether light-mode is active.
   */
  function applyBackgroundSettings(canvasColor, glowColor, isLight) {
    stateCanvasColor = canvasColor;
    stateGlowColor = glowColor;

    // Set inline styles on body
    document.body.style.setProperty('--bg-canvas', canvasColor);

    const opacity1 = isLight ? 0.12 : 0.18;
    const opacity2 = isLight ? 0.06 : 0.09;
    document.body.style.setProperty('--glow-color-1', hexToRgba(glowColor, opacity1));
    document.body.style.setProperty('--glow-color-2', hexToRgba(glowColor, opacity2));

    // Update input pickers
    const customCanvasInput = document.getElementById('custom-canvas-color');
    if (customCanvasInput) {
      customCanvasInput.value = canvasColor;
    }
    const customGlowInput = document.getElementById('custom-glow-color');
    if (customGlowInput) {
      customGlowInput.value = glowColor;
    }

    // Update active preset button highlight
    const presets = document.querySelectorAll('#color-presets .preset-btn, #settings-color-presets .preset-btn');
    let matched = false;
    presets.forEach(btn => {
      const btnColor = btn.dataset.color || '';
      if (btnColor.toUpperCase() === canvasColor.toUpperCase()) {
        btn.classList.add('active');
        matched = true;
      } else {
        btn.classList.remove('active');
      }
    });
    if (!matched) {
      presets.forEach(p => p.classList.remove('active'));
    }
  }

  /**
   * Dynamically updates the canvas background presets and color inputs
   * inside the customizer depending on the active theme mode.
   *
   * @param {boolean} isLight - Whether light-mode is currently active.
   */
  function updateCanvasPresets(isLight) {
    const presets = document.querySelectorAll('#color-presets .preset-btn');
    const list = isLight ? lightPresets : darkPresets;
    presets.forEach((btn, idx) => {
      if (list[idx]) {
        btn.dataset.color = list[idx].color;
        btn.style.backgroundColor = list[idx].color;
        btn.title = list[idx].title;
      }
    });
  }

  /**
   * Initialise the theme switcher button.
   * Uses modern View Transitions API with a custom feathered radial mask reveal
   * centered on the toggle button for a smooth transition.
   */
  function initThemeSwitching() {
    const themeBtn = document.getElementById('btn-theme');
    if (!themeBtn) return;

    themeBtn.addEventListener('click', (e) => {
      const rect = themeBtn.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // Set origin coordinates BEFORE starting the transition to prevent race conditions in Chrome
      document.documentElement.style.setProperty('--reveal-x', `${x}px`);
      document.documentElement.style.setProperty('--reveal-y', `${y}px`);

      // Calculate distance to the furthest corner of the screen
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const toggleClass = () => {
        const isLight = document.body.classList.toggle('light-mode');

        // Update presets list first so we have the new default colors
        updateCanvasPresets(isLight);

        // Always adapt canvas background and glow to match the theme default when switching
        const targetCanvasColor = isLight ? '#E3E4E8' : '#18191B';
        const targetGlowColor = '#3574F0';

        // Apply updated settings
        applyBackgroundSettings(targetCanvasColor, targetGlowColor, isLight);

        const iconEl = themeBtn.querySelector('.iconify');
        if (iconEl) {
          iconEl.setAttribute('data-icon', isLight ? 'mage:moon' : 'mage:sun');
          if (window.Iconify) {
            window.Iconify.scan(themeBtn);
          }
        } else {
          themeBtn.textContent = isLight ? '🌙' : '☀️';
        }
        themeBtn.setAttribute('title', isLight ? 'Dunkles Design' : 'Helles Design');
        showToast(isLight ? 'Helles Design aktiviert' : 'Dunkles Design aktiviert');
      };

      // Fallback for browsers without View Transitions support
      if (!document.startViewTransition) {
        toggleClass();
        return;
      }

      const transition = document.startViewTransition(toggleClass);

      // Clean up properties only after the transition has fully resolved (prevents 1-frame flicker)
      transition.finished.then(() => {
        document.documentElement.style.removeProperty('--reveal-radius');
        document.documentElement.style.removeProperty('--reveal-feather');
        document.documentElement.style.removeProperty('--reveal-x');
        document.documentElement.style.removeProperty('--reveal-y');
      });

      transition.ready.then(() => {
        const start = performance.now();
        const duration = 500; // 500ms duration for soft reveal

        const animateMask = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          
          // Cubic ease-out curve
          const ease = 1 - Math.pow(1 - progress, 3);
          const currentRadius = ease * endRadius;
          const featherWidth = 140; // 140px width for the soft blurred edge

          // Update CSS custom properties on root
          document.documentElement.style.setProperty('--reveal-radius', `${currentRadius}px`);
          document.documentElement.style.setProperty('--reveal-feather', `${currentRadius + featherWidth}px`);

          if (progress < 1) {
            requestAnimationFrame(animateMask);
          }
        };

        requestAnimationFrame(animateMask);
      });
    });
  }

  /**
   * Initialise the Canvas Customizer.
   * Handles preset clicks and custom color inputs (canvas color and glow color),
   * updating CSS variables dynamically in real-time.
   */
  function initCanvasCustomizer() {
    const settingsBtn = document.getElementById('btn-settings');
    const customizer = document.getElementById('canvas-customizer');
    const closeBtn = document.getElementById('btn-close-customizer');

    if (!settingsBtn || !customizer) return;

    // Toggle customizer panel visibility is handled by settings modal now

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        customizer.style.display = 'none';
      });
    }

    // Close when clicking outside of the customizer
    document.addEventListener('click', (e) => {
      if (customizer.style.display === 'flex' && !customizer.contains(e.target) && e.target !== settingsBtn) {
        customizer.style.display = 'none';
      }
    });

    // Preset Background Colors
    const presets = document.querySelectorAll('#color-presets .preset-btn');
    const customCanvasInput = document.getElementById('custom-canvas-color');
    
    presets.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = btn.dataset.color;
        const isLight = document.body.classList.contains('light-mode');
        applyBackgroundSettings(color, stateGlowColor, isLight);
      });
    });

    // Custom Canvas Color Picker
    if (customCanvasInput) {
      customCanvasInput.addEventListener('input', (e) => {
        const color = e.target.value;
        const isLight = document.body.classList.contains('light-mode');
        applyBackgroundSettings(color, stateGlowColor, isLight);
      });
    }

    // Custom Radial Glow Color Picker
    const customGlowInput = document.getElementById('custom-glow-color');
    if (customGlowInput) {
      customGlowInput.addEventListener('input', (e) => {
        const color = e.target.value;
        const isLight = document.body.classList.contains('light-mode');
        applyBackgroundSettings(stateCanvasColor, color, isLight);
      });
    }

    // Toggle Glassmorphism
    const glassToggle = document.getElementById('toggle-glassmorphism');
    if (glassToggle) {
      // Sync initial state
      if (glassToggle.checked) {
        document.body.classList.add('glass-effect');
      } else {
        document.body.classList.remove('glass-effect');
      }

      glassToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          document.body.classList.add('glass-effect');
          showToast('Milchglas-Effekt aktiviert');
        } else {
          document.body.classList.remove('glass-effect');
          showToast('Milchglas-Effekt deaktiviert');
        }
      });
    }

    // Initialize preset colors based on current mode on load
    const isInitialLight = document.body.classList.contains('light-mode');
    stateCanvasColor = isInitialLight ? '#E3E4E8' : '#18191B';
    stateGlowColor = '#3574F0';

    updateCanvasPresets(isInitialLight);
    applyBackgroundSettings(stateCanvasColor, stateGlowColor, isInitialLight);
  }

  // Helper open/close modal to add hidden/visible classes with transition support
  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  /**
   * Initialise the Settings Modal tab switching and controls.
   */
  function initSettingsModal() {
    const settingsBtn = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('btn-close-settings');
    const saveByosBtn = document.getElementById('btn-save-byos');
    const copyKeyBtn = document.getElementById('btn-copy-pubkey');
    const pairingBtn = document.getElementById('btn-show-pairing');

    if (!settingsModal) return;

    // Open settings modal
    if (settingsBtn) {
      settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Hide the old floating customizer if open
        const customizer = document.getElementById('canvas-customizer');
        if (customizer) customizer.style.display = 'none';

        openModal(settingsModal);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(settingsModal));
    }

    // Modal click backdrop to close
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        closeModal(settingsModal);
      }
    });

    // Tab Switching inside settings
    const navItems = settingsModal.querySelectorAll('.settings-nav-item');
    const tabContents = settingsModal.querySelectorAll('.settings-tab-content');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        tabContents.forEach(c => c.classList.add('hidden'));

        item.classList.add('active');
        const tabId = `tab-${item.dataset.tab}`;
        const activeTab = document.getElementById(tabId);
        if (activeTab) activeTab.classList.remove('hidden');

        // If appearance tab is opened, synchronize the canvas controls!
        if (item.dataset.tab === 'appearance') {
          syncAppearanceTab();
        }
      });
    });

    // Copy public key
    if (copyKeyBtn) {
      copyKeyBtn.addEventListener('click', () => {
        const pubKey = settingsModal.querySelector('.key-display').textContent.trim();
        navigator.clipboard.writeText(pubKey).then(() => {
          showToast('Public Key kopiert!');
        });
      });
    }

    // Save BYOS
    if (saveByosBtn) {
      saveByosBtn.addEventListener('click', () => {
        const provider = document.getElementById('byos-provider').value;
        showToast(`Verbindung zu ${provider === 'nextcloud' ? 'Nextcloud' : 'AWS S3'} hergestellt und gespeichert!`);
        closeModal(settingsModal);
      });
    }

    // Show pairing code dialog
    if (pairingBtn) {
      pairingBtn.addEventListener('click', () => {
        showToast('Kopplungs-QR-Code generiert (3-Stufen-Modell)');
      });
    }

    // Helper to sync appearance tab pickers with state variables
    function syncAppearanceTab() {
      const isLight = document.body.classList.contains('light-mode');
      
      const canvasInput = document.getElementById('settings-canvas-color');
      if (canvasInput) canvasInput.value = stateCanvasColor;

      const glowInput = document.getElementById('settings-glow-color');
      if (glowInput) glowInput.value = stateGlowColor;

      const glassCheck = document.getElementById('settings-toggle-glass');
      if (glassCheck) glassCheck.checked = document.body.classList.contains('glass-effect');

      // Setup preset buttons inside settings
      const settingsPresetsContainer = document.getElementById('settings-color-presets');
      if (settingsPresetsContainer) {
        settingsPresetsContainer.innerHTML = '';
        const list = isLight ? lightPresets : darkPresets;
        list.forEach(item => {
          const btn = document.createElement('button');
          btn.className = `preset-btn ${stateCanvasColor.toUpperCase() === item.color.toUpperCase() ? 'active' : ''}`;
          btn.style.backgroundColor = item.color;
          btn.title = item.title;
          btn.addEventListener('click', () => {
            applyBackgroundSettings(item.color, stateGlowColor, isLight);
            syncAppearanceTab();
          });
          settingsPresetsContainer.appendChild(btn);
        });
      }
    }

    // Wire up customizer controls inside settings appearance tab
    const canvasInput = document.getElementById('settings-canvas-color');
    if (canvasInput) {
      canvasInput.addEventListener('input', (e) => {
        const isLight = document.body.classList.contains('light-mode');
        applyBackgroundSettings(e.target.value, stateGlowColor, isLight);
        syncAppearanceTab();
      });
    }

    const glowInput = document.getElementById('settings-glow-color');
    if (glowInput) {
      glowInput.addEventListener('input', (e) => {
        const isLight = document.body.classList.contains('light-mode');
        applyBackgroundSettings(stateCanvasColor, e.target.value, isLight);
        syncAppearanceTab();
      });
    }

    const glassCheck = document.getElementById('settings-toggle-glass');
    if (glassCheck) {
      glassCheck.addEventListener('change', (e) => {
        const toggleCanvasGlass = document.getElementById('toggle-glassmorphism');
        if (toggleCanvasGlass) {
          toggleCanvasGlass.checked = e.target.checked;
          toggleCanvasGlass.dispatchEvent(new Event('change'));
        }
      });
    }
  }

  // Profile Modal Card elements
  const profileModal = document.getElementById('profile-modal');
  const closeProfileBtn = document.getElementById('btn-close-profile');
  const profileDmBtn = document.getElementById('btn-profile-dm');
  const profileVerifyBtn = document.getElementById('btn-profile-verify');

  /**
   * Opens the profile modal card and populates it with user details.
   */
  function openProfileCard(user) {
    if (!profileModal) return;

    const avatarEl = document.getElementById('profile-card-avatar');
    const nameEl = document.getElementById('profile-card-name');
    const roleEl = document.getElementById('profile-card-role');
    const statusEl = document.getElementById('profile-card-status');
    const fingerprintEl = document.getElementById('profile-card-fingerprint');

    // Fill member data
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) {
      roleEl.textContent = user.role.toUpperCase();
      roleEl.className = 'profile-card-role';
      if (user.roleColor) {
        roleEl.style.color = `var(--accent-${user.roleColor}, #3574F0)`;
        roleEl.style.backgroundColor = `rgba(from var(--accent-${user.roleColor}, #3574F0) r g b / 0.15)`;
      } else {
        roleEl.style.color = 'var(--accent-color)';
        roleEl.style.backgroundColor = 'rgba(53, 116, 240, 0.15)';
      }
    }
    if (avatarEl) {
      avatarEl.textContent = user.avatar;
      avatarEl.className = `profile-card-avatar ${user.avatarColor || 'blue'}`;
      if (user.bgColor) {
        avatarEl.style.backgroundColor = user.bgColor;
      } else {
        avatarEl.style.backgroundColor = '';
      }
    }
    if (statusEl) statusEl.textContent = user.status || '';
    if (fingerprintEl) fingerprintEl.textContent = user.fingerprint || '0x00000000000000000000';

    openModal(profileModal);
  }

  /**
   * Initialise the Profile Modal actions (own profile and member list profiles).
   */
  function initProfileModals() {
    if (closeProfileBtn) {
      closeProfileBtn.addEventListener('click', () => closeModal(profileModal));
    }

    // Modal click backdrop to close
    if (profileModal) {
      profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) {
          closeModal(profileModal);
        }
      });
    }

    if (profileDmBtn) {
      profileDmBtn.addEventListener('click', () => {
        closeModal(profileModal);
        const targetName = document.getElementById('profile-card-name').textContent;
        showToast(`Direktnachrichtenkanal mit ${targetName} geöffnet`);
      });
    }

    if (profileVerifyBtn) {
      profileVerifyBtn.addEventListener('click', () => {
        showToast('Kryptografische Signatur verifiziert – Identität bestätigt ✓');
      });
    }

    // 1. Open own profile on click in footer
    const userPanel = document.getElementById('user-panel');
    if (userPanel) {
      const userInfo = userPanel.querySelector('.user-info');
      if (userInfo) {
        userInfo.style.cursor = 'pointer';
        userInfo.addEventListener('click', () => {
          openProfileCard({
            name: 'CipherNaut',
            avatar: 'C',
            avatarColor: 'purple',
            bgColor: 'var(--accent-purple, #9B6BDF)',
            role: 'Unterstützer',
            roleColor: 'warning',
            status: '"Zeno verschlüsselt meine Daten."',
            fingerprint: '0xA3F9D1E8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890'
          });
        });
      }
    }

    // 2. Open member profiles on click in sidebar
    const memberItems = document.querySelectorAll('.member-item');
    memberItems.forEach(item => {
      item.addEventListener('click', () => {
        const username = item.dataset.user;
        const avatarEl = item.querySelector('.member-avatar');
        const roleGroup = item.closest('.member-role-group');
        const role = roleGroup ? roleGroup.dataset.role : 'Entwickler';

        // Custom status & fingerprint mapping for mock profiles
        const mockProfiles = {
          'MaxShield': {
            status: '"Latenz-Optimierung läuft..."',
            fingerprint: '0x8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890BCDEF12',
            avatarColor: 'blue',
            roleColor: 'blue'
          },
          'LenaCrypt': {
            status: '"Opus-Streams & SFrame standardisiert."',
            fingerprint: '0x2C3D4E5F67890BCDEF1234567890ABCDEF123456',
            avatarColor: 'green',
            roleColor: 'green'
          },
          'CipherNaut': {
            status: '"Zeno verschlüsselt meine Daten."',
            fingerprint: '0xA3F9D1E8B2C4F6A0C7D8E9F0A1B2C3D4E5F67890',
            avatarColor: 'purple',
            roleColor: 'warning'
          },
          'ZenoBot': {
            status: '"Typisierter RPC-Brückenwächter."',
            fingerprint: '0x5F67890BCDEF1234567890ABCDEF1234567890AB',
            avatarColor: 'orange',
            roleColor: 'warning'
          },
          'DarkNode': {
            status: '"Offline - Tor relay ist online."',
            fingerprint: '0xBCDEF1234567890ABCDEF1234567890ABCDEF123',
            avatarColor: 'gray',
            roleColor: 'muted'
          },
          'QuantumLeap': {
            status: '"Suche post-quantum Signaturen..."',
            fingerprint: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
            avatarColor: 'gray',
            roleColor: 'muted'
          }
        };

        const mock = mockProfiles[username] || { status: 'Kein Status gesetzt', fingerprint: '0x0000000000000000000000000000000000000000', avatarColor: 'blue', roleColor: 'blue' };

        openProfileCard({
          name: username,
          avatar: avatarEl ? avatarEl.textContent.trim() : username[0],
          avatarColor: mock.avatarColor,
          role: role === 'entwickler' ? 'Entwickler' : (role === 'bots' ? 'Bot' : 'Offline'),
          roleColor: mock.roleColor,
          status: mock.status,
          fingerprint: mock.fingerprint
        });
      });
    });
  }

  /**
   * Initialise the microphone and deafen toggle buttons.
   */
  function initUserControls() {
    const micBtn = document.getElementById('btn-mic');
    const deafenBtn = document.getElementById('btn-deafen');

    if (micBtn) {
      micBtn.addEventListener('click', () => {
        const isMuted = micBtn.classList.toggle('active');
        showToast(isMuted ? 'Mikrofon stummgeschaltet' : 'Mikrofon aktiviert');
      });
    }

    if (deafenBtn) {
      deafenBtn.addEventListener('click', () => {
        const isDeafened = deafenBtn.classList.toggle('active');
        showToast(isDeafened ? 'Audio stummgeschaltet' : 'Audio aktiviert');
      });
    }
  }

  /**
   * Register global keyboard shortcuts:
   * - **Escape**: close any open modal.
   * - **Ctrl+K**: focus the search (message input as placeholder).
   */
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Escape → close modal
      if (e.key === 'Escape') {
        closeEditorModal();
        closeModal(document.getElementById('settings-modal'));
        closeModal(document.getElementById('profile-modal'));
      }

      // Ctrl+K → focus search / message input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (messageInput) {
          messageInput.focus();
        }
      }
    });
  }

  // ──────────────────────────────────────────────
  // § INIT — Bootstrap everything
  // ──────────────────────────────────────────────

  /**
   * Master initialisation: wires up all interactive features.
   * Called once when DOMContentLoaded fires.
   */
  function init() {
    injectAnimationStyles();       // § 10  — inject CSS keyframes
    initChannelSwitching();        // § 1
    initServerSwitching();         // § 2
    initCodeBlockInteractions();   // § 3
    initMembersToggle();           // § 5
    initCategoryCollapse();        // § 6
    initMessageInput();            // § 7
    initVoiceChannels();           // § 9
    initMicroAnimations();         // § 10
    initThemeSwitching();          // Setup feathered theme reveal
    initCanvasCustomizer();        // Setup canvas customizer
    initSettingsModal();           // Setup Settings page modal
    initProfileModals();           // Setup User Profile popouts
    initUserControls();            // Setup mic/deafen user controls
    initKeyboardShortcuts();       // § 11
  }

  init();
});
