/**
 * Belgian University & Visa AI Research Agent
 * Powered by Groq API with # mention popover, official Belgian legal citations, and resizable window.
 */

import { UNIVERSITIES, BELGIUM_DOMAINS, SAMPLE_QUESTIONS } from './data.js';

const DEFAULT_GROQ_KEY = "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";
const PRIMARY_MODEL = "openai/gpt-oss-120b";
const FALLBACK_MODELS = ["openai/gpt-oss-20b", "qwen/qwen3.8-27b"];

export class BelgiumAiAgent {
  constructor(options = {}) {
    this.apiKey = localStorage.getItem("bmp_groq_key") || DEFAULT_GROQ_KEY;
    this.model = localStorage.getItem("bmp_groq_model") || PRIMARY_MODEL;
    this.activeUniversity = null;
    this.messages = [];
    this.isOpen = false;
    this.isMaximized = false;
    this.isMinimized = false;
    this.isLoading = false;

    this.initElements();
    this.bindEvents();
    this.renderWelcome();
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
        <div class="ai-input-area">
          <div class="ai-input-box">
            <textarea
              id="aiChatInput"
              rows="1"
              placeholder="Ask a question or type '#' to mention a university..."
              aria-label="Message AI Agent"
            ></textarea>
            <button id="aiSendBtn" class="ai-send-btn" title="Send message">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          <div class="ai-footer-note">
            <span>Tip: Type <b>#</b> to tag any university. Powered by Groq Ultra-Fast Inference.</span>
          </div>
        </div>

        <!-- Resize Handle (bottom-right) -->
        <div class="ai-resize-handle" id="aiResizeHandle"></div>
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
              <input type="password" id="aiApiKeyInput" value="${this.apiKey}" placeholder="gsk_..." />
              <small>Your key is stored locally in your browser only.</small>
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
            <button class="btn" id="aiResetKey">Reset to Default</button>
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
      if (newKey) {
        this.apiKey = newKey;
        localStorage.setItem("bmp_groq_key", newKey);
      }
      this.model = newModel;
      localStorage.setItem("bmp_groq_model", newModel);
      document.getElementById("aiModelBadge").textContent = newModel.replace("openai/", "");
      document.getElementById("aiSettingsModal").classList.add("hidden");
    });
    document.getElementById("aiResetKey").addEventListener("click", () => {
      document.getElementById("aiApiKeyInput").value = DEFAULT_GROQ_KEY;
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

    // Populate suggested prompts
    this.renderSuggestions();
  }

  autoResizeInput() {
    this.input.style.height = "auto";
    this.input.style.height = Math.min(this.input.scrollHeight, 120) + "px";
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
      u.t.toLowerCase().includes(query) ||
      u.c.toLowerCase().includes(query) ||
      u.tags.some(t => t.toLowerCase().includes(query))
    );

    if (matched.length === 0) {
      this.mentionPopover.classList.add("hidden");
      return;
    }

    this.mentionList.innerHTML = matched.map((u, i) => `
      <div class="ai-mention-item ${i === 0 ? "active" : ""}" data-id="${u.id}">
        <div class="ai-mention-top">
          <b>${u.u}</b>
          <span class="ai-mention-fee ${u.cl}">${u.pill}</span>
        </div>
        <div class="ai-mention-title">${u.t} · ${u.c}</div>
      </div>
    `).join("");

    this.mentionList.querySelectorAll(".ai-mention-item").forEach(item => {
      item.addEventListener("click", () => {
        const id = parseInt(item.dataset.id, 10);
        const uni = UNIVERSITIES.find(u => u.id === id);
        if (uni) {
          this.setUniversityContext(uni);
          // Replace query with university tag or clear hash
          const text = this.input.value;
          const cursorPos = this.input.selectionStart;
          const before = text.slice(0, hashIndex);
          const after = text.slice(cursorPos);
          this.input.value = `${before}#[${uni.u}: ${uni.t}] ${after}`;
          this.input.focus();
        }
        this.mentionPopover.classList.add("hidden");
      });
    });

    this.mentionPopover.classList.remove("hidden");
  }

  setUniversityContext(uni) {
    this.activeUniversity = uni;
    if (uni) {
      this.contextBar.classList.remove("hidden");
      this.ctxName.textContent = `${uni.u} (${uni.pill})`;
    } else {
      this.contextBar.classList.add("hidden");
    }
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

    // Append user message
    this.appendMessage("user", query);
    this.input.value = "";
    this.autoResizeInput();
    this.mentionPopover.classList.add("hidden");

    // Show loading indicator
    const loaderId = this.showLoading();

    try {
      const response = await this.queryGroq(query);
      this.removeLoading(loaderId);
      this.appendMessage("bot", response);
    } catch (err) {
      this.removeLoading(loaderId);
      this.appendMessage("bot", `⚠️ **Error connecting to AI Research Agent:**\n\n${err.message}\n\nPlease check your Groq API key in ⚙️ Settings or try again.`);
    }
  }

  appendMessage(role, text) {
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
    this.messages.push({ role, content: text });
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
        <span class="ai-loading-label">Researching official Belgian decrees &amp; university specs...</span>
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
      `- ${u.u} (${u.name}), City: ${u.c}, Region: ${u.r}, Program: ${u.t}, Tuition: ${u.pill} (Standard non-EU: €${u.nonEuStandardFee}/yr, ARES eligible: €${u.statutoryFee}/yr), Application fee: ${u.appFee}, IELTS: ${u.iel} (band ${u.band || "none"}), GRE: ${u.gre ? "Required" : "Not Required"}, Math requirement: ${u.mathReq} semester credits (~${u.mathEcts} ECTS), Deadline: ${u.dl || "TBA"}. URL: ${u.url}`
    )).join("\n");

    const domains = `
    BELGIAN HIGHER EDUCATION & VISA GROUND-TRUTH FACTS:
    1. Wallonia-Brussels Federation (ARES Exemption):
       - Legal Basis: Wallonia-Brussels Higher Education Decree on student assimilation.
       - Rule: Non-EU students who are nationals of developing countries (listed in the DAC/OECD list of ODA recipients and approved in the annual ARES circular) are exempt from the extra non-EU tuition surcharge of €4,175.
       - Cost: They pay the statutory base fee of approximately €835 to €1,194/year (2026-2027 full indexed rate is €1,194). Income-based waivers down to €0 or €374 exist upon application before Oct 31.
       - Applicable Universities: UCLouvain (Louvain-la-Neuve), University of Liège (ULiège), University of Namur (UNamur), Université libre de Bruxelles (ULB).
       - Pakistan was listed in the 2025-26 circular; applicants should verify the annual 2026-27 circular annex.

    2. Flemish Higher Education (Flanders):
       - Legal Basis: Codex Hoger Onderwijs.
       - Non-EEA tuition has been deregulated and indexed: University of Antwerp Master in CS is €7,800/yr (2026-27), VUB is ~€4,200 - €5,800/yr, KU Leuven is ~€4,200 - €7,000/yr, Hasselt is ~€2,699 - €3,900/yr.
       - Flemish Master Mind Scholarship (VLUHR): Award of €10,225/academic year + full tuition waiver (student pays only ~€139.40 - €145 registration fee). Requirements: 3.5+ CGPA and IELTS 7.0 or high 6.5. Candidates must be nominated by the university (host deadlines run Jan 15 - April 1).

    3. Erasmus Mundus Joint Masters:
       - Full scholarship: 100% tuition waiver + €1,400/month living stipend + insurance + travel allowance.
       - Programs: IMLEX (XR, Light & Graphics: KU Leuven + UEF + UJM + Toyohashi) and DEAI (Data Engineering & AI at ULB, successor to BDMA whose funding concluded in Oct 2026).

    4. Financial Solvency (Blocked Account vs. Annex 32):
       - Legal Basis: Article 60 of Belgian Aliens Act (Office des Étrangers / Dienst Vreemdelingenzaken).
       - Minimum Living Proof: €803/month (statutory index for 2025/2026/2027) = ~€9,636 to €10,200 per academic year.
       - Blocked Account: Transferred to university escrow before visa. Transferred BACK to student in monthly allowances of €803 upon arrival. This is LIVING MONEY, NOT tuition!
       - Annex 32 (Annexe 32 / Bijlage 32): Financial guarantee signed by an EU resident or high-income sponsor earning above ~€2,000–€2,500 net/month after liabilities.
       - Official scholarship letter above €803/month completely waives the blocked account.

    5. Visa D Processing (Pakistan -> Belgium):
       - Steps: 1) University Admission Letter, 2) HEC attestation + MOFA Apostille on Bachelor degree/transcript, 3) Proof of financial means (Blocked account / Annex 32), 4) Medical certificate by embassy-approved panel doctor, 5) Police character clearance (under 6 months old), 6) Administrative fee payment (~€246–€300 to Belgian Immigration Office), 7) Submission at Gerry's Visa Drop Box / Belgian Embassy Islamabad, 8) Registration at local Belgian town hall (Commune/Gemeente) within 8 days of arrival for Carte A residence permit.

    6. Post-Study Search Year & Work Rights:
       - 12-month post-study residence permit ('orientation year' / 'zoekjaar') to find employment in Belgium and EU.
       - 20 hours/week part-time work permitted during studies; full-time during official vacations.

    7. ECTS Credit Hour Conversion:
       - 1 Pakistani/US semester credit hour = ~1.8 to 2.0 European ECTS.
       - 15 credit hours across Calculus, Linear Algebra, Diff Eq, Discrete Math, and Probability/Stats equals 30 ECTS, fully satisfying university quantitative prerequisites!
    `;

    let activeContextText = "";
    if (this.activeUniversity) {
      activeContextText = `\nUSER IS CURRENTLY ASKING ABOUT: ${this.activeUniversity.u} - ${this.activeUniversity.t}. Tailor your response with precise details for this specific program and university!`;
    }

    return `You are the Senior Academic & Consular Advisor for the Belgium Master's Portal.
Your job is to provide rigorous, accurate, fact-checked guidance for international students applying to Belgian universities.

${domains}

AVAILABLE ACCREDITED UNIVERSITIES & MASTER'S PROGRAMS IN DATABASE:
${uniList}

${activeContextText}

RESPONSE GUIDELINES:
1. Always be direct, authoritative, structured, and polite.
2. Provide concrete PROOF and CITATIONS (e.g. quote the ARES circular, Flemish Codex, Office des Étrangers Article 60, or university admissions regulations).
3. If asked about fees, clearly separate TUITION from the BLOCKED ACCOUNT (living expenses returned to student).
4. If asked about math credits, remind the applicant that Pakistani/US semester credit hours convert to ECTS at ~1:2 (15 credits = ~30 ECTS).
5. Format your answers beautifully using GitHub-flavored Markdown with bold headings, bullet points, and tables where helpful.
6. Keep answers concise yet fully comprehensive without unnecessary fluff.`;
  }

  async queryGroq(userQuery) {
    const systemPrompt = this.buildSystemPrompt();

    // Contextual message history
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...this.messages.slice(-6).map(m => ({ role: m.role === "bot" ? "assistant" : "user", content: m.content })),
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
            temperature: 0.3,
            max_tokens: 1500
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

  renderMarkdown(text) {
    if (!text) return "";
    let html = text
      // Escape HTML tags to prevent XSS
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Headers
      .replace(/^### (.*$)/gim, "<h5>$1</h5>")
      .replace(/^## (.*$)/gim, "<h4>$1</h4>")
      .replace(/^# (.*$)/gim, "<h3>$1</h3>")
      // Bold & Italic
      .replace(/\*\*\*(.*?)\*\*\*/gim, "<b><i>$1</i></b>")
      .replace(/\*\*(.*?)\*\*/gim, "<b>$1</b>")
      .replace(/\*(.*?)\*/gim, "<i>$1</i>")
      // Inline code
      .replace(/`([^`]+)`/gim, "<code>$1</code>")
      // Blockquotes
      .replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>")
      // Bullet lists
      .replace(/^\s*[-*]\s+(.*$)/gim, "<li>$1</li>")
      // Numbered lists
      .replace(/^\s*\d+\.\s+(.*$)/gim, "<li>$1</li>")
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>')
      // Paragraphs & Linebreaks
      .replace(/\n\n+/gim, "</p><p>")
      .replace(/\n/gim, "<br>");

    // Wrap list items
    html = html.replace(/(<li>.*?<\/li>)/gis, "<ul>$1</ul>");
    // Clean up duplicated <ul> tags
    html = html.replace(/<\/ul>\s*<ul>/gis, "");

    return `<p>${html}</p>`;
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
    const handle = document.getElementById("aiResizeHandle");
    let isResizing = false;
    let startX, startY, startW, startH;

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      if (this.isMaximized) return;
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startW = this.win.offsetWidth;
      startH = this.win.offsetHeight;

      const onMouseMove = (ev) => {
        if (!isResizing) return;
        const newW = Math.max(340, Math.min(window.innerWidth - 40, startW + (ev.clientX - startX)));
        const newH = Math.max(380, Math.min(window.innerHeight - 40, startH + (ev.clientY - startY)));
        this.win.style.width = `${newW}px`;
        this.win.style.height = `${newH}px`;
      };

      const onMouseUp = () => {
        isResizing = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  }
}
