/**
 * Belgian University & Visa AI Research Agent
 * Powered by Groq API with # mention popover, official Belgian legal citations, and resizable window.
 */

import { UNIVERSITIES, BELGIUM_DOMAINS, GERMANY_DOMAINS, SAMPLE_QUESTIONS } from './data.js';

const DEFAULT_GROQ_KEY = "";
const PRIMARY_MODEL = "openai/gpt-oss-120b";
const FALLBACK_MODELS = ["openai/gpt-oss-20b", "qwen/qwen3.8-27b"];

export class BelgiumAiAgent {
  constructor(options = {}) {
    this.apiKey = localStorage.getItem("bmp_groq_key") || DEFAULT_GROQ_KEY;
    this.model = localStorage.getItem("bmp_groq_model") || PRIMARY_MODEL;
    this.activeUniversity = null;
    this.threads = this.loadThreads();
    this.activeThreadId = this.loadActiveThreadId();
    this.isOpen = false;
    this.isMaximized = false;
    this.isMinimized = false;
    this.isLoading = false;

    this.initElements();
    this.bindEvents();
    this.renderCurrentThread();
  }

  initElements() {
    // Check if container already exists
    let container = document.getElementById("aiAgentContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "aiAgentContainer";
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <!-- Floating Trigger Button -->
      <button id="aiAgentTrigger" class="ai-trigger-btn" aria-label="Open AI Research Agent" title="Ask AI about Belgian Universities, Fees &amp; Visa">
        <span class="ai-trigger-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/>
          </svg>
        </span>
        <span class="ai-trigger-text">AI Research Agent</span>
        <span class="ai-trigger-badge"># Mention</span>
      </button>

      <!-- Resizable AI Window -->
      <div id="aiAgentWindow" class="ai-window hidden">
        <div class="ai-header" id="aiDragHeader">
          <div class="ai-header-title">
            <span class="ai-bot-avatar">✦</span>
            <div>
              <div class="ai-title-row">
                <strong>Belgium Research Assistant</strong>
                <span class="ai-model-tag" id="aiModelBadge">${this.model.replace("openai/", "")}</span>
              </div>
              <span class="ai-subtitle">Official Legal Proof &amp; Direct Citations</span>
            </div>
          </div>
          <div class="ai-header-actions">
            <button class="ai-win-btn" id="aiSettingsBtn" title="AI Settings">⚙</button>
            <button class="ai-win-btn" id="aiMinimizeBtn" title="Minimize Window">🗕</button>
            <button class="ai-win-btn" id="aiMaximizeBtn" title="Maximize Window">⤢</button>
            <button class="ai-win-btn ai-close" id="aiCloseBtn" title="Close">✕</button>
          </div>
        </div>

        <!-- Chat Threads Toolbar -->
        <div class="ai-threads-bar">
          <button class="ai-threads-toggle-btn" id="aiThreadsToggleBtn" title="Switch or manage saved chats">
            <span class="ai-thread-icon">💬</span>
            <span class="ai-thread-current-title" id="aiActiveThreadTitle">New Chat</span>
            <span class="ai-thread-count-badge" id="aiThreadCountBadge">1</span>
            <span class="ai-thread-arrow">▾</span>
          </button>
          <div class="ai-thread-actions-bar">
            <button class="ai-thread-btn" id="aiRenameChatBtn" title="Rename this chat">✏️</button>
            <button class="ai-thread-btn" id="aiDeleteChatBtn" title="Delete this chat">🗑️</button>
            <button class="ai-thread-btn ai-new-chat-btn" id="aiNewChatBtn" title="Start a new chat">
              <span>+ New Chat</span>
            </button>
          </div>
        </div>

        <!-- Saved Chats Drawer / History Dropdown -->
        <div class="ai-threads-drawer hidden" id="aiThreadsDrawer">
          <div class="ai-drawer-header">
            <span>Saved Chat Sessions</span>
            <button class="ai-thread-btn ai-new-chat-btn" id="aiDrawerNewChatBtn">+ New</button>
          </div>
          <div class="ai-threads-list" id="aiThreadsList">
            <!-- Saved threads injected here -->
          </div>
        </div>

        <!-- Active University Context Chip -->
        <div id="aiActiveContextBar" class="ai-context-bar hidden">
          <span class="ai-ctx-label">Context:</span>
          <span class="ai-ctx-chip" id="aiCtxChip">
            <span id="aiCtxName">UCLouvain</span>
            <button id="aiClearCtxBtn" title="Remove context">✕</button>
          </span>
        </div>

        <!-- Chat History -->
        <div class="ai-chat-body" id="aiChatBody">
          <!-- Messages will be injected here -->
        </div>

        <!-- Mention Popover for # -->
        <div class="ai-mention-popover hidden" id="aiMentionPopover">
          <div class="ai-mention-header">
            <span>Select University / Topic</span>
            <small>Use ↑ ↓ keys or click</small>
          </div>
          <div class="ai-mention-list" id="aiMentionList"></div>
        </div>

        <!-- Suggested Chips -->
        <div class="ai-suggestions" id="aiSuggestions">
          <!-- Suggested prompt chips -->
        </div>

        <!-- Input Area -->
        <div class="ai-input-area" id="aiInputArea">
          <div class="ai-input-box" id="aiInputBox">
            <textarea
              id="aiChatInput"
              rows="2"
              placeholder="Ask a question or type '#' to mention a university..."
              aria-label="Message AI Agent"
            ></textarea>
            <div class="ai-input-actions">
              <button id="aiExpandInputBtn" class="ai-input-tool-btn" title="Expand / collapse prompt box (see full prompt)" aria-label="Expand prompt">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </button>
              <button id="aiSendBtn" class="ai-send-btn" title="Send message (Enter)">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
          <div class="ai-footer-note">
            <span>Tip: Type <b>#</b> to tag any university. Shift+Enter for new line.</span>
          </div>
        </div>

        <!-- 8-Directional Resize Handles -->
        <div class="ai-resize-edge ai-resize-n" data-dir="n" title="Resize"></div>
        <div class="ai-resize-edge ai-resize-s" data-dir="s" title="Resize"></div>
        <div class="ai-resize-edge ai-resize-w" data-dir="w" title="Resize"></div>
        <div class="ai-resize-edge ai-resize-e" data-dir="e" title="Resize"></div>
        <div class="ai-resize-corner ai-resize-nw" data-dir="nw" title="Resize"></div>
        <div class="ai-resize-corner ai-resize-ne" data-dir="ne" title="Resize"></div>
        <div class="ai-resize-corner ai-resize-sw" data-dir="sw" title="Resize"></div>
        <div class="ai-resize-corner ai-resize-se" data-dir="se" title="Resize"></div>
      </div>

      <!-- Settings Modal -->
      <div id="aiSettingsModal" class="ai-settings-modal hidden">
        <div class="ai-settings-card">
          <div class="ai-settings-header">
            <h3>⚙️ AI Research Agent Settings</h3>
            <button class="ai-win-btn" id="aiCloseSettings">✕</button>
          </div>
          <div class="ai-settings-body">
            <label>
              <strong>Groq API Key</strong>
              <input type="password" id="aiApiKeyInput" value="${this.apiKey || ''}" placeholder="gsk_..." />
              <small>Stored locally in your browser only. Get a free key at <a href="https://console.groq.com/keys" target="_blank" style="color:var(--pr);">console.groq.com</a>.</small>
            </label>
            <label style="margin-top: 12px;">
              <strong>Model</strong>
              <select id="aiModelSelect">
                <option value="openai/gpt-oss-120b" ${this.model === "openai/gpt-oss-120b" ? "selected" : ""}>openai/gpt-oss-120b (Recommended - Deep &amp; Fast)</option>
                <option value="openai/gpt-oss-20b" ${this.model === "openai/gpt-oss-20b" ? "selected" : ""}>openai/gpt-oss-20b (Ultra Fast)</option>
                <option value="qwen/qwen3.8-27b" ${this.model === "qwen/qwen3.8-27b" ? "selected" : ""}>qwen/qwen3.8-27b (High Accuracy)</option>
              </select>
            </label>
          </div>
          <div class="ai-settings-footer">
            <button class="btn" id="aiResetKey">Clear Key</button>
            <button class="btn p" id="aiSaveSettings">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    this.win = document.getElementById("aiAgentWindow");
    this.chatBody = document.getElementById("aiChatBody");
    this.input = document.getElementById("aiChatInput");
    this.sendBtn = document.getElementById("aiSendBtn");
    this.trigger = document.getElementById("aiAgentTrigger");
    this.mentionPopover = document.getElementById("aiMentionPopover");
    this.mentionList = document.getElementById("aiMentionList");
    this.contextBar = document.getElementById("aiActiveContextBar");
    this.ctxName = document.getElementById("aiCtxName");
    this.suggestions = document.getElementById("aiSuggestions");

    // Chat threads elements
    this.threadsToggleBtn = document.getElementById("aiThreadsToggleBtn");
    this.activeThreadTitleEl = document.getElementById("aiActiveThreadTitle");
    this.threadCountBadgeEl = document.getElementById("aiThreadCountBadge");
    this.threadsDrawer = document.getElementById("aiThreadsDrawer");
    this.threadsList = document.getElementById("aiThreadsList");
    this.newChatBtn = document.getElementById("aiNewChatBtn");
    this.drawerNewChatBtn = document.getElementById("aiDrawerNewChatBtn");
    this.renameChatBtn = document.getElementById("aiRenameChatBtn");
    this.deleteChatBtn = document.getElementById("aiDeleteChatBtn");
  }

  bindEvents() {
    this.trigger.addEventListener("click", () => this.toggleWindow());
    document.getElementById("aiCloseBtn").addEventListener("click", () => this.closeWindow());
    document.getElementById("aiMinimizeBtn").addEventListener("click", () => this.minimizeWindow());
    document.getElementById("aiMaximizeBtn").addEventListener("click", () => this.maximizeWindow());

    // Settings
    document.getElementById("aiSettingsBtn").addEventListener("click", () => {
      document.getElementById("aiSettingsModal").classList.remove("hidden");
    });
    document.getElementById("aiCloseSettings").addEventListener("click", () => {
      document.getElementById("aiSettingsModal").classList.add("hidden");
    });
    document.getElementById("aiSaveSettings").addEventListener("click", () => {
      const newKey = document.getElementById("aiApiKeyInput").value.trim();
      const newModel = document.getElementById("aiModelSelect").value;
      this.apiKey = newKey;
      if (newKey) {
        localStorage.setItem("bmp_groq_key", newKey);
      } else {
        localStorage.removeItem("bmp_groq_key");
      }
      this.model = newModel;
      localStorage.setItem("bmp_groq_model", newModel);
      document.getElementById("aiModelBadge").textContent = newModel.replace("openai/", "");
      document.getElementById("aiSettingsModal").classList.add("hidden");
    });
    document.getElementById("aiResetKey").addEventListener("click", () => {
      document.getElementById("aiApiKeyInput").value = "";
      this.apiKey = "";
      localStorage.removeItem("bmp_groq_key");
      document.getElementById("aiModelSelect").value = PRIMARY_MODEL;
    });

    // Clear context button
    document.getElementById("aiClearCtxBtn").addEventListener("click", () => {
      this.setUniversityContext(null);
    });

    // Send on button or Enter (without shift)
    this.sendBtn.addEventListener("click", () => this.handleSend());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        // If mention popover is open, select top
        if (!this.mentionPopover.classList.contains("hidden")) {
          const first = this.mentionList.querySelector(".ai-mention-item.active") || this.mentionList.querySelector(".ai-mention-item");
          if (first) {
            first.click();
            return;
          }
        }
        this.handleSend();
      } else if (e.key === "Escape") {
        this.mentionPopover.classList.add("hidden");
      }
    });

    // Mention trigger '#' on input
    this.input.addEventListener("input", (e) => {
      this.autoResizeInput();
      this.handleMentionTrigger();
    });

    // Make window draggable by header
    this.setupDraggable();
    // Setup resize handle
    this.setupResizable();

    // Chat Threads & Sessions Controls
    this.threadsToggleBtn.addEventListener("click", () => this.toggleThreadsDrawer());
    this.newChatBtn.addEventListener("click", () => this.createNewChat());
    this.drawerNewChatBtn.addEventListener("click", () => this.createNewChat());
    this.renameChatBtn.addEventListener("click", () => this.renameCurrentChat());
    this.deleteChatBtn.addEventListener("click", () => this.deleteCurrentChat());

    // Expand/Collapse prompt input button
    const expandBtn = document.getElementById("aiExpandInputBtn");
    const inputBox = document.getElementById("aiInputBox");
    if (expandBtn && inputBox) {
      expandBtn.addEventListener("click", () => {
        const isExp = inputBox.classList.toggle("expanded");
        expandBtn.title = isExp ? "Collapse prompt box" : "Expand prompt box (see full prompt)";
        expandBtn.innerHTML = isExp ? `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/>
          </svg>
        ` : `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
          </svg>
        `;
        if (isExp) {
          this.input.style.height = "180px";
        } else {
          this.autoResizeInput();
        }
        this.input.focus();
      });
    }

    // Populate suggested prompts
    this.renderSuggestions();
  }

  autoResizeInput() {
    const inputBox = document.getElementById("aiInputBox");
    if (inputBox && inputBox.classList.contains("expanded")) return;
    this.input.style.height = "auto";
    this.input.style.height = Math.max(48, Math.min(this.input.scrollHeight, 150)) + "px";
  }

  handleMentionTrigger() {
    const text = this.input.value;
    const cursorPos = this.input.selectionStart;
    const beforeCursor = text.slice(0, cursorPos);
    const hashIndex = beforeCursor.lastIndexOf("#");

    if (hashIndex !== -1 && !/\s/.test(beforeCursor.slice(hashIndex + 1))) {
      const query = beforeCursor.slice(hashIndex + 1).toLowerCase();
      this.showMentionPopover(query, hashIndex);
    } else {
      this.mentionPopover.classList.add("hidden");
    }
  }

  showMentionPopover(query, hashIndex) {
    const matched = UNIVERSITIES.filter(u =>
      u.u.toLowerCase().includes(query) ||
      u.name.toLowerCase().includes(query) ||
      u.t.toLowerCase().includes(query) ||
      u.c.toLowerCase().includes(query) ||
      (u.country && u.country.toLowerCase().includes(query)) ||
      (u.tags && u.tags.some(t => t.toLowerCase().includes(query)))
    );

    if (matched.length === 0) {
      this.mentionPopover.classList.add("hidden");
      return;
    }

    const germanUnis = matched.filter(u => u.country === "Germany");
    const belgianUnis = matched.filter(u => u.country === "Belgium");
    const otherUnis = matched.filter(u => u.country !== "Germany" && u.country !== "Belgium");

    let html = "";

    const renderItem = (u) => `
      <div class="ai-mention-item" data-id="${u.id}">
        <div class="ai-mention-top">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:13px;">${u.country === 'Germany' ? '🇩🇪' : u.country === 'Belgium' ? '🇧🇪' : '🇪🇺'}</span>
            <b>${u.u}</b>
          </div>
          <span class="ai-mention-fee ${u.cl}">${u.pill}</span>
        </div>
        <div class="ai-mention-title">${u.t} · ${u.c} (${u.appRoute || 'Direct'})</div>
      </div>
    `;

    if (germanUnis.length > 0) {
      html += `<div class="ai-mention-group-header">🇩🇪 Germany Programs (${germanUnis.length})</div>`;
      html += germanUnis.map(renderItem).join("");
    }
    if (belgianUnis.length > 0) {
      html += `<div class="ai-mention-group-header">🇧🇪 Belgium Programs (${belgianUnis.length})</div>`;
      html += belgianUnis.map(renderItem).join("");
    }
    if (otherUnis.length > 0) {
      html += `<div class="ai-mention-group-header">🇪🇺 European Joint &amp; Other (${otherUnis.length})</div>`;
      html += otherUnis.map(renderItem).join("");
    }

    this.mentionList.innerHTML = html;

    // Set first item active
    const firstItem = this.mentionList.querySelector(".ai-mention-item");
    if (firstItem) firstItem.classList.add("active");

    this.mentionList.querySelectorAll(".ai-mention-item").forEach(item => {
      item.addEventListener("click", () => {
        const id = parseInt(item.dataset.id, 10);
        const uni = UNIVERSITIES.find(u => u.id === id);
        if (uni) {
          this.setUniversityContext(uni);
          // Replace query with university tag
          const text = this.input.value;
          const cursorPos = this.input.selectionStart;
          const before = text.slice(0, hashIndex);
          const after = text.slice(cursorPos);
          this.input.value = `${before}#[${uni.country === 'Germany' ? '🇩🇪 ' : '🇧🇪 '}${uni.u}: ${uni.t}] ${after}`;
          this.input.focus();
        }
        this.mentionPopover.classList.add("hidden");
      });
    });

    this.mentionPopover.classList.remove("hidden");
  }

  setUniversityContext(uni) {
    this.activeUniversity = uni;
    const thread = this.getActiveThread();
    if (thread) {
      thread.activeUniversity = uni;
      this.saveThreads();
    }
    if (uni) {
      this.contextBar.classList.remove("hidden");
      this.ctxName.textContent = `${uni.u} (${uni.pill})`;
    } else {
      this.contextBar.classList.add("hidden");
    }
  }

  /* ==========================================================================
     Chat Threads & Sessions Management (Saved in localStorage)
     ========================================================================== */
  loadThreads() {
    try {
      const raw = localStorage.getItem("bmp_ai_threads_v2");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load saved AI chats:", e);
    }
    return [this.createBlankThread("New Chat")];
  }

  loadActiveThreadId() {
    const saved = localStorage.getItem("bmp_ai_active_thread_id");
    if (saved && this.threads.some(t => t.id === saved)) {
      return saved;
    }
    return this.threads[0]?.id || "";
  }

  saveThreads() {
    try {
      localStorage.setItem("bmp_ai_threads_v2", JSON.stringify(this.threads));
      localStorage.setItem("bmp_ai_active_thread_id", this.activeThreadId);
    } catch (e) {
      console.warn("Could not save AI chats to localStorage:", e);
    }
  }

  getActiveThread() {
    let thread = this.threads.find(t => t.id === this.activeThreadId);
    if (!thread) {
      thread = this.threads[0];
      if (!thread) {
        thread = this.createBlankThread("New Chat");
        this.threads.push(thread);
      }
      this.activeThreadId = thread.id;
    }
    return thread;
  }

  createBlankThread(title = "New Chat") {
    return {
      id: "t_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      title: title,
      messages: [],
      activeUniversity: null,
      updatedAt: Date.now()
    };
  }

  createNewChat() {
    const thread = this.createBlankThread("New Chat");
    this.threads.unshift(thread);
    this.activeThreadId = thread.id;
    this.saveThreads();
    this.renderCurrentThread();
    this.renderThreadsList();
    this.toggleThreadsDrawer(false);
    this.input.focus();
  }

  renameCurrentChat() {
    this.renameChat(this.activeThreadId);
  }

  renameChat(threadId) {
    const thread = this.threads.find(t => t.id === threadId);
    if (!thread) return;
    const current = thread.title || "New Chat";
    const newName = prompt("Enter a new title for this chat:", current);
    if (newName && newName.trim()) {
      thread.title = newName.trim();
      thread.updatedAt = Date.now();
      this.saveThreads();
      this.updateThreadsHeaderUI();
      this.renderThreadsList();
    }
  }

  deleteCurrentChat() {
    this.deleteChat(this.activeThreadId);
  }

  deleteChat(threadId) {
    const thread = this.threads.find(t => t.id === threadId);
    if (!thread) return;
    const ok = confirm(`Delete chat "${thread.title}"?`);
    if (!ok) return;

    if (this.threads.length <= 1) {
      // Just reset current thread if it's the only one
      thread.title = "New Chat";
      thread.messages = [];
      thread.activeUniversity = null;
      thread.updatedAt = Date.now();
    } else {
      this.threads = this.threads.filter(t => t.id !== threadId);
      if (this.activeThreadId === threadId) {
        this.activeThreadId = this.threads[0].id;
      }
    }

    this.saveThreads();
    this.renderCurrentThread();
    this.renderThreadsList();
  }

  switchChat(threadId) {
    if (this.activeThreadId === threadId) {
      this.toggleThreadsDrawer(false);
      return;
    }
    this.activeThreadId = threadId;
    this.saveThreads();
    this.renderCurrentThread();
    this.renderThreadsList();
    this.toggleThreadsDrawer(false);
  }

  toggleThreadsDrawer(forceState) {
    const isHidden = this.threadsDrawer.classList.contains("hidden");
    const nextHidden = typeof forceState === "boolean" ? !forceState : !isHidden;
    this.threadsDrawer.classList.toggle("hidden", nextHidden);
    this.threadsToggleBtn.classList.toggle("ai-threads-drawer-open", !nextHidden);
    if (!nextHidden) {
      this.renderThreadsList();
    }
  }

  updateThreadsHeaderUI() {
    const thread = this.getActiveThread();
    if (this.activeThreadTitleEl) {
      this.activeThreadTitleEl.textContent = thread.title || "New Chat";
      this.activeThreadTitleEl.title = thread.title || "New Chat";
    }
    if (this.threadCountBadgeEl) {
      this.threadCountBadgeEl.textContent = this.threads.length;
    }
  }

  renderCurrentThread() {
    const thread = this.getActiveThread();
    this.updateThreadsHeaderUI();
    this.chatBody.innerHTML = "";

    // Set university context if thread had one
    this.setUniversityContext(thread.activeUniversity || null);

    if (thread.messages && thread.messages.length > 0) {
      for (const m of thread.messages) {
        this.renderMessageElement(m.role, m.content);
      }
      this.scrollToBottom();
    } else {
      this.renderWelcome();
    }
    this.renderThreadsList();
  }

  renderThreadsList() {
    if (!this.threadsList) return;
    this.threadsList.innerHTML = this.threads.map(t => {
      const isActive = t.id === this.activeThreadId;
      const msgCount = (t.messages || []).length;
      const timeStr = new Date(t.updatedAt || Date.now()).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      });
      return `
        <div class="ai-thread-item ${isActive ? "active" : ""}" data-id="${t.id}">
          <div class="ai-thread-item-info">
            <span class="ai-thread-item-title">${this.escapeHtml(t.title || "New Chat")}</span>
            <span class="ai-thread-item-meta">${msgCount} messages · ${timeStr}</span>
          </div>
          <div class="ai-thread-item-actions">
            <button class="ai-thread-item-btn ai-item-rename" title="Rename chat" data-id="${t.id}">✏️</button>
            <button class="ai-thread-item-btn ai-item-delete" title="Delete chat" data-id="${t.id}">🗑️</button>
          </div>
        </div>
      `;
    }).join("");

    this.threadsList.querySelectorAll(".ai-thread-item").forEach(item => {
      item.addEventListener("click", (e) => {
        if (e.target.closest(".ai-thread-item-btn")) return;
        const id = item.dataset.id;
        this.switchChat(id);
      });
    });

    this.threadsList.querySelectorAll(".ai-item-rename").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.renameChat(btn.dataset.id);
      });
    });

    this.threadsList.querySelectorAll(".ai-item-delete").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteChat(btn.dataset.id);
      });
    });
  }

  escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  renderSuggestions() {
    this.suggestions.innerHTML = SAMPLE_QUESTIONS.map(q => `
      <button class="ai-suggest-chip" data-prompt="${q}">${q}</button>
    `).join("");

    this.suggestions.querySelectorAll(".ai-suggest-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        this.input.value = btn.dataset.prompt;
        this.handleSend();
      });
    });
  }

  toggleWindow() {
    if (this.isOpen) {
      this.closeWindow();
    } else {
      this.openWindow();
    }
  }

  openWindow(universityContext = null) {
    this.win.classList.remove("hidden");
    this.win.classList.remove("minimized");
    this.trigger.classList.add("active");
    this.isOpen = true;
    this.isMinimized = false;

    if (universityContext) {
      this.setUniversityContext(universityContext);
    }

    setTimeout(() => {
      this.input.focus();
      this.scrollToBottom();
    }, 100);
  }

  closeWindow() {
    this.win.classList.add("hidden");
    this.trigger.classList.remove("active");
    this.isOpen = false;
    this.toggleThreadsDrawer(false);
  }

  minimizeWindow() {
    this.isMinimized = !this.isMinimized;
    this.win.classList.toggle("minimized", this.isMinimized);
  }

  maximizeWindow() {
    this.isMaximized = !this.isMaximized;
    this.win.classList.toggle("maximized", this.isMaximized);
    document.getElementById("aiMaximizeBtn").textContent = this.isMaximized ? "❐" : "⤢";
  }

  renderWelcome() {
    const welcomeHtml = `
      <div class="ai-message ai-bot">
        <div class="ai-bubble">
          <p><strong>Belgian Master's &amp; Visa Research Assistant</strong></p>
          <p>Direct academic and consular advisor for Belgian English-taught Master's programs, university admissions, and visa solvency rules.</p>
          <p><b>Quick tips:</b></p>
          <ul>
            <li>Type <code>#</code> to tag any university to research course prerequisites or scholarship nomination deadlines.</li>
            <li>Ask about the <b>Wallonia ARES exemption</b> (€1,194/yr rate for developing country nationals).</li>
            <li>Get facts on the <b>Blocked Account</b> (€803/month living escrow) vs. <b>Annex 32 guarantor</b>.</li>
            <li>Verify Belgian Student Visa D documentation, HEC attestation, MOFA Apostille, and post-study Search Year rights.</li>
          </ul>
          <p style="margin-top: 8px; font-size: 12px; color: var(--tx-muted);">Select a prompt below or type your question:</p>
        </div>
      </div>
    `;
    this.chatBody.innerHTML = welcomeHtml;
  }

  async handleSend() {
    const query = this.input.value.trim();
    if (!query || this.isLoading) return;

    const thread = this.getActiveThread();

    // Auto-generate title on first user query if still default
    if (!thread.title || thread.title === "New Chat") {
      let cleanTitle = query.replace(/[#@\[\]*`]/g, "").trim();
      if (cleanTitle.length > 26) {
        cleanTitle = cleanTitle.slice(0, 24) + "...";
      }
      thread.title = cleanTitle || "Research Chat";
      this.updateThreadsHeaderUI();
      this.renderThreadsList();
    }

    // Append user message to thread state and UI
    thread.messages.push({ role: "user", content: query, timestamp: Date.now() });
    thread.updatedAt = Date.now();
    this.saveThreads();

    this.renderMessageElement("user", query);
    this.scrollToBottom();

    this.input.value = "";
    this.autoResizeInput();
    this.mentionPopover.classList.add("hidden");

    // Show loading indicator
    const loaderId = this.showLoading();

    try {
      const response = await this.queryGroq(query);
      this.removeLoading(loaderId);
      this.renderMessageElement("bot", response);
      this.scrollToBottom();

      thread.messages.push({ role: "bot", content: response, timestamp: Date.now() });
      thread.updatedAt = Date.now();
      this.saveThreads();
      this.renderThreadsList();
    } catch (err) {
      this.removeLoading(loaderId);
      const errMsg = `⚠️ **Error connecting to AI Research Agent:**\n\n${err.message}\n\nPlease check your Groq API key in ⚙️ Settings or try again.`;
      this.renderMessageElement("bot", errMsg);
      this.scrollToBottom();

      thread.messages.push({ role: "bot", content: errMsg, timestamp: Date.now() });
      this.saveThreads();
    }
  }

  renderMessageElement(role, text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `ai-message ai-${role}`;
    const bubble = document.createElement("div");
    bubble.className = "ai-bubble";

    if (role === "user") {
      bubble.textContent = text;
    } else {
      bubble.innerHTML = this.renderMarkdown(text);
    }

    msgDiv.appendChild(bubble);
    this.chatBody.appendChild(msgDiv);
  }

  appendMessage(role, text) {
    this.renderMessageElement(role, text);
    this.scrollToBottom();
  }

  showLoading() {
    this.isLoading = true;
    this.sendBtn.disabled = true;
    const loaderId = "loader_" + Date.now();
    const loaderDiv = document.createElement("div");
    loaderDiv.id = loaderId;
    loaderDiv.className = "ai-message ai-bot ai-loading";
    loaderDiv.innerHTML = `
      <div class="ai-bubble">
        <div class="ai-typing-indicator">
          <span></span><span></span><span></span>
        </div>
        <span class="ai-loading-label">Researching official Belgian decrees &amp; specs...</span>
      </div>
    `;
    this.chatBody.appendChild(loaderDiv);
    this.scrollToBottom();
    return loaderId;
  }

  removeLoading(loaderId) {
    this.isLoading = false;
    this.sendBtn.disabled = false;
    const el = document.getElementById(loaderId);
    if (el) el.remove();
  }

  scrollToBottom() {
    this.chatBody.scrollTop = this.chatBody.scrollHeight;
  }

  buildSystemPrompt() {
    const uniList = UNIVERSITIES.map(u => (
      `- [${u.country || "Belgium"}] ${u.u} (${u.name}), City: ${u.c}, Region/State: ${u.r}, Program: ${u.t}, Tuition: ${u.pill} (Standard non-EU: €${u.nonEuStandardFee || u.fee}/yr, Statutory/ARES: €${u.statutoryFee || u.fee}/yr), App Route: ${u.appRoute || "Direct"}, Status: ${u.appStatus || "Open"}, IELTS: ${u.iel} (band ${u.band || "none"}), German: ${u.germanReq || "None"}, GRE: ${u.gre ? "Required" : "Not Required"}, Math ECTS: ~${u.mathEcts || 30}, CS ECTS: ~${u.csEcts || 40}, Deadline: ${u.dl || "TBA"}. URL: ${u.url}`
    )).join("\n");

    const domains = `
    EUROPEAN HIGHER EDUCATION & VISA GROUND-TRUTH FACTS (BELGIUM & GERMANY):
    1. Germany Tuition-Free Higher Education:
       - 15 out of 16 German federal states charge €0 tuition for consecutive Master's degrees at public universities.
       - Students only pay a semester contribution (Semesterbeitrag) of ~€85 to €350, which almost always includes a free Semesterticket (unlimited regional train/bus transit).
       - Exception: Baden-Württemberg (e.g. University of Stuttgart, Freiburg) charges non-EU students €1,500/semester (€3,000/year).
       - uni-assist & VPD: Many German universities (TUM, Passau, etc.) require Vorprüfungsdokumentation (VPD) through uni-assist before direct application. Costs: €75 first uni, €30 each subsequent.
       - German Visa Solvency (Sperrkonto / Blocked Account): Statutory minimum €992/month = €11,904/academic year for 2026/2027 (via Expatrio, Fintiba, Coracle). Returned monthly upon arrival.
       - Post-Study Work Visa: 18-Month Jobseeker permit (Aufenthaltserlaubnis) with transition to EU Blue Card and fast-track PR in 21–27 months.
       - Student Work Rights: 140 full days or 280 half days per calendar year (up to 20 hours/week).

    2. Wallonia-Brussels Federation (ARES Exemption):
       - Legal Basis: Wallonia-Brussels Higher Education Decree on student assimilation.
       - Rule: Non-EU students who are nationals of developing countries (listed in the DAC/OECD list of ODA recipients, e.g. Pakistan) are exempt from the extra non-EU tuition surcharge of €4,175.
       - Cost: They pay the statutory base fee of approximately €835 to €1,194/year (2026-2027 full indexed rate is €1,194).
       - Applicable Universities: UCLouvain, University of Liège (ULiège), University of Namur (UNamur), Université libre de Bruxelles (ULB).

    3. Flemish Higher Education (Flanders):
       - Standard non-EEA tuition: €4,200 to €7,800/yr (Antwerp is €7,800/yr, VUB is ~€4,200–€5,800/yr, KU Leuven is ~€4,200–€7,000/yr).
       - Flemish Master Mind Scholarship (VLUHR): Award of €10,225/academic year + full tuition waiver (student pays only ~€139.40 - €145 registration fee). Requirements: 3.5+ CGPA and IELTS 7.0 or high 6.5.

    4. Erasmus Mundus Joint Masters:
       - Full scholarship: 100% tuition waiver + €1,400/month living stipend + insurance + travel allowance.
       - Programs: IMLEX (XR, Light & Graphics: KU Leuven + UEF + UJM + Toyohashi) and DEAI (Data Engineering & AI at ULB).

    5. Belgian Financial Solvency (Blocked Account vs. Annex 32):
       - Minimum Living Proof: €803/month (Article 60 statutory index) = ~€9,636 to €10,200 per academic year.
       - Blocked Account: Transferred to university escrow before visa, transferred BACK to student in monthly allowances of €803 upon arrival. LIVING MONEY, NOT tuition!
       - Annex 32: Financial guarantee signed by an EU resident earning above ~€2,000–€2,500 net/month after liabilities.

    6. ECTS Credit Hour Conversion:
       - 1 Pakistani/US semester credit hour = ~1.8 to 2.0 European ECTS.
       - 15 credit hours across Calculus, Linear Algebra, Diff Eq, Discrete Math, and Probability/Stats equals ~30 ECTS, fully satisfying university quantitative prerequisites!
    `;

    let activeContextText = "";
    if (this.activeUniversity) {
      activeContextText = `\nUSER IS CURRENTLY ASKING ABOUT: [${this.activeUniversity.country || "Belgium"}] ${this.activeUniversity.u} - ${this.activeUniversity.t}. Tailor your response with precise details for this specific program and university!`;
    }

    return `You are the Senior Academic & Consular Advisor for the EuroMasters AI Portal (Belgium & Germany).
Your job is to provide rigorous, accurate, fact-checked guidance for international students applying to accredited Master's programs across Belgium and Germany.

${domains}

AVAILABLE ACCREDITED UNIVERSITIES & MASTER'S PROGRAMS IN DATABASE:
${uniList}

${activeContextText}

CRITICAL RESPONSE GUIDELINES (STRICT CONCISENESS & PROPER FORMATTING):
1. MANDATORY BREVITY:
   - Always give SHORT, concise, and scannable answers.
   - Avoid conversational filler (do NOT say "Certainly!", "I hope this helps!", or "As an academic advisor..."). Start immediately with the answer.
   - Limit responses to 2 to 4 concise bullet points or short paragraphs maximum, unless explicitly asked for a long breakdown.
   - If the user asks for a short answer, summary, or bullet points, answer in 2-4 brief bullet points immediately with ZERO fluff.
2. CLEAN FORMATTING & STRUCTURE:
   - Use bold subheadings (### Heading) to divide topics cleanly.
   - Use compact bullet points (- Item) for sequential steps or requirements.
   - ALWAYS use Markdown Tables (| University | Tuition | Deadline |) when comparing numbers, fees, or universities.
   - Bold key numbers and terms (e.g., **€0 tuition**, **€1,194/year**, **€992/month**, **€803/month**, **30 ECTS**).
   - Never output walls of continuous text or giant paragraphs.
3. BRIEF CITATIONS:
   - Mention legal basis or official portal briefly in parentheses (e.g. *[DAAD / uni-assist 2026/27]* or *[ARES circular 2026/27]*).
4. If asked about fees, clearly separate TUITION from the BLOCKED ACCOUNT living expenses.
5. If asked about math credits, remind that 15 semester credit hours ≈ 30 ECTS (1 credit ≈ 2 ECTS).`;
  }

  async queryGroq(userQuery) {
    if (!this.apiKey) {
      throw new Error("No Groq API key configured. Click ⚙️ Settings (top-right of this chat) and enter your free API key from https://console.groq.com/keys.");
    }

    const systemPrompt = this.buildSystemPrompt();
    const thread = this.getActiveThread();

    // Contextual message history from current active thread (up to last 6 messages)
    const threadHistory = (thread.messages || [])
      .slice(-6)
      .map(m => ({ role: m.role === "bot" ? "assistant" : "user", content: m.content }));

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...threadHistory,
      { role: "user", content: userQuery }
    ];

    const modelsToTry = [this.model, ...FALLBACK_MODELS.filter(m => m !== this.model)];
    let lastError = null;

    for (const modelCandidate of modelsToTry) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelCandidate,
            messages: apiMessages,
            temperature: 0.2,
            max_tokens: 1200
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${response.status} from Groq API (${modelCandidate})`);
        }

        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (!reply) throw new Error("Empty response from AI model.");

        // If fallback succeeded, update current model tag
        if (modelCandidate !== this.model) {
          this.model = modelCandidate;
          localStorage.setItem("bmp_groq_model", modelCandidate);
          document.getElementById("aiModelBadge").textContent = modelCandidate.replace("openai/", "");
        }

        return reply;
      } catch (err) {
        console.warn(`Failed with model ${modelCandidate}:`, err);
        lastError = err;
      }
    }

    throw lastError || new Error("Failed to contact Groq API endpoint.");
  }

  /* ==========================================================================
     Robust Markdown Parser with Tables, Lists, Code, & Headings
     ========================================================================== */
  renderMarkdown(rawText) {
    if (!rawText) return "";

    // 1. Normalize line endings
    let src = rawText.replace(/\r\n/g, "\n");

    // 2. Extract and protect code blocks
    const codeBlocks = [];
    src = src.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      const escapedCode = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      codeBlocks.push(`
        <pre class="ai-code-block">
          <div class="ai-code-header"><span>${lang || "code"}</span></div>
          <code>${escapedCode}</code>
        </pre>
      `);
      return placeholder;
    });

    // 3. Escape HTML in regular text
    src = src
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 4. Parse block by block
    const lines = src.split("\n");
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Code block placeholder
      if (line.startsWith("__CODE_BLOCK_") && line.endsWith("__")) {
        const idx = parseInt(line.replace(/[^0-9]/g, ""), 10);
        blocks.push(codeBlocks[idx] || "");
        i++;
        continue;
      }

      // Markdown Table: line has pipes and next line is delimiter |---|
      if (line.includes("|") && i + 1 < lines.length && /^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(lines[i + 1])) {
        const headerLine = lines[i];
        const headers = headerLine.split("|").map(s => s.trim()).filter((s, idx, arr) => !(idx === 0 && s === "") && !(idx === arr.length - 1 && s === ""));

        const rows = [];
        i += 2; // skip header and delimiter lines

        while (i < lines.length && lines[i].trim().includes("|") && lines[i].trim() !== "") {
          const rowCells = lines[i].split("|").map(s => s.trim()).filter((s, idx, arr) => !(idx === 0 && s === "") && !(idx === arr.length - 1 && s === ""));
          rows.push(rowCells);
          i++;
        }

        let tableHtml = '<div class="ai-table-wrap"><table class="ai-table"><thead><tr>';
        headers.forEach(h => {
          tableHtml += `<th>${this.formatInline(h)}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        rows.forEach(r => {
          tableHtml += '<tr>';
          headers.forEach((_, cIdx) => {
            tableHtml += `<td>${this.formatInline(r[cIdx] || "")}</td>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table></div>';
        blocks.push(tableHtml);
        continue;
      }

      // Headings
      if (/^### (.*$)/.test(line)) {
        const title = line.replace(/^###\s+/, "");
        blocks.push(`<h5 class="ai-h5">${this.formatInline(title)}</h5>`);
        i++;
        continue;
      }
      if (/^## (.*$)/.test(line)) {
        const title = line.replace(/^##\s+/, "");
        blocks.push(`<h4 class="ai-h4">${this.formatInline(title)}</h4>`);
        i++;
        continue;
      }
      if (/^# (.*$)/.test(line)) {
        const title = line.replace(/^#\s+/, "");
        blocks.push(`<h3 class="ai-h3">${this.formatInline(title)}</h3>`);
        i++;
        continue;
      }

      // Blockquotes
      if (/^&gt;\s*(.*$)/.test(line)) {
        let bq = line.replace(/^&gt;\s*/, "");
        i++;
        while (i < lines.length && /^&gt;\s*(.*$)/.test(lines[i].trim())) {
          bq += " " + lines[i].trim().replace(/^&gt;\s*/, "");
          i++;
        }
        blocks.push(`<blockquote>${this.formatInline(bq)}</blockquote>`);
        continue;
      }

      // Bullet Lists
      if (/^[-*•]\s+(.*$)/.test(line)) {
        let listHtml = '<ul class="ai-ul">';
        while (i < lines.length && /^[-*•]\s+(.*$)/.test(lines[i].trim())) {
          const itemText = lines[i].trim().replace(/^[-*•]\s+/, "");
          listHtml += `<li>${this.formatInline(itemText)}</li>`;
          i++;
        }
        listHtml += '</ul>';
        blocks.push(listHtml);
        continue;
      }

      // Numbered Lists
      if (/^\d+\.\s+(.*$)/.test(line)) {
        let listHtml = '<ol class="ai-ol">';
        while (i < lines.length && /^\d+\.\s+(.*$)/.test(lines[i].trim())) {
          const itemText = lines[i].trim().replace(/^\d+\.\s+/, "");
          listHtml += `<li>${this.formatInline(itemText)}</li>`;
          i++;
        }
        listHtml += '</ol>';
        blocks.push(listHtml);
        continue;
      }

      // Blank line
      if (line === "") {
        i++;
        continue;
      }

      // Regular Paragraph (accumulate adjacent lines)
      let pText = line;
      i++;
      while (i < lines.length && lines[i].trim() !== "" &&
        !lines[i].trim().startsWith("#") &&
        !lines[i].trim().startsWith("-") &&
        !lines[i].trim().startsWith("*") &&
        !lines[i].trim().startsWith("•") &&
        !/^\d+\.\s+/.test(lines[i].trim()) &&
        !lines[i].trim().startsWith("&gt;") &&
        !lines[i].trim().includes("|") &&
        !lines[i].trim().startsWith("__CODE_BLOCK_")) {
        pText += " " + lines[i].trim();
        i++;
      }
      blocks.push(`<p>${this.formatInline(pText)}</p>`);
    }

    return blocks.join("");
  }

  formatInline(text) {
    if (!text) return "";
    return text
      // Bold & Italic
      .replace(/\*\*\*(.*?)\*\*\*/g, "<b><i>$1</i></b>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Markdown Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>');
  }

  setupDraggable() {
    const header = document.getElementById("aiDragHeader");
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.addEventListener("mousedown", (e) => {
      if (e.target.closest("button") || this.isMaximized) return;
      isDragging = true;
      const rect = this.win.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;

      // Ensure fixed pixel positioning
      this.win.style.bottom = "auto";
      this.win.style.right = "auto";
      this.win.style.left = `${initialLeft}px`;
      this.win.style.top = `${initialTop}px`;

      const onMouseMove = (ev) => {
        if (!isDragging) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const newLeft = Math.max(10, Math.min(window.innerWidth - rect.width - 10, initialLeft + dx));
        const newTop = Math.max(10, Math.min(window.innerHeight - rect.height - 10, initialTop + dy));
        this.win.style.left = `${newLeft}px`;
        this.win.style.top = `${newTop}px`;
      };

      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  }

  setupResizable() {
    const handles = this.win.querySelectorAll("[data-dir]");
    let isResizing = false;
    let currentDir = "";
    let startX, startY, startW, startH, startLeft, startTop;

    handles.forEach(handle => {
      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.isMaximized) return;

        isResizing = true;
        currentDir = handle.dataset.dir;

        const rect = this.win.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startW = rect.width;
        startH = rect.height;
        startLeft = rect.left;
        startTop = rect.top;

        // Anchor window to explicit pixel positions so resizing from top/left is stable
        this.win.style.bottom = "auto";
        this.win.style.right = "auto";
        this.win.style.left = `${startLeft}px`;
        this.win.style.top = `${startTop}px`;
        this.win.style.width = `${startW}px`;
        this.win.style.height = `${startH}px`;

        document.body.style.userSelect = "none";
        document.body.style.cursor = window.getComputedStyle(handle).cursor;

        const onMouseMove = (ev) => {
          if (!isResizing) return;
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;

          let newW = startW;
          let newH = startH;
          let newLeft = startLeft;
          let newTop = startTop;

          // Horizontal resizing
          if (currentDir.includes("e")) {
            newW = Math.max(340, Math.min(window.innerWidth - startLeft - 15, startW + dx));
          } else if (currentDir.includes("w")) {
            const proposedW = startW - dx;
            if (proposedW >= 340 && startLeft + dx >= 10) {
              newW = proposedW;
              newLeft = startLeft + dx;
            }
          }

          // Vertical resizing
          if (currentDir.includes("s")) {
            newH = Math.max(380, Math.min(window.innerHeight - startTop - 15, startH + dy));
          } else if (currentDir.includes("n")) {
            const proposedH = startH - dy;
            if (proposedH >= 380 && startTop + dy >= 10) {
              newH = proposedH;
              newTop = startTop + dy;
            }
          }

          this.win.style.width = `${newW}px`;
          this.win.style.height = `${newH}px`;
          this.win.style.left = `${newLeft}px`;
          this.win.style.top = `${newTop}px`;
        };

        const onMouseUp = () => {
          isResizing = false;
          document.body.style.userSelect = "";
          document.body.style.cursor = "";
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
    });
  }
}
