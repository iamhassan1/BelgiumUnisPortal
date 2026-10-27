/**
 * Application Core & State Management
 * Coordinates routing, modals, themes, fit evaluations, and AI agent integration.
 */

import { UNIVERSITIES, BELGIUM_DOMAINS } from './data.js';
import { DEFAULT_PROFILE, calculateFitScore, checkProgramEligibility } from './fit-engine.js';
import { PortalViews } from './views.js';
import { BelgiumAiAgent } from './ai-agent.js';
import { generateMarkdownReport, downloadFile } from './export.js';

class BelgiumMastersPortal {
  constructor() {
    this.state = this.loadState();
    this.views = new PortalViews(this);
    this.aiAgent = new BelgiumAiAgent();

    this.initTheme();
    this.initNavigation();
    this.initHashRouting();
    this.initModals();
    this.initGlobalShortcuts();
  }

  loadState() {
    const defaultState = {
      profile: { ...DEFAULT_PROFILE },
      shortlist: [1, 3, 6, 8], // Initial baseline curated shortlist
      compare: [1, 3, 7],     // Initial comparison baseline
      statuses: { 1: "Preparing Documents", 3: "Researching", 6: "Preparing Documents" },
      tasks: { 1: [0, 1, 2, 3], 3: [0, 1] },
      costs: {
        rent: 420,
        food: 240,
        insurance: 15,
        oneOff: 800,
        assumeScholarship: { 6: true, 7: true, 9: false }
      },
      searchQuery: "",
      category: "all",
      sortBy: "fit",
      maxBudget: 0,
      region: "",
      hideBlocked: false,
      theme: null
    };

    try {
      const saved = localStorage.getItem("bmp_state_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          ...parsed,
          profile: { ...defaultState.profile, ...(parsed.profile || {}) },
          costs: { ...defaultState.costs, ...(parsed.costs || {}) }
        };
      }
    } catch (e) {
      console.warn("Failed to load state from localStorage:", e);
    }

    return defaultState;
  }

  saveState() {
    try {
      localStorage.setItem("bmp_state_v2", JSON.stringify(this.state));
    } catch (e) {
      console.warn("Failed to save state to localStorage:", e);
    }
  }

  initTheme() {
    let activeTheme = this.state.theme;
    if (!activeTheme) {
      activeTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    this.setTheme(activeTheme);

    const themeToggleBtn = document.getElementById("themeToggleBtn");
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => {
        const newTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        this.setTheme(newTheme);
      });
    }
  }

  setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    this.state.theme = theme;
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
    this.saveState();
  }

  initNavigation() {
    const navButtons = document.querySelectorAll("nav.main-nav button");
    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        window.location.hash = `#/${view}`;
      });
    });

    // Delegated actions for stars and quick details
    document.addEventListener("click", (e) => {
      // Star toggle
      const starBtn = e.target.closest("[data-toggle-star]");
      if (starBtn) {
        const id = parseInt(starBtn.dataset.toggleStar, 10);
        this.toggleShortlist(id);
        return;
      }

      // Compare toggle
      const cmpInput = e.target.closest("[data-toggle-compare]");
      if (cmpInput) {
        const id = parseInt(cmpInput.dataset.toggleCompare, 10);
        this.toggleCompare(id);
        return;
      }

      // Quick Details Modal
      const modalBtn = e.target.closest("[data-open-modal]");
      if (modalBtn) {
        const id = parseInt(modalBtn.dataset.openModal, 10);
        this.openQuickDetailsModal(id);
        return;
      }
    });

    // Header buttons
    const profileBtn = document.getElementById("btnProfileModal");
    if (profileBtn) profileBtn.onclick = () => this.openProfileModal();

    const infoBtn = document.getElementById("btnFeesInfoModal");
    if (infoBtn) infoBtn.onclick = () => this.openFeesInfoModal();

    const exportBtn = document.getElementById("btnExportReport");
    if (exportBtn) exportBtn.onclick = () => this.exportMarkdown();
  }

  initHashRouting() {
    const handleRoute = () => {
      const hash = window.location.hash || "#/discover";
      const parts = hash.replace("#/", "").split("/");
      const route = parts[0] || "discover";
      const param = parts[1];

      // Update Nav active classes
      document.querySelectorAll("nav.main-nav button").forEach(b => {
        b.classList.toggle("active", b.dataset.view === route);
      });

      // Hide all view sections
      document.querySelectorAll(".view-section").forEach(sec => {
        sec.classList.remove("active");
      });

      if (route === "program" && param) {
        const programId = parseInt(param, 10);
        const uniSec = document.getElementById("v-university-detail");
        if (uniSec) {
          uniSec.classList.add("active");
          this.views.renderUniversityPage(programId);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        const targetView = document.getElementById(`v-${route}`) || document.getElementById("v-discover");
        if (targetView) targetView.classList.add("active");

        if (route === "discover") this.views.renderDiscover();
        else if (route === "compare") this.views.renderCompare();
        else if (route === "plan") this.views.renderPlan();
        else if (route === "costs") this.views.renderCosts();
        else if (route === "guide") this.views.renderGuide();
      }

      this.updateBadges();
    };

    window.addEventListener("hashchange", handleRoute);
    handleRoute();
  }

  updateBadges() {
    const planNav = document.getElementById("navPlanCount");
    if (planNav) {
      planNav.textContent = this.state.shortlist.length > 0 ? `(${this.state.shortlist.length})` : "";
    }
    const cmpNav = document.getElementById("navCompareCount");
    if (cmpNav) {
      cmpNav.textContent = this.state.compare.length > 0 ? `(${this.state.compare.length})` : "";
    }
  }

  toggleShortlist(id) {
    const idx = this.state.shortlist.indexOf(id);
    if (idx > -1) {
      this.state.shortlist.splice(idx, 1);
    } else {
      this.state.shortlist.push(id);
    }
    this.saveState();
    this.updateBadges();

    // Re-render current view if on discover, plan, or university detail
    const hash = window.location.hash;
    if (hash.includes("plan")) this.views.renderPlan();
    else if (hash.includes("program")) {
      const pid = parseInt(hash.split("/")[2], 10);
      this.views.renderUniversityPage(pid);
    } else {
      this.views.renderDiscover();
    }
  }

  toggleCompare(id) {
    const idx = this.state.compare.indexOf(id);
    if (idx > -1) {
      this.state.compare.splice(idx, 1);
    } else {
      if (this.state.compare.length >= 4) {
        this.state.compare.shift();
      }
      this.state.compare.push(id);
    }
    this.saveState();
    this.updateBadges();

    if (window.location.hash.includes("compare")) {
      this.views.renderCompare();
    } else {
      this.views.renderDiscover();
    }
  }

  // --- MODALS ---
  initModals() {
    // Backdrop click and close buttons
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("ov") || e.target.closest("[data-modal-close]")) {
        document.querySelectorAll(".ov").forEach(m => m.classList.remove("on"));
      }
    });
  }

  openQuickDetailsModal(programId) {
    const p = UNIVERSITIES.find(u => u.id === programId);
    if (!p) return;

    const fit = calculateFitScore(p, this.state.profile);
    let modal = document.getElementById("ovQuickDetail");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ovQuickDetail";
      modal.className = "ov";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="md">
        <div class="mh">
          <button class="x" data-modal-close>✕</button>
          <div class="meta" style="font-size: 13px; color: var(--tx-muted); margin-bottom: 4px;">
            <span>${p.u} · ${p.c}</span>
            <span class="region-badge" style="margin-left: 8px;">${p.r}</span>
          </div>
          <h2>${p.t}</h2>
          <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span class="price-pill ${p.cl}">${p.pill}</span>
            <span class="fit-score-badge ${fit.color}">${fit.label} (${fit.score}/100)</span>
          </div>
        </div>

        <div class="mb">
          <!-- Eligibility check -->
          <div class="sec">
            <h5>Eligibility Check Against Your Profile</h5>
            <div class="checks-list">
              ${fit.checks.map(c => `
                <div class="check-item ${c.status}">
                  <span class="check-icon">${c.status === "ok" ? "✓" : c.status === "warning" ? "!" : "✕"}</span>
                  <div>
                    <strong>${c.category}</strong>
                    <p>${c.message}</p>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Why recommended -->
          <div class="sec">
            <h5>Why This Program is Recommended</h5>
            <ul>
              ${p.why.map(w => `<li>${w}</li>`).join("")}
            </ul>
          </div>

          <!-- Prerequisites -->
          <div class="sec">
            <h5>Required CS Background (Prerequisites)</h5>
            <div class="card-tags" style="margin-top: 6px;">
              ${p.pre.map(pr => `<span class="tag-chip">✓ ${pr}</span>`).join("")}
            </div>
          </div>

          <!-- Deadlines & Financial Specs -->
          <div class="sec">
            <h5>Deadlines &amp; Financial Specs</h5>
            <div class="sp">
              <div class="s">Tuition<b>${p.tu}</b></div>
              <div class="s">Application Fee<b>${p.appFee}</b></div>
              <div class="s">Non-EU Deadline<b>${p.dl || "Check site"}</b></div>
              <div class="s">IELTS Requirement<b>${p.iel} overall ${p.band ? `(min ${p.band} band)` : ""}</b></div>
              <div class="s wd">
                Statutory Living Solvency (Compte Bloqué / Annex 32)
                <b>€803/month (~€9,636 - €10,200/year returned to you monthly)</b>
              </div>
            </div>
          </div>
        </div>

        <div class="mf">
          <a href="#/program/${p.id}" class="btn" data-modal-close>Open Full Dedicated Page 📑</a>
          <button class="btn" id="btnModalAskAi" data-id="${p.id}">🤖 Ask AI</button>
          <a href="${p.url}" target="_blank" rel="noopener" class="btn p">Official Course Site ↗</a>
        </div>
      </div>
    `;

    modal.classList.add("on");

    const modalAskAi = document.getElementById("btnModalAskAi");
    if (modalAskAi) {
      modalAskAi.addEventListener("click", () => {
        modal.classList.remove("on");
        this.aiAgent.openWindow(p);
      });
    }
  }

  openProfileModal() {
    let modal = document.getElementById("ovProfileModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ovProfileModal";
      modal.className = "ov";
      document.body.appendChild(modal);
    }

    const p = this.state.profile;

    modal.innerHTML = `
      <div class="md">
        <div class="mh">
          <button class="x" data-modal-close>✕</button>
          <h2>👤 Candidate Profile &amp; Baseline Evaluator</h2>
          <p class="mu">Adjust your academic parameters. All fit scores, eligibility checks, and fee simulations update automatically.</p>
        </div>
        <div class="mb">
          <div class="sec">
            <div class="form" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
              <label>
                CGPA (out of 4.0):
                <input type="number" step="0.05" id="inpCgpa" value="${p.cgpa}" min="2.0" max="4.0" />
              </label>
              <label>
                IELTS Overall Band:
                <input type="number" step="0.5" id="inpIelts" value="${p.ielts}" min="5.0" max="9.0" />
              </label>
              <label>
                IELTS Lowest Sub-band:
                <input type="number" step="0.5" id="inpBand" value="${p.band}" min="5.0" max="9.0" />
              </label>
              <label>
                Math &amp; Stats Credit Hours:
                <input type="number" step="1" id="inpMath" value="${p.mathCredits}" min="0" max="40" />
              </label>
              <label>
                Max Tuition Budget (€/year):
                <input type="number" step="100" id="inpBudget" value="${p.budget}" min="0" max="30000" />
              </label>
            </div>
            <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 8px;">
              <label class="toggle-label">
                <input type="checkbox" id="inpAres" ${p.aresEligible ? "checked" : ""} />
                <span><b>Wallonia ARES Exemption:</b> My nationality is on the DAC developing country list (e.g. Pakistan)</span>
              </label>
              <label class="toggle-label">
                <input type="checkbox" id="inpPortfolio" ${p.hasPortfolio ? "checked" : ""} />
                <span><b>Game / Creative Portfolio:</b> I have shipped games, prototypes, or code repositories</span>
              </label>
              <label class="toggle-label">
                <input type="checkbox" id="inpGre" ${p.gre ? "checked" : ""} />
                <span><b>GRE Score:</b> I have taken the GRE test</span>
              </label>
            </div>
          </div>
        </div>
        <div class="mf">
          <button class="btn" id="btnResetProfile">Reset to Baseline</button>
          <button class="btn p" id="btnSaveProfile">Save &amp; Recalculate</button>
        </div>
      </div>
    `;

    modal.classList.add("on");

    document.getElementById("btnResetProfile").onclick = () => {
      this.state.profile = { ...DEFAULT_PROFILE };
      this.saveState();
      modal.classList.remove("on");
      this.views.renderDiscover();
    };

    document.getElementById("btnSaveProfile").onclick = () => {
      this.state.profile.cgpa = parseFloat(document.getElementById("inpCgpa").value) || 3.75;
      this.state.profile.ielts = parseFloat(document.getElementById("inpIelts").value) || 6.5;
      this.state.profile.band = parseFloat(document.getElementById("inpBand").value) || 6.0;
      this.state.profile.mathCredits = parseInt(document.getElementById("inpMath").value, 10) || 15;
      this.state.profile.budget = parseInt(document.getElementById("inpBudget").value, 10) || 2000;
      this.state.profile.aresEligible = document.getElementById("inpAres").checked;
      this.state.profile.hasPortfolio = document.getElementById("inpPortfolio").checked;
      this.state.profile.gre = document.getElementById("inpGre").checked;

      this.saveState();
      modal.classList.remove("on");
      this.views.renderDiscover();
    };
  }

  openFeesInfoModal() {
    let modal = document.getElementById("ovFeesInfoModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ovFeesInfoModal";
      modal.className = "ov";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="md">
        <div class="mh">
          <button class="x" data-modal-close>✕</button>
          <h2>ℹ️ How Belgian University Fees &amp; Solvency Work</h2>
          <p class="mu">Demystifying tuition rates, Wallonia waivers, Master Mind awards, and the Blocked Account.</p>
        </div>
        <div class="mb">
          <div class="sec">
            <h5>1. Wallonia-Brussels ARES Exemption (&lt;€1,500/yr)</h5>
            <p>
              In French-speaking Belgium (UCLouvain, ULiège, UNamur, ULB), non-EU students from eligible developing countries (DAC list, e.g. Pakistan)
              are <b>exempt</b> from the extra international fee of €4,175. They pay the same statutory fee as Belgian and EU students: <b>€1,194/year</b> (2026-27 indexed full rate).
            </p>
          </div>
          <div class="sec">
            <h5>2. Flemish Universities &amp; Master Mind Scholarships</h5>
            <p>
              In Dutch-speaking Flanders (KU Leuven, Ghent, Antwerp, VUB, Hasselt), non-EEA tuition is higher (€4,200 to €7,800/year).
              However, outstanding students (CGPA 3.5+) can be nominated for the <b>Master Mind Scholarship</b>:
              provides <b>€10,225/year living grant</b> and drops university tuition down to <b>~€139.40/year</b>!
            </p>
          </div>
          <div class="sec">
            <h5>3. Erasmus Mundus Joint Degrees (EMJM)</h5>
            <p>
              Prestigious EU-funded joint masters (like IMLEX and DEAI) offer <b>€0 tuition</b> plus <b>€1,400/month living stipend</b>, full insurance, and travel allowances.
            </p>
          </div>
          <div class="sec">
            <h5>4. Blocked Account vs. Tuition (Crucial Difference)</h5>
            <p>
              The <b>€803/month (~€9,636 - €10,200/yr)</b> required for the student visa is <b>living money</b> held in escrow.
              Once in Belgium, the bank or university transfers this money back into your pocket every single month to cover your rent and food.
              Alternatively, an <b>Annex 32 legal guarantor</b> in the EU completely waives this deposit!
            </p>
          </div>
        </div>
        <div class="mf">
          <button class="btn p" data-modal-close>Understood</button>
        </div>
      </div>
    `;

    modal.classList.add("on");
  }

  exportMarkdown() {
    const md = generateMarkdownReport(this.state);
    downloadFile("Belgium_CS_GameDesign_Masters_Guide.md", md);
  }

  initGlobalShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Escape closes modals
      if (e.key === "Escape") {
        document.querySelectorAll(".ov").forEach(m => m.classList.remove("on"));
        if (this.aiAgent) this.aiAgent.mentionPopover.classList.add("hidden");
      }
      // Ctrl+K focuses search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("qSearch");
        if (searchInput) searchInput.focus();
      }
    });
  }
}

// Initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  window.portalApp = new BelgiumMastersPortal();
});
