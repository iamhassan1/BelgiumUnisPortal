/**
 * Application Core & State Management
 * Coordinates routing, modals, themes, fit evaluations, and AI agent integration.
 */

import { UNIVERSITIES, BELGIUM_DOMAINS, GERMANY_DOMAINS, COUNTRIES } from './data.js';
import { DEFAULT_PROFILE, calculateFitScore, checkProgramEligibility, creditsToEcts, getEffectiveTuition } from './fit-engine.js';
import { DiscoveryConnector } from './discovery-connector.js';
import { PortalViews } from './views.js';
import { BelgiumAiAgent } from './ai-agent.js';
import { generateMarkdownReport, downloadFile } from './export.js';

class BelgiumMastersPortal {
  constructor() {
    this.state = this.loadState();
    this.connector = new DiscoveryConnector(this);
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
      shortlist: [1, 3, 15, 17, 19], // Initial baseline curated shortlist across Belgium & Germany
      compare: [1, 15, 19],          // Initial comparison baseline
      statuses: { 1: "Preparing Documents", 3: "Researching", 15: "Reviewing Prerequisites", 19: "Preparing Portfolio" },
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
      country: "All Countries",
      matchTier: "all",
      intake: "all",
      guideCountry: "Belgium",
      costCountry: "Belgium",
      openOnly: false,
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

      // Modal Close buttons (data-modal-close or .x)
      const closeBtn = e.target.closest("[data-modal-close]") || e.target.closest(".x");
      if (closeBtn) {
        const modal = closeBtn.closest(".ov");
        if (modal) {
          this.closeModal(modal);
          return;
        }
      }

      // Backdrop overlay click
      if (e.target.classList.contains("ov") && e.target.classList.contains("on")) {
        this.closeModal(e.target);
        return;
      }
    });

    // Prevent background page scrolling when modal is open
    document.addEventListener("wheel", (e) => {
      const activeModal = document.querySelector(".ov.on");
      if (!activeModal) return;
      const modalBox = e.target.closest(".md");
      if (!modalBox) {
        e.preventDefault();
        return;
      }
      // Stop scroll chaining to background page at scroll boundaries
      const isScrollable = modalBox.scrollHeight > modalBox.clientHeight;
      if (!isScrollable) {
        e.preventDefault();
        return;
      }
      const atTop = modalBox.scrollTop <= 0 && e.deltaY < 0;
      const atBottom = (modalBox.scrollTop + modalBox.clientHeight >= modalBox.scrollHeight - 1) && e.deltaY > 0;
      if (atTop || atBottom) {
        e.preventDefault();
      }
    }, { passive: false });

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
  openModal(modal) {
    if (!modal) return;
    modal.classList.add("on");
    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("on");
    if (!document.querySelector(".ov.on")) {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    }
  }

  closeAllModals() {
    document.querySelectorAll(".ov.on").forEach(m => m.classList.remove("on"));
    document.body.classList.remove("modal-open");
    document.documentElement.classList.remove("modal-open");
  }

  initModals() {
    // Backdrop click and close buttons handled in initNavigation
  }

  openQuickDetailsModal(programId) {
    const p = UNIVERSITIES.find(u => u.id === programId);
    if (!p) return;

    const fit = calculateFitScore(p, this.state.profile);
    const countryFlag = p.country === "Germany" ? "🇩🇪" : p.country === "Belgium" ? "🇧🇪" : "🇳🇱";

    let modal = document.getElementById("ovQuickDetail");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ovQuickDetail";
      modal.className = "ov";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="md" style="max-width: 760px;">
        <div class="mh">
          <button class="x" data-modal-close>✕</button>
          <div class="meta" style="font-size: 13px; color: var(--tx-muted); margin-bottom: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span>${countryFlag} <b>${p.country}</b> · ${p.u} · ${p.c}</span>
            <span class="region-badge">${p.r}</span>
            <span class="app-route-pill">${p.appRoute || "Direct Portal"}</span>
          </div>
          <h2>${p.t}</h2>
          <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span class="price-pill ${p.cl}">${p.pill}</span>
            <span class="fit-score-badge ${fit.tierColor}">${fit.tierLabel} (${fit.score}%)</span>
            <span class="app-status-pill ${p.appStatus === 'Open' ? 'open' : 'closed'}">
              ${p.appStatus === 'Open' ? '🟢 Applications Open' : '🗓️ Check Portal'}
            </span>
          </div>
        </div>

        <div class="mb">
          <!-- Why You Match Diagnostic Highlights -->
          ${fit.whyMatched.length > 0 ? `
            <div class="sec" style="background: var(--success-subtle); padding: 14px 16px; border-radius: var(--radius-md); border: 1px solid rgba(16, 185, 129, 0.25);">
              <h5 style="color: var(--success-text); margin-bottom: 6px;">✓ Why You Match This Program</h5>
              <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: var(--tx);">
                ${fit.whyMatched.map(w => `<div style="display: flex; gap: 6px; align-items: flex-start;"><span>✓</span><span>${w}</span></div>`).join("")}
              </div>
            </div>
          ` : ""}

          <!-- Gaps & Verification Needed -->
          ${fit.gapsToVerify.length > 0 ? `
            <div class="sec" style="background: var(--amber-subtle); padding: 14px 16px; border-radius: var(--radius-md); border: 1px solid rgba(217, 119, 6, 0.25);">
              <h5 style="color: var(--amber-text); margin-bottom: 6px;">⚠ Gaps &amp; Verification Needed</h5>
              <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: var(--tx);">
                ${fit.gapsToVerify.map(g => `<div style="display: flex; gap: 6px; align-items: flex-start;"><span>!</span><span>${g}</span></div>`).join("")}
              </div>
            </div>
          ` : ""}

          <!-- Hard Disqualifiers (if blocked) -->
          ${fit.hardBlockers.length > 0 ? `
            <div class="sec" style="background: var(--danger-subtle); padding: 14px 16px; border-radius: var(--radius-md); border: 1px solid rgba(220, 38, 38, 0.25);">
              <h5 style="color: var(--danger-text); margin-bottom: 6px;">✕ Mandatory Criteria Not Met</h5>
              <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: var(--tx);">
                ${fit.hardBlockers.map(b => `<div style="display: flex; gap: 6px; align-items: flex-start;"><span>✕</span><span>${b}</span></div>`).join("")}
              </div>
            </div>
          ` : ""}

          <!-- Itemized Check Breakdown -->
          <div class="sec">
            <h5>Itemized Eligibility Audit</h5>
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
            <h5>Key Academic Strengths</h5>
            <ul>
              ${p.why.map(w => `<li>${w}</li>`).join("")}
            </ul>
          </div>

          <!-- Prerequisites -->
          <div class="sec">
            <h5>Required Academic Prerequisites</h5>
            <div class="card-tags" style="margin-top: 6px;">
              ${p.pre.map(pr => `<span class="tag-chip">✓ ${pr}</span>`).join("")}
            </div>
          </div>

          <!-- Deadlines & Financial Specs -->
          <div class="sec">
            <h5>Deadlines &amp; Financial Specifications</h5>
            <div class="sp">
              <div class="s">Tuition<b>${p.tu}</b></div>
              <div class="s">Semester Fee / Contribution<b>${p.semesterFee ? `€${p.semesterFee}/sem` : "Included in tuition"}</b></div>
              <div class="s">Application Route<b>${p.appRoute || "Direct Portal"}</b></div>
              <div class="s">Non-EU Deadline<b>${p.dl || "Check official site"}</b></div>
              <div class="s">Language Minimum<b>${p.iel} IELTS ${p.band ? `(min ${p.band} sub-band)` : ""} · German: ${p.germanReq || "None"}</b></div>
              <div class="s wd">
                Statutory Living Solvency &amp; Blocked Account
                <b>${p.visaNotes || (p.country === "Germany" ? "€992/month (€11,904/yr) via Expatrio/Fintiba Sperrkonto." : "€803/month (~€9,636/yr) via university escrow.")}</b>
              </div>
            </div>
          </div>

          <!-- Source Citation -->
          <div style="font-size: 11px; color: var(--tx-muted); padding: 8px 12px; background: var(--bg-subtle); border-radius: var(--radius-md);">
            ℹ️ <b>Source &amp; Verification:</b> ${p.source || "Official University Portal"} · Last Verified: ${p.lastVerified || "October 2026"}
          </div>
        </div>

        <div class="mf">
          <a href="#/program/${p.id}" class="btn" data-modal-close>Open Dedicated Page 📑</a>
          <button class="btn" id="btnModalAskAi" data-id="${p.id}">🤖 Ask AI</button>
          <a href="${p.url}" target="_blank" rel="noopener" class="btn">Official Info ↗</a>
          <a href="${p.applyUrl || p.url}" target="_blank" rel="noopener" class="btn p">Apply via Portal ↗</a>
        </div>
      </div>
    `;

    this.openModal(modal);

    const modalAskAi = document.getElementById("btnModalAskAi");
    if (modalAskAi) {
      modalAskAi.addEventListener("click", () => {
        this.closeModal(modal);
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
      <div class="md questionnaire-modal-content">
        <div class="mh">
          <button class="x" data-modal-close>✕</button>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <h2>👤 Candidate Profile &amp; Strict Eligibility Questionnaire</h2>
            <span class="completeness-badge">✓ Profile Ready for Strict Matching</span>
          </div>
          <p class="mu">Fill in your academic and financial dimensions. The multi-stage matching engine strictly filters out ineligible programs and provides verified match diagnostics.</p>
        </div>

        <div class="mb">
          <!-- Quick Presets Bar -->
          <div class="questionnaire-presets-bar">
            <span style="font-size: 12px; font-weight: 750; color: var(--tx-muted);">Quick Presets:</span>
            <button class="preset-chip" id="presetPakistaniCs">🇵🇰 Pakistani CS Grad (<€2k)</button>
            <button class="preset-chip" id="presetGameDev">🎮 Game Dev &amp; XR (Unity/C#)</button>
            <button class="preset-chip" id="presetGermanFree">🇩🇪 German Tuition-Free (€0)</button>
            <button class="preset-chip" id="presetScholarship">🏆 High CGPA / Scholarship Track</button>
          </div>

          <!-- Questionnaire Sub-Tabs -->
          <div class="questionnaire-tabs-bar" id="questionnaireTabsBar">
            <button class="questionnaire-tab-btn active" data-qtab="acad">🎓 1. Academic Standing</button>
            <button class="questionnaire-tab-btn" data-qtab="lang">🗣️ 2. Language &amp; Tests</button>
            <button class="questionnaire-tab-btn" data-qtab="budget">💰 3. Budget &amp; Visa</button>
            <button class="questionnaire-tab-btn" data-qtab="pref">🌍 4. Target Preferences</button>
          </div>

          <!-- TAB 1: Academic Standing -->
          <div class="questionnaire-tab-panel active" id="qtab-acad">
            <div class="form-grid-3">
              <label>
                Degree Level:
                <select id="inpDegreeLevel">
                  <option value="BSc in Computer Science" ${p.degreeLevel === "BSc in Computer Science" ? "selected" : ""}>BSc / BS in Computer Science</option>
                  <option value="BS in Software Engineering" ${p.degreeLevel === "BS in Software Engineering" ? "selected" : ""}>BS in Software Engineering</option>
                  <option value="BS in Information Technology" ${p.degreeLevel === "BS in Information Technology" ? "selected" : ""}>BS in IT / Data Science</option>
                  <option value="BS in Electrical / Other" ${p.degreeLevel === "BS in Electrical / Other" ? "selected" : ""}>BS in Electrical / Engineering</option>
                </select>
              </label>

              <label>
                CGPA (out of 4.0):
                <input type="number" step="0.05" id="inpCgpa" value="${p.cgpa}" min="2.0" max="4.0" />
              </label>

              <label>
                Graduation Year:
                <input type="number" id="inpGradYear" value="${p.gradYear || 2023}" min="2015" max="2027" />
              </label>
            </div>

            <div class="form-grid-2" style="margin-top: 8px;">
              <label>
                Math &amp; Quantitative Credit Hours:
                <input type="number" step="1" id="inpMath" value="${p.mathCredits}" min="0" max="40" />
                <small style="color: var(--tx-muted); margin-top: 4px; display: block;">
                  ${p.mathCredits} credit hours ≈ <b>~${creditsToEcts(p.mathCredits)} ECTS</b> (Calculus, Linear Algebra, Diff Eq, Discrete Math, Stats)
                </small>
              </label>

              <label>
                Core CS &amp; Software Credit Hours:
                <input type="number" step="1" id="inpCsCredits" value="${p.csCredits || 45}" min="0" max="100" />
                <small style="color: var(--tx-muted); margin-top: 4px; display: block;">
                  ${p.csCredits || 45} credit hours ≈ <b>~${creditsToEcts(p.csCredits || 45)} ECTS</b> (Data Structures, Algorithms, OS, Networks)
                </small>
              </label>
            </div>
          </div>

          <!-- TAB 2: Language & Tests -->
          <div class="questionnaire-tab-panel" id="qtab-lang">
            <div class="form-grid-3">
              <label>
                English Test Type:
                <select id="inpEnglishTest">
                  <option value="IELTS" ${p.englishTest === "IELTS" ? "selected" : ""}>IELTS Academic</option>
                  <option value="TOEFL" ${p.englishTest === "TOEFL" ? "selected" : ""}>TOEFL iBT</option>
                  <option value="Duolingo" ${p.englishTest === "Duolingo" ? "selected" : ""}>Duolingo (Check Waivers)</option>
                  <option value="MOI" ${p.englishTest === "MOI" ? "selected" : ""}>Medium of Instruction Letter</option>
                </select>
              </label>

              <label>
                IELTS Overall Score:
                <input type="number" step="0.5" id="inpIelts" value="${p.ielts}" min="5.0" max="9.0" />
              </label>

              <label>
                Lowest Sub-Band Score:
                <input type="number" step="0.5" id="inpBand" value="${p.band}" min="5.0" max="9.0" />
              </label>
            </div>

            <div class="form-grid-2" style="margin-top: 8px;">
              <label>
                German Language Proficiency:
                <select id="inpGermanLevel">
                  <option value="None" ${p.germanLevel === "None" ? "selected" : ""}>None (100% English Programs Only)</option>
                  <option value="A1-A2" ${p.germanLevel === "A1-A2" ? "selected" : ""}>A1 – A2 (Beginner)</option>
                  <option value="B1" ${p.germanLevel === "B1" ? "selected" : ""}>B1 (Intermediate)</option>
                  <option value="B2+" ${p.germanLevel === "B2+" ? "selected" : ""}>B2+ / TestDaF (Upper-Intermediate)</option>
                </select>
              </label>

              <div style="display: flex; flex-direction: column; justify-content: center;">
                <label class="toggle-label" style="margin-top: 18px;">
                  <input type="checkbox" id="inpGre" ${p.gre ? "checked" : ""} />
                  <span><b>GRE Test:</b> I have taken the GRE General exam (needed for RWTH Aachen non-EU)</span>
                </label>
              </div>
            </div>
          </div>

          <!-- TAB 3: Budget & Financials -->
          <div class="questionnaire-tab-panel" id="qtab-budget">
            <div class="form-grid-2">
              <label>
                Max Annual Tuition Budget (€/year):
                <input type="number" step="100" id="inpBudget" value="${p.budget}" min="0" max="35000" />
                <small style="color: var(--tx-muted); margin-top: 4px; display: block;">
                  Tip: Germany offers <b>€0 tuition</b> at public universities. Wallonia offers <b>~€835–€1,194/yr</b> under ARES.
                </small>
              </label>

              <label>
                Target Intake:
                <select id="inpIntake">
                  <option value="Winter / Fall (Sept/Oct)" selected>Winter / Fall Semester (Sept / Oct 2026/2027)</option>
                  <option value="Summer / Spring (Mar/Apr)">Summer / Spring Semester (Mar / Apr 2026/2027)</option>
                  <option value="Any">Any Upcoming Intake</option>
                </select>
              </label>
            </div>

            <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px;">
              <label class="toggle-label">
                <input type="checkbox" id="inpAres" ${p.aresEligible ? "checked" : ""} />
                <span><b>Wallonia ARES Exemption:</b> My nationality is on the DAC developing country list (e.g. Pakistan) — waives €4,175 surtax</span>
              </label>

              <label class="toggle-label">
                <input type="checkbox" id="inpBlockedComfort" ${p.blockedComfort !== false ? "checked" : ""} />
                <span><b>Living Solvency Comfort:</b> I can arrange the statutory living blocked account (€9,636 in Belgium or €11,904 in Germany — returned monthly)</span>
              </label>

              <label class="toggle-label">
                <input type="checkbox" id="inpNeedsScholarship" ${p.needsScholarship ? "checked" : ""} />
                <span><b>Full Scholarship Seeker:</b> Prioritize programs offering full grants &amp; stipends (Master Mind, DAAD, Erasmus Mundus)</span>
              </label>
            </div>
          </div>

          <!-- TAB 4: Target Preferences -->
          <div class="questionnaire-tab-panel" id="qtab-pref">
            <div>
              <span style="font-size: 13px; font-weight: 750; color: var(--tx); display: block; margin-bottom: 8px;">Target Countries:</span>
              <div style="display: flex; gap: 14px; flex-wrap: wrap;">
                <label class="toggle-label">
                  <input type="checkbox" id="targetCountryBelgium" ${(p.targetCountries || []).includes("Belgium") ? "checked" : ""} />
                  <span>🇧🇪 Belgium (Wallonia low fees &amp; Master Mind)</span>
                </label>
                <label class="toggle-label">
                  <input type="checkbox" id="targetCountryGermany" ${(p.targetCountries || []).includes("Germany") ? "checked" : ""} />
                  <span>🇩🇪 Germany (DAAD, uni-assist, €0 tuition)</span>
                </label>
              </div>
            </div>

            <div style="margin-top: 14px;">
              <label>
                Preferred University Type:
                <select id="inpUniType">
                  <option value="All" ${p.uniType === "All" ? "selected" : ""}>All University Types</option>
                  <option value="Research / TU9" ${p.uniType === "Research / TU9" ? "selected" : ""}>Top Research Universities &amp; TU9 Powerhouses</option>
                  <option value="Applied Sciences (FH)" ${p.uniType === "Applied Sciences (FH)" ? "selected" : ""}>Universities of Applied Sciences &amp; Game Labs</option>
                </select>
              </label>
            </div>

            <div style="margin-top: 14px;">
              <label class="toggle-label">
                <input type="checkbox" id="inpPortfolio" ${p.hasPortfolio ? "checked" : ""} />
                <span><b>Creative / Game Portfolio:</b> I have shipped games, prototypes, itch.io builds, or code repositories</span>
              </label>
            </div>
          </div>
        </div>

        <div class="mf">
          <button class="btn" id="btnResetProfile">Reset to Baseline</button>
          <button class="btn p" id="btnSaveProfile">Save Profile &amp; Discover Matches ⚡</button>
        </div>
      </div>
    `;

    modal.classList.add("on");

    // Wire Questionnaire Sub-Tabs
    const qTabBtns = modal.querySelectorAll(".questionnaire-tab-btn");
    const qPanels = modal.querySelectorAll(".questionnaire-tab-panel");
    qTabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.qtab;
        qTabBtns.forEach(b => b.classList.remove("active"));
        qPanels.forEach(pnl => pnl.classList.remove("active"));

        btn.classList.add("active");
        const panel = modal.querySelector(`#qtab-${target}`);
        if (panel) panel.classList.add("active");
      });
    });

    // Wire Presets
    const applyPreset = (preset) => {
      document.getElementById("inpCgpa").value = preset.cgpa;
      document.getElementById("inpIelts").value = preset.ielts;
      document.getElementById("inpBand").value = preset.band;
      document.getElementById("inpMath").value = preset.mathCredits;
      document.getElementById("inpCsCredits").value = preset.csCredits;
      document.getElementById("inpBudget").value = preset.budget;
      document.getElementById("inpGermanLevel").value = preset.germanLevel;
      document.getElementById("inpAres").checked = preset.aresEligible;
      document.getElementById("inpPortfolio").checked = preset.hasPortfolio;
      document.getElementById("inpGre").checked = preset.gre;
      document.getElementById("inpNeedsScholarship").checked = preset.needsScholarship;
      document.getElementById("targetCountryBelgium").checked = preset.targetCountries.includes("Belgium");
      document.getElementById("targetCountryGermany").checked = preset.targetCountries.includes("Germany");
    };

    const presetPak = document.getElementById("presetPakistaniCs");
    if (presetPak) {
      presetPak.onclick = () => applyPreset({
        cgpa: 3.75, ielts: 6.5, band: 6.0, mathCredits: 15, csCredits: 45,
        budget: 2000, germanLevel: "None", aresEligible: true, hasPortfolio: true,
        gre: false, needsScholarship: false, targetCountries: ["Belgium", "Germany"]
      });
    }

    const presetGame = document.getElementById("presetGameDev");
    if (presetGame) {
      presetGame.onclick = () => applyPreset({
        cgpa: 3.5, ielts: 6.5, band: 6.0, mathCredits: 12, csCredits: 45,
        budget: 2500, germanLevel: "None", aresEligible: true, hasPortfolio: true,
        gre: false, needsScholarship: false, targetCountries: ["Belgium", "Germany"]
      });
    }

    const presetGer = document.getElementById("presetGermanFree");
    if (presetGer) {
      presetGer.onclick = () => applyPreset({
        cgpa: 3.6, ielts: 7.0, band: 6.5, mathCredits: 16, csCredits: 50,
        budget: 500, germanLevel: "None", aresEligible: false, hasPortfolio: false,
        gre: false, needsScholarship: false, targetCountries: ["Germany"]
      });
    }

    const presetSchol = document.getElementById("presetScholarship");
    if (presetSchol) {
      presetSchol.onclick = () => applyPreset({
        cgpa: 3.9, ielts: 7.5, band: 7.0, mathCredits: 18, csCredits: 50,
        budget: 0, germanLevel: "None", aresEligible: true, hasPortfolio: true,
        gre: true, needsScholarship: true, targetCountries: ["Belgium", "Germany"]
      });
    }

    // Reset button
    document.getElementById("btnResetProfile").onclick = () => {
      this.state.profile = { ...DEFAULT_PROFILE };
      this.saveState();
      this.closeModal(modal);
      this.views.renderDiscover();
    };

    // Save button
    document.getElementById("btnSaveProfile").onclick = () => {
      const targetCountries = [];
      if (document.getElementById("targetCountryBelgium").checked) targetCountries.push("Belgium");
      if (document.getElementById("targetCountryGermany").checked) targetCountries.push("Germany");
      if (targetCountries.length === 0) targetCountries.push("Belgium", "Germany");

      this.state.profile.degreeLevel = document.getElementById("inpDegreeLevel").value;
      this.state.profile.cgpa = parseFloat(document.getElementById("inpCgpa").value) || 3.75;
      this.state.profile.gradYear = parseInt(document.getElementById("inpGradYear").value, 10) || 2023;
      this.state.profile.mathCredits = parseInt(document.getElementById("inpMath").value, 10) || 15;
      this.state.profile.csCredits = parseInt(document.getElementById("inpCsCredits").value, 10) || 45;
      this.state.profile.englishTest = document.getElementById("inpEnglishTest").value;
      this.state.profile.ielts = parseFloat(document.getElementById("inpIelts").value) || 6.5;
      this.state.profile.band = parseFloat(document.getElementById("inpBand").value) || 6.0;
      this.state.profile.germanLevel = document.getElementById("inpGermanLevel").value;
      this.state.profile.gre = document.getElementById("inpGre").checked;
      this.state.profile.budget = parseInt(document.getElementById("inpBudget").value, 10) || 2000;
      this.state.profile.intake = document.getElementById("inpIntake").value;
      this.state.profile.aresEligible = document.getElementById("inpAres").checked;
      this.state.profile.blockedComfort = document.getElementById("inpBlockedComfort").checked;
      this.state.profile.needsScholarship = document.getElementById("inpNeedsScholarship").checked;
      this.state.profile.targetCountries = targetCountries;
      this.state.profile.uniType = document.getElementById("inpUniType").value;
      this.state.profile.hasPortfolio = document.getElementById("inpPortfolio").checked;

      this.saveState();
      this.closeModal(modal);
      this.views.renderDiscover();
    };

    this.openModal(modal);
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
          <h2>ℹ️ How European University Fees &amp; Solvency Work (Belgium &amp; Germany)</h2>
          <p class="mu">Demystifying tuition rates, €0 German public universities, Wallonia waivers, and Blocked Accounts.</p>
        </div>
        <div class="mb">
          <div class="sec">
            <h5>1. Germany: 100% Tuition-Free Higher Education (€0 Tuition)</h5>
            <p>
              At public universities in 15 of 16 German federal states, international students pay <b>ZERO tuition</b>.
              Students only pay a statutory semester contribution (Semesterbeitrag) of ~€85 to €350, which almost universally includes a free public transport ticket (Semesterticket) for local and regional trains/busses!
            </p>
          </div>
          <div class="sec">
            <h5>2. Belgium: Wallonia-Brussels ARES Exemption (&lt;€1,500/yr)</h5>
            <p>
              In French-speaking Belgium (UCLouvain, ULiège, UNamur, ULB), non-EU students from eligible developing countries (DAC list, e.g. Pakistan)
              are <b>exempt</b> from the extra international fee of €4,175. They pay the same statutory fee as Belgian and EU students: <b>€1,194/year</b> (2026-27 indexed full rate).
            </p>
          </div>
          <div class="sec">
            <h5>3. Flemish Universities &amp; Master Mind Scholarships</h5>
            <p>
              In Dutch-speaking Flanders (KU Leuven, Ghent, Antwerp, VUB, Hasselt), non-EEA tuition is higher (€4,200 to €7,800/year).
              However, outstanding students (CGPA 3.5+) can be nominated for the <b>Master Mind Scholarship</b>:
              provides <b>€10,225/year living grant</b> and drops university tuition down to <b>~€139.40/year</b>!
            </p>
          </div>
          <div class="sec">
            <h5>4. Blocked Account (Sperrkonto / Compte Bloqué) — Living Money, NOT Tuition</h5>
            <p>
              The <b>€803/month in Belgium (~€9,636/yr)</b> or <b>€992/month in Germany (€11,904/yr)</b> required for the student visa is <b>living money</b> held in escrow.
              Once you arrive in Europe, the bank or university transfers this money back into your pocket every single month to cover your rent and food.
              Alternatively, an <b>Annex 32 legal guarantor</b> in Belgium or <b>Verpflichtungserklärung</b> in Germany waives this deposit!
            </p>
          </div>
        </div>
        <div class="mf">
          <button class="btn p" data-modal-close>Understood</button>
        </div>
      </div>
    `;

    this.openModal(modal);
  }

  exportMarkdown() {
    const md = generateMarkdownReport(this.state);
    downloadFile("EuroMasters_Belgium_Germany_CS_Guide.md", md);
  }

  initGlobalShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Escape closes modals
      if (e.key === "Escape") {
        this.closeAllModals();
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
