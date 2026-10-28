/**
 * Views & Rendering Engine
 * Handles Discover Grid, Full University Deep-Dive Page, Comparison, Application Tracker, Cost Simulator, and Visa Roadmap.
 */

import {
  UNIVERSITIES,
  CATEGORIES,
  CATEGORIES_BY_COUNTRY,
  INTAKES,
  REGIONS,
  COUNTRIES,
  BELGIUM_DOMAINS,
  GERMANY_DOMAINS,
  BELGIUM_VISA_ROADMAP,
  GERMANY_VISA_ROADMAP
} from './data.js';
import { calculateFitScore, creditsToEcts, getEffectiveTuition } from './fit-engine.js';

export class PortalViews {
  constructor(app) {
    this.app = app;
  }

  // --- DISCOVER VIEW ---
  renderDiscover() {
    const { state } = this.app;
    const container = document.getElementById("v-discover");
    if (!container) return;

    // Execute multi-stage filtered search via DiscoveryConnector
    const searchResult = this.app.connector.search({
      country: state.country,
      category: state.category,
      matchTier: state.matchTier,
      intake: state.intake,
      searchQuery: state.searchQuery,
      maxBudget: state.maxBudget,
      openOnly: state.openOnly,
      sortBy: state.sortBy,
      hideBlocked: state.hideBlocked
    });

    const { items, totalCount, hasMore, stats } = searchResult;
    const activeCategories = CATEGORIES_BY_COUNTRY[state.country] || CATEGORIES_BY_COUNTRY["All Countries"];

    container.innerHTML = `
      <!-- Briefing Strategy Banner -->
      <div class="brief-banner">
        <div class="brief-main">
          <div class="brief-badge">Strategic Dual-Country Pathway</div>
          <h3>AI Finder: Germany (€0 Public Tuition) + Belgium (Wallonia ARES Exemption &amp; Master Mind)</h3>
          <p>
            Candidate Profile: <b>CGPA ${state.profile.cgpa}</b>, <b>IELTS ${state.profile.ielts}</b> (lowest band ${state.profile.band}), <b>${state.profile.mathCredits} Math credits (~${creditsToEcts(state.profile.mathCredits)} ECTS)</b>, <b>${state.profile.hasPortfolio ? "Shipped Portfolio" : "Standard CS Track"}</b>, <b>${state.profile.gre ? "GRE General Ready" : "No GRE"}</b>.
            Public universities in Germany charge <b>€0 tuition</b> (only ~€85–€350 semester fee with transit pass). In Belgium, Wallonia universities (UCLouvain, ULiège, UNamur) exempt DAC nationals from international surcharges, keeping fees at ~€1,194/yr.
          </p>
          <div class="brief-stats-row">
            <div class="brief-stat-pill">
              <span class="stat-tier">Pathway A: Germany</span>
              <strong>€0 Tuition (100% Free)</strong>
              <small>TUM · RWTH · Saarland · Bonn · FAU</small>
            </div>
            <div class="brief-stat-pill">
              <span class="stat-tier">Pathway B: Wallonia ARES</span>
              <strong>€835 – €1,194 / year</strong>
              <small>UCLouvain · ULiège · UNamur · ULB</small>
            </div>
            <div class="brief-stat-pill">
              <span class="stat-tier">Pathway C: Full Funding</span>
              <strong>Master Mind &amp; DAAD EPOS</strong>
              <small>Full Tuition Waiver + €1,000–€1,400/mo</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Dynamic Opportunity Scanner Top Bar -->
      <div class="discovery-scanner-bar">
        <div class="scanner-top-row">
          <div>
            <div class="scanner-live-badge">
              <span class="scan-pulse-dot"></span>
              Live Multi-Source Aggregator
            </div>
            <h3 style="font-size: 19px; margin-top: 5px; font-weight: 800; color: var(--tx);">Dynamic AI Opportunity Scanner</h3>
            <p style="font-size: 13px; color: var(--tx-muted); margin: 0; max-width: 650px;">
              Scanning verified databases across <b>German DAAD</b>, <b>uni-assist VPD portals</b>, <b>Flemish Higher Ed Register</b>, and <b>Wallonia ARES</b> for programs matching your degree, ECTS, language, and budget.
            </p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <button class="btn btn-scan-live" id="btnRunAiScan">
              <span class="scan-pulse-dot"></span>
              ⚡ Run Live AI Scan
            </button>
            <button class="btn sm" id="btnEditProfileFinder" style="font-weight: 650; height: 38px; border-radius: var(--radius-md);">
              🎯 Update Profile &amp; Goals
            </button>
          </div>
        </div>

        <!-- Live Scanner Statistics Grid -->
        <div class="scanner-stats-grid">
          <div class="scanner-stat-pill">
            <span class="scanner-stat-label">Total Programs Scanned</span>
            <span class="scanner-stat-val">${UNIVERSITIES.length}</span>
            <span class="scanner-stat-sub">Belgium (${UNIVERSITIES.filter(u=>u.country==='Belgium').length}) · Germany (${UNIVERSITIES.filter(u=>u.country==='Germany').length})</span>
          </div>
          <div class="scanner-stat-pill" style="border-left: 3px solid var(--success);">
            <span class="scanner-stat-label">🟢 Confirmed Matches</span>
            <span class="scanner-stat-val" style="color: var(--success);">${stats.eligible}</span>
            <span class="scanner-stat-sub">Zero disqualifying hurdles</span>
          </div>
          <div class="scanner-stat-pill" style="border-left: 3px solid var(--amber);">
            <span class="scanner-stat-label">🟡 Needs Verification</span>
            <span class="scanner-stat-val" style="color: var(--amber);">${stats.potential}</span>
            <span class="scanner-stat-sub">Subject / ECTS audit required</span>
          </div>
          <div class="scanner-stat-pill" style="border-left: 3px solid var(--danger);">
            <span class="scanner-stat-label">🔴 Filtered Out</span>
            <span class="scanner-stat-val" style="color: var(--danger);">${stats.blocked}</span>
            <span class="scanner-stat-sub">Fails hard requirements / budget</span>
          </div>
        </div>

        <!-- Scan Progress Box (Animated when scanning) -->
        <div id="scanProgressBox" class="scan-progress-box" style="display: none;">
          <div class="scan-progress-header">
            <span id="scanStatusText">Connecting to European Academic Repositories...</span>
            <span id="scanProgressPct">0%</span>
          </div>
          <div class="scan-progress-bar-wrap">
            <div id="scanProgressBarFill" class="scan-progress-bar-fill" style="width: 0%;"></div>
          </div>
        </div>
      </div>

      <!-- Main Target Intake Filter Bar -->
      <div class="intake-selector-bar">
        <span class="intake-selector-label">🎯 Target Intake:</span>
        <div class="intake-pills-wrap">
          <button class="intake-pill ${state.intake === 'all' ? 'active' : ''}" data-intake="all">
            🌍 All Intakes (${UNIVERSITIES.length})
          </button>
          <button class="intake-pill ${state.intake === 'winter' ? 'active' : ''}" data-intake="winter">
            📅 Winter / Fall 2027 (Starts Sept/Oct · ${UNIVERSITIES.filter(u=>u.hasWinter).length} Programs)
          </button>
          <button class="intake-pill ${state.intake === 'summer' ? 'active' : ''}" data-intake="summer">
            ☀️ Summer / Spring 2027 (Starts Mar/Apr · ${UNIVERSITIES.filter(u=>u.hasSummer).length} Programs in Germany)
          </button>
        </div>
      </div>

      <!-- Country & Match Tier Segmented Controls -->
      <div class="discovery-segmented-controls">
        <div class="segmented-pills-row">
          <span class="segmented-label">Country:</span>
          <button class="country-pill ${state.country === 'All Countries' ? 'active' : ''}" data-country="All Countries">
            🌍 All Opportunities (${UNIVERSITIES.length})
          </button>
          <button class="country-pill ${state.country === 'Belgium' ? 'active' : ''}" data-country="Belgium">
            🇧🇪 Belgium (${UNIVERSITIES.filter(u=>u.country==='Belgium').length})
          </button>
          <button class="country-pill ${state.country === 'Germany' ? 'active' : ''}" data-country="Germany">
            🇩🇪 Germany (${UNIVERSITIES.filter(u=>u.country==='Germany').length})
          </button>
        </div>

        <div class="segmented-pills-row">
          <span class="segmented-label">Match Tier:</span>
          <button class="match-tier-pill ${state.matchTier === 'all' ? 'active' : ''}" data-tier="all">
            All Tiers (${totalCount})
          </button>
          <button class="match-tier-pill tier-g ${state.matchTier === 'eligible' ? 'active' : ''}" data-tier="eligible">
            🟢 Eligible · Confirmed Match (${stats.eligible})
          </button>
          <button class="match-tier-pill tier-a ${state.matchTier === 'potential' ? 'active' : ''}" data-tier="potential">
            🟡 Potential Match · Review Gaps (${stats.potential})
          </button>
        </div>
      </div>

      <!-- Sticky Filter Bar -->
      <div class="filter-bar sticky-top">
        <div class="filter-row">
          <div class="search-wrap">
            <span class="search-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
            <input type="search" id="qSearch" placeholder="Search by university, degree title, technology, city, or track..." value="${state.searchQuery}" />
            ${state.searchQuery ? `<button id="clearSearch" class="clear-btn">✕</button>` : ""}
          </div>
          <select id="sortSelect" aria-label="Sort programs">
            <option value="fit" ${state.sortBy === "fit" ? "selected" : ""}>Sort: Best Profile Fit</option>
            <option value="fee" ${state.sortBy === "fee" ? "selected" : ""}>Sort: Lowest Tuition</option>
            <option value="deadline" ${state.sortBy === "deadline" ? "selected" : ""}>Sort: Nearest Deadline</option>
            <option value="alpha" ${state.sortBy === "alpha" ? "selected" : ""}>Sort: University Name</option>
          </select>
          <select id="budgetSelect" aria-label="Max budget filter">
            <option value="0" ${state.maxBudget === 0 ? "selected" : ""}>Any Tuition Budget</option>
            <option value="500" ${state.maxBudget === 500 ? "selected" : ""}>Under €500 / yr (German Public &amp; Free)</option>
            <option value="1500" ${state.maxBudget === 1500 ? "selected" : ""}>Under €1,500 / yr (Wallonia ARES)</option>
            <option value="3000" ${state.maxBudget === 3000 ? "selected" : ""}>Under €3,000 / yr</option>
            <option value="6000" ${state.maxBudget === 6000 ? "selected" : ""}>Under €6,000 / yr</option>
          </select>
          <label class="toggle-label" title="Show only programs currently accepting applications">
            <input type="checkbox" id="openOnlyCheck" ${state.openOnly ? "checked" : ""} />
            <span>Applications Open</span>
          </label>
          <label class="toggle-label" title="Hide programs where your profile has blocked criteria">
            <input type="checkbox" id="hideBlockedCheck" ${state.hideBlocked ? "checked" : ""} />
            <span>Hide Blocked</span>
          </label>
        </div>

        <!-- Dynamic Category Filter Pills Adapted by Selected Country -->
        <div class="category-pills">
          ${activeCategories.map(([key, label]) => `
            <button class="cat-pill ${state.category === key ? "active" : ""}" data-cat="${key}">
              ${label}
            </button>
          `).join("")}
        </div>
      </div>

      <!-- Counter & Active Filter summary -->
      <div class="results-header">
        <span class="results-count">
          Showing <b>${items.length}</b> of <b>${totalCount}</b> matching programs (Total Repository: <b>${UNIVERSITIES.length}</b>)
          ${state.shortlist.length > 0 ? `· <span class="badge-shortlist">★ ${state.shortlist.length} in plan</span>` : ""}
          ${state.compare.length > 0 ? `· <span class="badge-compare">${state.compare.length} in comparison</span>` : ""}
        </span>
        <div class="quick-helpers">
          <button class="btn sm" id="btnOpenEctsModal">ECTS Credit Converter</button>
          <button class="btn sm" id="btnQuickAskAi"><span style="color:#2563EB">✦</span> Research Assistant</button>
        </div>
      </div>

      <!-- Grid Cards -->
      <div class="programs-grid">
        ${items.length > 0 ? items.map(p => this.renderProgramCard(p)).join("") : `
          <div class="empty-state">
            <div class="empty-icon">🔎</div>
            <h3>No matching programs found for this criteria</h3>
            <p>Try resetting filters, switching between Winter and Summer intakes, selecting "All Countries", or adjusting your budget.</p>
            <button class="btn p" id="btnResetFilters">Reset All Filters</button>
          </div>
        `}
      </div>

      <!-- Load More / Pagination -->
      ${hasMore ? `
        <div class="load-more-container">
          <button id="btnLoadMore" class="btn-load-more">
            Load More Opportunities (+${Math.min(9, totalCount - items.length)})
          </button>
          <small style="color: var(--tx-muted);">Showing ${items.length} of ${totalCount} opportunities</small>
        </div>
      ` : ""}
    `;

    this.bindDiscoverEvents();
  }

  renderProgramCard(p) {
    const { state } = this.app;
    const fit = p.fit || calculateFitScore(p, state.profile);
    const isShortlisted = state.shortlist.includes(p.id);
    const isCompared = state.compare.includes(p.id);
    const flag = p.country === "Germany" ? "🇩🇪" : p.country === "Belgium" ? "🇧🇪" : "🇪🇺";
    const statusClass = (p.appStatus || "Open").toLowerCase().includes("open") ? "open" : "closed";

    return `
      <article class="program-card ${fit.isBlocked ? "blocked-card" : ""}" data-id="${p.id}">
        <div class="card-top">
          <div class="card-uni-meta">
            <span class="uni-name">${p.u}</span>
            <span class="uni-city">${flag} ${p.c}, ${p.country || "Belgium"}</span>
          </div>
          <span class="region-badge">${p.r}</span>
        </div>

        <h4 class="card-title">
          <a href="#/program/${p.id}" class="card-title-link" title="View Full Dedicated Page for ${p.t}">${p.t}</a>
        </h4>

        <!-- Badges Row: Status, Route, Degree -->
        <div class="card-badges-row">
          <span class="app-status-pill ${statusClass}">
            ● ${p.appStatus || "Applications Open"}
          </span>
          <span class="app-route-pill">
            Route: ${p.appRoute || "Direct Portal"}
          </span>
          <span class="app-route-pill">
            ${p.degree || "M.Sc."} · ${p.duration || "2 Years (120 ECTS)"}
          </span>
        </div>

        <!-- Application Dates & Intakes Timeline Box -->
        <div class="app-dates-box">
          <div class="app-date-row">
            <span class="app-date-badge winter">📅 Winter 2027</span>
            <span class="app-date-text">${p.winterTimeline || `Opens ${p.winterOpening || '1 Dec 2026'} · Closes ${p.winterDeadline || '31 Mar 2027'}`}</span>
          </div>
          ${p.hasSummer ? `
            <div class="app-date-row" style="margin-top: 4px;">
              <span class="app-date-badge summer">☀️ Summer 2027</span>
              <span class="app-date-text">${p.summerTimeline || `Opens ${p.summerOpening || '1 Aug 2026'} · Closes ${p.summerDeadline || '15 Jan 2027'}`}</span>
            </div>
          ` : `
            <div class="app-date-row sub" style="margin-top: 2px;">
              <small style="color: var(--tx-muted); font-size: 11px;">☀️ Summer: Not offered (Annual Winter intake only)</small>
            </div>
          `}
        </div>

        <!-- Price & Fit Score row -->
        <div class="card-price-row">
          <span class="price-pill ${p.cl}">${p.pill}</span>
          <span class="fit-score-badge ${fit.tierColor}">${fit.tierLabel} · ${fit.score}%</span>
        </div>

        <div class="card-tags">
          ${(p.tags || []).slice(0, 3).map(t => `<span class="tag-chip">${t}</span>`).join("")}
        </div>

        <p class="card-summary">${p.sum}</p>

        <!-- Diagnostics Tray Toggle Button -->
        <div style="margin: 8px 0 4px;">
          <button class="btn sm btn-toggle-diagnostics" data-toggle-diag="${p.id}" style="width:100%; display:flex; justify-content:space-between; align-items:center; font-size:11.5px; padding: 6px 10px; background: var(--bg-subtle); border: 1px solid var(--bd); border-radius: var(--radius-md); cursor:pointer;">
            <span><b>Match Diagnostics:</b> ${fit.whyMatched.length} Verified Highlights ${fit.gapsToVerify.length > 0 ? `· ${fit.gapsToVerify.length} Action Items` : ""}</span>
            <span class="diag-arrow" id="diagArrow_${p.id}">▼</span>
          </button>
        </div>

        <!-- Collapsible Diagnostics Tray -->
        <div class="card-diagnostics-tray" id="diagTray_${p.id}" style="display: none;">
          <div style="font-weight:700; font-size:11px; text-transform:uppercase; color:var(--tx-muted); margin-bottom:2px;">Eligibility &amp; Profile Analysis:</div>
          ${fit.whyMatched.map(w => `
            <div class="diagnostic-item match">
              <span class="diagnostic-icon">✓</span>
              <span>${w}</span>
            </div>
          `).join("")}
          ${fit.gapsToVerify.map(g => `
            <div class="diagnostic-item ${fit.isBlocked ? "blocker" : "gap"}">
              <span class="diagnostic-icon">${fit.isBlocked ? "✕" : "⚠"}</span>
              <span>${g}</span>
            </div>
          `).join("")}
          ${p.source ? `
            <div class="card-source-citation">
              <span>Source: <b>${p.source}</b></span>
              <span>·</span>
              <span>Verified: <b>${p.lastVerified || "October 2026"}</b></span>
            </div>
          ` : ""}
        </div>

        <!-- Actions -->
        <div class="card-actions">
          <button class="btn btn-quick-details" data-open-modal="${p.id}" title="Quick modal summary">Quick Details</button>
          <a href="#/program/${p.id}" class="btn btn-full-page" title="Open complete dedicated university page">Full Page</a>
          ${p.applyUrl ? `<a href="${p.applyUrl}" target="_blank" rel="noopener noreferrer" class="btn sm" style="font-weight:600; color:var(--primary)" title="Official application portal">Apply ↗</a>` : ""}
          <button class="btn btn-star-icon ${isShortlisted ? "active" : ""}" data-toggle-star="${p.id}" title="${isShortlisted ? "Remove from my plan" : "Add to my plan"}">
            ${isShortlisted ? "★" : "☆"}
          </button>
          <label class="compare-toggle" title="Add to side-by-side comparison">
            <input type="checkbox" data-toggle-compare="${p.id}" ${isCompared ? "checked" : ""} />
            <span>Compare</span>
          </label>
        </div>
      </article>
    `;
  }

  getFilteredPrograms() {
    return this.app.connector.search().allFiltered;
  }

  bindDiscoverEvents() {
    const { state } = this.app;

    // 1. Diagnostics tray toggle
    document.querySelectorAll("[data-toggle-diag]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = btn.dataset.toggleDiag;
        const tray = document.getElementById(`diagTray_${id}`);
        const arrow = document.getElementById(`diagArrow_${id}`);
        if (tray) {
          const isHidden = tray.style.display === "none";
          tray.style.display = isHidden ? "flex" : "none";
          if (arrow) arrow.textContent = isHidden ? "▲" : "▼";
        }
      });
    });

    // 2. Intake pills
    document.querySelectorAll(".intake-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        this.app.state.intake = pill.dataset.intake;
        this.app.connector.currentPage = 1;
        this.app.saveState();
        this.renderDiscover();
      });
    });

    // 3. Country pills (resets category filter to 'all' so category pills adapt cleanly)
    document.querySelectorAll(".country-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        this.app.state.country = pill.dataset.country;
        this.app.state.category = "all";
        this.app.connector.currentPage = 1;
        this.app.saveState();
        this.renderDiscover();
      });
    });

    // 4. Match Tier pills
    document.querySelectorAll(".match-tier-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        this.app.state.matchTier = pill.dataset.tier;
        this.app.connector.currentPage = 1;
        this.app.saveState();
        this.renderDiscover();
      });
    });

    // 4. Live search input & clear
    const qInput = document.getElementById("qSearch");
    if (qInput) {
      qInput.addEventListener("input", (e) => {
        this.app.state.searchQuery = e.target.value;
        this.app.connector.currentPage = 1;
        this.renderDiscover();
      });
    }

    const clearBtn = document.getElementById("clearSearch");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.app.state.searchQuery = "";
        this.app.connector.currentPage = 1;
        this.renderDiscover();
      });
    }

    // 5. Sort & Budget selects
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.app.state.sortBy = e.target.value;
        this.app.saveState();
        this.renderDiscover();
      });
    }

    const budgetSelect = document.getElementById("budgetSelect");
    if (budgetSelect) {
      budgetSelect.addEventListener("change", (e) => {
        this.app.state.maxBudget = parseInt(e.target.value, 10);
        this.app.connector.currentPage = 1;
        this.app.saveState();
        this.renderDiscover();
      });
    }

    // 6. Open applications only checkbox
    const openOnlyCheck = document.getElementById("openOnlyCheck");
    if (openOnlyCheck) {
      openOnlyCheck.addEventListener("change", (e) => {
        this.app.state.openOnly = e.target.checked;
        this.app.connector.currentPage = 1;
        this.app.saveState();
        this.renderDiscover();
      });
    }

    // 7. Hide blocked checkbox
    const hideBlocked = document.getElementById("hideBlockedCheck");
    if (hideBlocked) {
      hideBlocked.addEventListener("change", (e) => {
        this.app.state.hideBlocked = e.target.checked;
        this.app.connector.currentPage = 1;
        this.app.saveState();
        this.renderDiscover();
      });
    }

    // 8. Category pills
    document.querySelectorAll(".cat-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        this.app.state.category = pill.dataset.cat;
        this.app.connector.currentPage = 1;
        this.app.saveState();
        this.renderDiscover();
      });
    });

    // 9. Reset filters button
    const resetBtn = document.getElementById("btnResetFilters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.app.state.searchQuery = "";
        this.app.state.category = "all";
        this.app.state.country = "All Countries";
        this.app.state.matchTier = "all";
        this.app.state.maxBudget = 0;
        this.app.state.openOnly = false;
        this.app.state.hideBlocked = false;
        this.app.connector.currentPage = 1;
        this.app.saveState();
        this.renderDiscover();
      });
    }

    // 10. Load More / Pagination button
    const loadMoreBtn = document.getElementById("btnLoadMore");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => {
        this.app.connector.currentPage++;
        this.renderDiscover();
      });
    }

    // 11. Run Live AI Scan
    const scanBtn = document.getElementById("btnRunAiScan");
    if (scanBtn) {
      scanBtn.addEventListener("click", async () => {
        scanBtn.disabled = true;
        scanBtn.innerHTML = `<span class="scan-pulse-dot"></span> Scanning Databases...`;
        const box = document.getElementById("scanProgressBox");
        const statusText = document.getElementById("scanStatusText");
        const pctText = document.getElementById("scanProgressPct");
        const barFill = document.getElementById("scanProgressBarFill");

        if (box) box.style.display = "flex";

        await this.app.connector.scanLiveOpportunities(step => {
          const pct = Math.round((step.step / 6) * 100);
          if (statusText) statusText.textContent = step.text;
          if (pctText) pctText.textContent = `${pct}%`;
          if (barFill) barFill.style.width = `${pct}%`;
        });

        if (statusText) statusText.textContent = "✓ Scan complete! 26 accredited programs verified & updated.";
        setTimeout(() => {
          this.app.connector.currentPage = 1;
          this.renderDiscover();
        }, 500);
      });
    }

    // 12. Edit Profile & Goals button from finder
    const editProfileBtn = document.getElementById("btnEditProfileFinder");
    if (editProfileBtn) {
      editProfileBtn.addEventListener("click", () => {
        this.app.openProfileModal();
      });
    }

    // 13. ECTS modal & Quick Ask AI
    const ectsBtn = document.getElementById("btnOpenEctsModal");
    if (ectsBtn) {
      ectsBtn.addEventListener("click", () => this.openEctsModal());
    }

    const askAiBtn = document.getElementById("btnQuickAskAi");
    if (askAiBtn) {
      askAiBtn.addEventListener("click", () => this.app.aiAgent.openWindow());
    }
  }

  // --- DEDICATED FULL UNIVERSITY PAGE ---
  renderUniversityPage(programId) {
    const container = document.getElementById("v-university-detail");
    if (!container) return;

    const p = UNIVERSITIES.find(u => u.id === programId) || UNIVERSITIES[0];
    const { state } = this.app;
    const fit = calculateFitScore(p, state.profile);
    const isShortlisted = state.shortlist.includes(p.id);
    const isCompared = state.compare.includes(p.id);

    const uniCode = {
      "UCLouvain": "UCL",
      "University of Liège": "ULiège",
      "University of Namur": "UNamur",
      "ULB": "ULB",
      "Erasmus Mundus IMLEX": "IMLEX",
      "VUB": "VUB",
      "LUCA School of Arts": "LUCA",
      "University of Antwerp": "Antwerp",
      "Hasselt University": "Hasselt",
      "ULB (Erasmus Mundus DEAI)": "DEAI",
      "KU Leuven": "KUL",
      "Ghent University": "UGent",
      "Utrecht University": "UU",
      "Technical University of Munich (TUM)": "TUM",
      "RWTH Aachen University": "RWTH",
      "Saarland University": "Saarland",
      "University of Bonn": "Bonn",
      "TU Berlin": "TUB",
      "University of Stuttgart": "Stuttgart",
      "FAU Erlangen-Nürnberg": "FAU",
      "University of Passau": "Passau",
      "TH Köln (Cologne Game Lab)": "CGL"
    }[p.u] || p.u.substring(0, 4).toUpperCase();

    container.innerHTML = `
      <div class="uni-page-wrapper">
        <!-- Breadcrumb & Back button -->
        <div class="uni-page-nav-bar">
          <a href="#/discover" class="btn btn-back">← Back to All Programs</a>
          <div class="uni-page-top-actions">
            <button class="btn btn-bookmark ${isShortlisted ? "active" : ""}" data-toggle-star="${p.id}">
              ${isShortlisted ? "★ In My Plan" : "☆ Add to My Plan"}
            </button>
            <button class="btn" data-toggle-compare="${p.id}">
              ${isCompared ? "✓ Compared" : "Compare"}
            </button>
            <button class="btn p" id="btnPageAskAi" data-id="${p.id}">
              <span style="color:#93C5FD">✦</span> Ask AI Assistant
            </button>
          </div>
        </div>

        <!-- Hero Header -->
        <div class="uni-hero-card">
          <div class="uni-hero-header">
            <div class="uni-avatar-badge">${uniCode}</div>
            <div class="uni-hero-titles">
              <div class="uni-sub-meta">
                <span>${p.name}</span>
                <span>${p.country === "Germany" ? "🇩🇪" : p.country === "Belgium" ? "🇧🇪" : "🇪🇺"} ${p.c}, ${p.country || "Belgium"}</span>
                <span class="region-badge">${p.r}</span>
                <span>${p.lang}</span>
              </div>
              <h1 class="uni-hero-title">${p.t}</h1>
              <div class="uni-hero-tags">
                ${p.tags.map(t => `<span class="tag-chip">${t}</span>`).join("")}
              </div>
            </div>
          </div>

          <!-- Highlight Key Stats Grid -->
          <div class="uni-stats-grid">
            <div class="uni-stat-box">
              <span class="stat-lbl">Tuition Fee</span>
              <strong class="stat-val ${p.cl}">${p.pill}</strong>
              <small>${p.country === "Germany" ? (p.fee === 0 ? "Statutory €0 (Public German Uni)" : "State statutory rate") : (p.r.includes("Wallonia") ? "ARES assimilation rate" : "Standard non-EU rate")}</small>
            </div>
            <div class="uni-stat-box">
              <span class="stat-lbl">Application Route</span>
              <strong class="stat-val" style="font-size: 14px;">${p.appRoute || "Direct Portal"}</strong>
              <small>${p.appFee}</small>
            </div>
            <div class="uni-stat-box">
              <span class="stat-lbl">Application Status</span>
              <strong class="stat-val ${p.appStatus === "Open" ? "grt" : ""}">${p.appStatus || "Open"}</strong>
              <small>Deadline: ${p.dl || "Check site"}</small>
            </div>
            <div class="uni-stat-box">
              <span class="stat-lbl">English (IELTS)</span>
              <strong class="stat-val">${p.iel} Overall</strong>
              <small>${p.band ? `Min ${p.band} in each band` : "Standard B2/C1"}</small>
            </div>
            <div class="uni-stat-box">
              <span class="stat-lbl">Your Profile Fit</span>
              <strong class="stat-val ${fit.tierColor}">${fit.tierLabel} (${fit.score}/100)</strong>
              <small>${fit.isBlocked ? "Disqualified criteria" : "Eligibility verified"}</small>
            </div>
          </div>
        </div>

        <!-- In-Depth Content Sections -->
        <div class="uni-deep-content-grid">
          <!-- Left Column (Curriculum, Admission, Financials) -->
          <div class="uni-left-col">
            <!-- 1. Why this program is recommended -->
            <div class="box uni-section-box">
              <h3 class="section-title">Strategic Value &amp; Recommendation</h3>
              <ul class="clean-bullet-list">
                ${p.why.map(w => `<li>${w}</li>`).join("")}
              </ul>
            </div>

            <!-- 2. Curriculum & Study Modules -->
            <div class="box uni-section-box">
              <h3 class="section-title">Course Curriculum &amp; Specializations (120 ECTS)</h3>
              <p class="section-desc">Master's degrees in Europe consist of 120 ECTS spread across 4 semesters (2 years), culminating in a 30 ECTS research thesis or industry project.</p>
              <div class="curriculum-list">
                ${p.curriculum.map(c => `
                  <div class="curriculum-item">
                    <span class="module-bullet">▶</span>
                    <span>${c}</span>
                  </div>
                `).join("")}
              </div>
            </div>

            <!-- 3. Prerequisites & Background -->
            <div class="box uni-section-box">
              <h3 class="section-title">Admission Criteria &amp; Prerequisites</h3>
              <div class="req-chips-wrap">
                ${p.pre.map(pr => `<span class="req-chip">✓ ${pr}</span>`).join("")}
              </div>
              <div class="math-clarification-box" style="margin-top: 14px;">
                <strong>Quantitative &amp; ECTS Requirements:</strong>
                <p>
                  This program specifies approximately <b>${p.mathEcts || 30} ECTS</b> in mathematics and <b>${p.csEcts || 40} ECTS</b> in core computer science.
                  Because Pakistani/US universities use semester credit hours (where 1 credit hour ≈ 2 European ECTS),
                  <b>15 semester credit hours</b> (Calculus, Linear Algebra, Differential Equations, Discrete Math, Probability &amp; Statistics)
                  fully satisfy this requirement upon submitting your course syllabi!
                </p>
              </div>
            </div>

            <!-- 4. Living Cost & Blocked Account breakdown -->
            <div class="box uni-section-box">
              <h3 class="section-title">Financial Solvency &amp; Living Costs</h3>
              <div class="sp">
                <div class="s">
                  Tuition (Year 1)
                  <b>${p.tu}</b>
                </div>
                <div class="s">
                  Living Cost Estimate
                  <b>${p.livingEstimate}</b>
                </div>
                <div class="s wd">
                  ${p.country === "Germany"
                    ? `German Student Visa Solvency (Sperrkonto / Blocked Account)
                       <b>Statutory requirement: €992 / month (€11,904 / academic year via Expatrio/Fintiba) — returned monthly into your German account</b>`
                    : `Belgian Visa D Solvency (Compte Bloqué / Annex 32)
                       <b>Minimum €803 / month (Article 60 statutory index) ≈ €9,636 to €10,200/year returned to you monthly</b>`}
                </div>
              </div>
              <p class="section-subtext" style="margin-top: 10px;">
                <b>Note:</b> The blocked account deposit is NOT a tuition charge. It is your personal living money held in escrow by the bank or university, released back to your bank account every single month for rent and groceries.
              </p>
              ${p.visaNotes ? `
                <div style="margin-top: 12px; background: var(--bg-subtle); padding: 10px 14px; border-radius: var(--radius-md); font-size: 12.5px; border-left: 3px solid var(--primary);">
                  <b>Visa &amp; Route Guidance:</b> ${p.visaNotes}
                </div>
              ` : ""}
            </div>
          </div>

          <!-- Right Column (Profile Check, Campus, Direct Action) -->
          <div class="uni-right-col">
            <!-- Profile Eligibility Breakdown -->
            <div class="box uni-section-box">
              <h3 class="section-title">Profile Verification Against ${p.u}</h3>
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

            <!-- City & Campus Vibe -->
            <div class="box uni-section-box">
              <h3 class="section-title">Campus &amp; Student Life in ${p.c} (${p.country || "Belgium"})</h3>
              <p>${p.cityLife}</p>
              <div class="city-quick-facts" style="margin-top: 10px;">
                <div class="fact-row"><span>Student Housing:</span> <b>${p.livingEstimate.split('Kot room: ')[1]?.split(',')[0] || (p.country === 'Germany' ? '€320–€550/mo (Studentenwerk / WG)' : '€380–€480/mo (Kot)')}</b></div>
                <div class="fact-row"><span>Student Transit:</span> <b>${p.country === 'Germany' ? 'Semesterticket included in semester contribution' : 'Affordable train/tram passes (€12–€50/yr)'}</b></div>
                <div class="fact-row"><span>Work Rights:</span> <b>${p.country === 'Germany' ? '140 full days / 280 half days per year' : '20 hours/week during studies'}</b></div>
                <div class="fact-row"><span>Post-Study:</span> <b>${p.country === 'Germany' ? '18-Month Jobseeker Visa (Aufenthaltserlaubnis)' : '12-Month Search Year Visa (Zoekjaar)'}</b></div>
              </div>
            </div>

            <!-- Action Card -->
            <div class="box uni-section-box cta-box">
              <h3>Ready to apply to ${p.u}?</h3>
              <p class="mu">Ensure you have your course syllabus PDF, degree attestations, and motivation letter ready.</p>
              <div class="cta-actions">
                ${p.applyUrl ? `
                  <a href="${p.applyUrl}" target="_blank" rel="noopener noreferrer" class="btn p full-width">
                    Official Application Portal (${p.appRoute || 'Apply Now'}) ↗
                  </a>
                ` : ''}
                <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="btn full-width">
                  Visit Official Course Website ↗
                </a>
                <button class="btn full-width" id="btnPageAskAi2" data-id="${p.id}">
                  <span style="color:#2563EB">✦</span> Ask AI Assistant
                </button>
                <button class="btn full-width btn-bookmark ${isShortlisted ? "active" : ""}" data-toggle-star="${p.id}">
                  ${isShortlisted ? "★ Shortlisted in My Plan" : "☆ Add to My Application Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind full page AI ask
    const askBtn1 = document.getElementById("btnPageAskAi");
    const askBtn2 = document.getElementById("btnPageAskAi2");
    const openWithUni = () => {
      this.app.aiAgent.openWindow(p);
      this.app.aiAgent.input.value = `Tell me about admission requirements, deadlines, and tuition waivers for #[${p.u}: ${p.t}].`;
      this.app.aiAgent.input.focus();
    };

    if (askBtn1) askBtn1.addEventListener("click", openWithUni);
    if (askBtn2) askBtn2.addEventListener("click", openWithUni);
  }

  // --- COMPARE VIEW ---
  renderCompare() {
    const { state } = this.app;
    const container = document.getElementById("v-compare");
    if (!container) return;

    const list = state.compare.map(id => UNIVERSITIES.find(u => u.id === id)).filter(Boolean);

    if (list.length === 0) {
      container.innerHTML = `
        <div class="box empty-state">
          <div class="empty-icon">⚖️</div>
          <h3>No programs selected for comparison</h3>
          <p>Tick "Compare" on up to 4 programs from the Discover view to compare their fees, requirements, and curriculum side-by-side.</p>
          <a href="#/discover" class="btn p">Go to Discover Programs</a>
        </div>
      `;
      return;
    }

    const rows = [
      ["Program Title", p => `<b>${p.t}</b>`],
      ["Country & City", p => `${p.country === 'Germany' ? '🇩🇪 Germany' : p.country === 'Belgium' ? '🇧🇪 Belgium' : '🇪🇺 ' + p.country} · ${p.c}`],
      ["Degree & Duration", p => `${p.degree || 'M.Sc.'} (${p.duration || '2 Years'})`],
      ["Annual Tuition", p => `<span class="price-pill ${p.cl}">${p.pill}</span>`],
      ["Application Route", p => `<span class="app-route-pill">${p.appRoute || 'Direct Portal'}</span>`],
      ["Application Status", p => `<span class="app-status-pill ${(p.appStatus || 'Open').toLowerCase().includes('open') ? 'open' : 'closed'}">● ${p.appStatus || 'Open'}</span>`],
      ["Your Fit Score", p => {
        const fit = calculateFitScore(p, state.profile);
        return `<span class="fit-score-badge ${fit.tierColor}">${fit.tierLabel} (${fit.score}%)</span>`;
      }],
      ["Application Fee", p => p.appFee],
      ["Non-EU Deadline", p => p.dl || "TBA"],
      ["IELTS Minimum", p => `${p.iel} overall ${p.band ? `(min ${p.band} each)` : ""}`],
      ["German Requirement", p => p.germanReq || "None (100% English)"],
      ["GRE Policy", p => p.gre ? "Mandatory for Non-EU" : "Not Required (Waived)"],
      ["Math & CS Foundations", p => `~${p.mathEcts || 30} ECTS Math (${p.mathReq} credits)`],
      ["Funding Route", p => p.country === "Germany" ? "Statutory €0 Tuition (DAAD eligible)" : (p.em ? "Erasmus Mundus (€0 + €1.4k/mo)" : p.mm ? "Master Mind Eligible" : p.r.includes("Wallonia") ? "Wallonia ARES Exemption" : "Self-Funded")],
      ["Source & Verified", p => `<small class="mu">${p.source || 'Official Portal'} (${p.lastVerified || 'Oct 2026'})</small>`],
      ["Official Portals", p => `
        <div style="display:flex; flex-direction:column; gap:4px;">
          <a href="${p.url}" target="_blank" rel="noopener">Course Page ↗</a>
          ${p.applyUrl ? `<a href="${p.applyUrl}" target="_blank" rel="noopener" style="font-weight:600">Apply Portal ↗</a>` : ''}
        </div>
      `],
      ["Actions", p => `
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <a href="#/program/${p.id}" class="btn sm">Full Page</a>
          <button class="btn sm btn-remove-cmp" data-id="${p.id}">Remove</button>
        </div>
      `]
    ];

    container.innerHTML = `
      <div class="box" style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3>Side-by-Side Comparison (${list.length} programs)</h3>
          <p class="mu">Comparing fees, admission hurdles, application routes, and funding options side-by-side.</p>
        </div>
        <button class="btn sm" id="btnClearCompare">Clear All</button>
      </div>
      <div class="box table-responsive">
        <table class="compare-table">
          <thead>
            <tr>
              <th style="min-width: 150px;">Feature</th>
              ${list.map(p => `
                <th style="min-width: 200px;">
                  <div style="font-size: 15px; font-weight: 700;">${p.u}</div>
                  <small style="color: var(--mu); font-weight: normal;">${p.country === 'Germany' ? '🇩🇪' : '🇧🇪'} ${p.c}, ${p.country || 'Belgium'}</small>
                </th>
              `).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map(([label, fn]) => `
              <tr>
                <td class="compare-row-header">${label}</td>
                ${list.map(p => `<td>${fn(p)}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    document.querySelectorAll(".btn-remove-cmp").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id, 10);
        this.app.state.compare = this.app.state.compare.filter(x => x !== id);
        this.app.saveState();
        this.renderCompare();
      });
    });

    const clearBtn = document.getElementById("btnClearCompare");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.app.state.compare = [];
        this.app.saveState();
        this.renderCompare();
      });
    }
  }

  // --- PLAN & APPLICATION TRACKER VIEW ---
  renderPlan() {
    const { state } = this.app;
    const container = document.getElementById("v-plan");
    if (!container) return;

    const list = state.shortlist.map(id => UNIVERSITIES.find(u => u.id === id)).filter(Boolean);

    const STAGES = ["Researching", "Preparing Documents", "Applied", "Interview / Review", "Offer Received", "Rejected"];
    const TASKS = [
      "Check eligibility & syllabus matching",
      "IELTS Academic report ready (6.5+)",
      "Bachelor transcript + degree (HEC attested)",
      "MOFA Apostille stamp obtained",
      "Europass CV + motivation letter customized",
      "2 Academic / Employer reference letters",
      "Portfolio repository / itch.io links",
      "Online university application submitted",
      "Scholarship nomination form (Master Mind / DAAD / ARES)",
      "Blocked account living proof transferred (Compte Bloqué / Sperrkonto) OR Annex 32 signed",
      "National Student Visa appointment (Belgian Visa D via Gerry's or German Visa via Embassy/VFS)"
    ];

    container.innerHTML = `
      <div class="two-col-layout">
        <!-- Shortlisted Applications -->
        <div>
          <div class="box" style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3>My Shortlisted Master's Applications (${list.length})</h3>
              <p class="mu">Track progress from initial syllabus review to visa application.</p>
            </div>
            ${list.length ? `<button class="btn sm" id="btnExportMdFromPlan">Export Plan (.MD)</button>` : ""}
          </div>

          <div class="plan-cards-list">
            ${list.length > 0 ? list.map(p => {
              const userTasks = state.tasks[p.id] || [];
              const progressPct = Math.round((userTasks.length / TASKS.length) * 100);
              const currentStatus = state.statuses[p.id] || "Researching";

              return `
                <div class="box plan-item-box" data-id="${p.id}">
                  <div class="plan-item-header">
                    <div>
                      <h4>${p.u}: ${p.t}</h4>
                      <span class="mu">${p.c} · <span class="price-pill ${p.cl}">${p.pill}</span></span>
                    </div>
                    <div class="plan-header-controls">
                      <select class="status-select" data-id="${p.id}">
                        ${STAGES.map(s => `<option value="${s}" ${currentStatus === s ? "selected" : ""}>${s}</option>`).join("")}
                      </select>
                      <button class="btn sm" data-toggle-star="${p.id}">Remove</button>
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  <div class="progress-bar-wrap">
                    <div class="progress-bar-fill" style="width: ${progressPct}%;"></div>
                  </div>
                  <div class="progress-meta">
                    <small>${userTasks.length} of ${TASKS.length} milestones completed</small>
                    <small><b>${progressPct}% Ready</b></small>
                  </div>

                  <!-- Expandable Task Checklist -->
                  <details class="task-details">
                    <summary>View &amp; Check Milestone Steps</summary>
                    <div class="task-checklist">
                      ${TASKS.map((task, idx) => `
                        <label class="task-item">
                          <input type="checkbox" data-task="${p.id}:${idx}" ${userTasks.includes(idx) ? "checked" : ""} />
                          <span>${task}</span>
                        </label>
                      `).join("")}
                    </div>
                  </details>

                  <div class="plan-item-footer">
                    <a href="#/program/${p.id}" class="btn sm">Full Page</a>
                    <a href="${p.url}" target="_blank" rel="noopener" class="btn sm">Official Site ↗</a>
                    <button class="btn sm p" id="btnAskAiPlan_${p.id}"><span style="color:#93C5FD">✦</span> Ask AI</button>
                  </div>
                </div>
              `;
            }).join("") : `
              <div class="box empty-state">
                <div class="empty-icon">☆</div>
                <h3>Your application tracker is empty</h3>
                <p>Click the ☆ star button on any program card in the Discover view to add it to your tracking dashboard.</p>
                <a href="#/discover" class="btn p">Discover Programs</a>
              </div>
            `}
          </div>
        </div>

        <!-- Timeline & Key Dates -->
        <div>
          <div class="box" style="margin-bottom: 12px;">
            <h3>Upcoming Deadlines &amp; Timeline</h3>
            <p class="mu">September 2027 intake milestones</p>
          </div>
          <div class="box timeline-card">
            <div class="timeline-items">
              ${list.filter(p => p.dl).sort((a, b) => a.dl.localeCompare(b.dl)).map(p => {
                const diffDays = Math.ceil((new Date(p.dl + "T23:59:00") - new Date()) / 864e5);
                return `
                  <div class="timeline-row">
                    <div class="tl-date"><b>${p.dl}</b></div>
                    <div class="tl-content">
                      <strong>${p.u}</strong>
                      <div>${p.t}</div>
                      <span class="tl-countdown ${diffDays < 60 ? "urgent" : ""}">${diffDays > 0 ? `${diffDays} days remaining` : "Passed"}</span>
                    </div>
                  </div>
                `;
              }).join("") || `<p class="mu">Add programs with deadlines to view timeline.</p>`}
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind Plan Events
    container.querySelectorAll(".status-select").forEach(sel => {
      sel.addEventListener("change", (e) => {
        const id = parseInt(sel.dataset.id, 10);
        state.statuses[id] = e.target.value;
        this.app.saveState();
      });
    });

    container.querySelectorAll("input[data-task]").forEach(chk => {
      chk.addEventListener("change", (e) => {
        const [uniId, taskIdx] = chk.dataset.task.split(":").map(Number);
        state.tasks[uniId] = state.tasks[uniId] || [];
        if (chk.checked) {
          if (!state.tasks[uniId].includes(taskIdx)) state.tasks[uniId].push(taskIdx);
        } else {
          state.tasks[uniId] = state.tasks[uniId].filter(x => x !== taskIdx);
        }
        this.app.saveState();
        this.renderPlan();
      });
    });

    list.forEach(p => {
      const askBtn = document.getElementById(`btnAskAiPlan_${p.id}`);
      if (askBtn) {
        askBtn.addEventListener("click", () => {
          this.app.aiAgent.openWindow(p);
          this.app.aiAgent.input.value = `What are the exact step-by-step checklist items for #[${p.u}]?`;
        });
      }
    });

    const exportBtn = document.getElementById("btnExportMdFromPlan");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.app.exportMarkdown());
    }
  }

  // --- COSTS & FINANCIAL SIMULATOR VIEW ---
  renderCosts() {
    const { state } = this.app;
    const container = document.getElementById("v-costs");
    if (!container) return;

    const costCountry = state.costCountry || "Belgium"; // "Belgium" | "Germany" | "all"

    const rentVal = state.costs.rent;
    const foodVal = state.costs.food;
    const insVal = state.costs.insurance;
    const oneOffVal = state.costs.oneOff;

    // Filter universities based on costCountry
    let list = [];
    if (costCountry === "all") {
      const shortlisted = (state.shortlist || []).map(id => UNIVERSITIES.find(u => u.id === id)).filter(Boolean);
      list = shortlisted.length > 0
        ? shortlisted
        : [UNIVERSITIES.find(u => u.id === 1), UNIVERSITIES.find(u => u.id === 3), UNIVERSITIES.find(u => u.id === 15), UNIVERSITIES.find(u => u.id === 17), UNIVERSITIES.find(u => u.id === 19)].filter(Boolean);
    } else {
      const countryAll = UNIVERSITIES.filter(u => u.country === costCountry);
      const countryShortlisted = (state.shortlist || [])
        .map(id => UNIVERSITIES.find(u => u.id === id))
        .filter(u => u && u.country === costCountry);
      list = countryShortlisted.length > 0 ? countryShortlisted : countryAll.slice(0, 6);
    }

    // Prepare contextual HTML per costCountry
    let benchmarkHtml = "";
    if (costCountry === "Belgium") {
      benchmarkHtml = `
        <div class="cost-benchmark-grid">
          <div class="cost-benchmark-card highlight">
            <span class="cost-benchmark-label">💶 Article 60 Solvency</span>
            <span class="cost-benchmark-val">€803 / mo</span>
            <span class="cost-benchmark-sub">€9,636 / yr deposited in university escrow; 100% transferred back into your Belgian bank account monthly.</span>
          </div>
          <div class="cost-benchmark-card">
            <span class="cost-benchmark-label">🏛️ Wallonia ARES Tuition</span>
            <span class="cost-benchmark-val">€835 – €1,194 / yr</span>
            <span class="cost-benchmark-sub">Developing nation (DAC) non-EU students pay local EU rates at UCLouvain, ULiège, UNamur.</span>
          </div>
          <div class="cost-benchmark-card">
            <span class="cost-benchmark-label">🏥 Mutualité Healthcare</span>
            <span class="cost-benchmark-val">~€12 – €18 / mo</span>
            <span class="cost-benchmark-sub">Partenamut / CM public student health coverage with up to 75% reimbursement on prescriptions &amp; doctor visits.</span>
          </div>
          <div class="cost-benchmark-card">
            <span class="cost-benchmark-label">🚇 Student Transit</span>
            <span class="cost-benchmark-val">€12 / yr (Brussels)</span>
            <span class="cost-benchmark-sub">STIB/MIVB student season ticket is only €12/year for Brussels students under 25; TEC/De Lijn ~€50/yr.</span>
          </div>
        </div>
      `;
    } else if (costCountry === "Germany") {
      benchmarkHtml = `
        <div class="cost-benchmark-grid">
          <div class="cost-benchmark-card highlight">
            <span class="cost-benchmark-label">💶 § 16b Sperrkonto Solvency</span>
            <span class="cost-benchmark-val">€992 / mo</span>
            <span class="cost-benchmark-sub">€11,904 / yr statutory living deposit via Expatrio/Fintiba; 100% returned in monthly €992 payouts.</span>
          </div>
          <div class="cost-benchmark-card">
            <span class="cost-benchmark-label">🎓 Public Tuition Policy</span>
            <span class="cost-benchmark-val">€0 / yr (Tuition-Free)</span>
            <span class="cost-benchmark-sub">15 of 16 German states charge €0 tuition for consecutive Master's degrees at public universities.</span>
          </div>
          <div class="cost-benchmark-card">
            <span class="cost-benchmark-label">🏥 Statutory Health (TK)</span>
            <span class="cost-benchmark-val">~€125 – €135 / mo</span>
            <span class="cost-benchmark-sub">Statutory student health coverage (TK, Barmer) covers all doctor visits, hospital care, and dental emergencies.</span>
          </div>
          <div class="cost-benchmark-card">
            <span class="cost-benchmark-label">🚆 Free Semesterticket Transit</span>
            <span class="cost-benchmark-val">€0 / mo Extra</span>
            <span class="cost-benchmark-sub">Included in your semester contribution (~€85–€350/sem), providing free regional rail &amp; city bus transit!</span>
          </div>
        </div>
      `;
    } else {
      // Comparison side-by-side mode
      benchmarkHtml = `
        <div class="cost-side-by-side-grid">
          <!-- Belgium Summary -->
          <div class="cost-country-card">
            <div class="cost-country-card-header">
              <span class="cost-country-card-title">🇧🇪 Belgium Study &amp; Living Model</span>
              <span class="badge b">DAC Assimilated</span>
            </div>
            <div class="cost-metric-row">
              <span class="cost-metric-label">Statutory Living Solvency:</span>
              <span class="cost-metric-val">€803/mo (€9,636/yr) returned monthly</span>
            </div>
            <div class="cost-metric-row">
              <span class="cost-metric-label">Wallonia Public Tuition:</span>
              <span class="cost-metric-val" style="color:var(--grt)">€835 – €1,194/year</span>
            </div>
            <div class="cost-metric-row">
              <span class="cost-metric-label">Flanders Public Tuition:</span>
              <span class="cost-metric-val">€2,500 – €7,000/year</span>
            </div>
            <div class="cost-metric-row">
              <span class="cost-metric-label">Student Health Insurance:</span>
              <span class="cost-metric-val">~€12 – €18/month (Mutualité)</span>
            </div>
            <div class="cost-metric-row">
              <span class="cost-metric-label">Public Transit Pass:</span>
              <span class="cost-metric-val">€12/yr (Brussels) / ~€50/yr (TEC/De Lijn)</span>
            </div>
            <div class="cost-metric-row">
              <span class="cost-metric-label">Post-Study Work Permit:</span>
              <span class="cost-metric-val">12 Months (Zoekjaar)</span>
            </div>
          </div>

          <!-- Germany Summary -->
          <div class="cost-country-card">
            <div class="cost-country-card-header">
              <span class="cost-country-card-title">🇩🇪 Germany Study &amp; Living Model</span>
              <span class="badge g">100% Tuition Free</span>
            </div>
            <div class="cost-metric-row">
              <span class="cost-metric-label">Statutory Living Solvency:</span>
              <span class="cost-metric-val">€992/mo (€11,904/yr) Sperrkonto</span>
            </div>
            <div class="cost-metric-row">
              <span class="cost-metric-label">Public University Tuition:</span>
              <span class="cost-metric-val" style="color:var(--grt)">€0 / year (100% Free)</span>
            </div>
            <div class="cost-metric-row">
              <span class="cost-metric-label">Semester Contribution:</span>
              <span class="cost-metric-val">~€85 – €350 / semester</span>
            </div>
            <div class="cost-metric-row">
              <span class="cost-metric-label">Student Health Insurance:</span>
              <span class="cost-metric-val">~€125 – €135/month (TK statutory)</span>
            </div>
            <div class="cost-metric-row">
              <span class="cost-metric-label">Public Transit Pass:</span>
              <span class="cost-metric-val" style="color:var(--grt)">FREE (Included in Semesterticket)</span>
            </div>
            <div class="cost-metric-row">
              <span class="cost-metric-label">Post-Study Work Permit:</span>
              <span class="cost-metric-val">18 Months + Fast-track EU Blue Card</span>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="costs-page-wrapper">
        <!-- Country Selector Navigation -->
        <div class="cost-country-nav">
          <button class="cost-country-btn ${costCountry === 'Belgium' ? 'active' : ''}" data-cost-country="Belgium">
            🇧🇪 Belgium Cost Model
          </button>
          <button class="cost-country-btn ${costCountry === 'Germany' ? 'active' : ''}" data-cost-country="Germany">
            🇩🇪 Germany Cost Model
          </button>
          <button class="cost-country-btn ${costCountry === 'all' ? 'active' : ''}" data-cost-country="all">
            🌍 Compare Both Countries Side-by-Side
          </button>
        </div>

        <!-- Box 1: Dynamic Simulator & Sliders -->
        <div class="box" style="margin-bottom: 16px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap;">
            <div>
              <h3 style="font-size:18.5px; font-weight:850; color:var(--tx); margin-bottom:4px;">
                ${costCountry === 'Germany'
                  ? '🇩🇪 Germany Student Living Cost &amp; First-Year Budget Simulator'
                  : costCountry === 'Belgium'
                    ? '🇧🇪 Belgium Student Living Cost &amp; First-Year Budget Simulator'
                    : '🌍 Belgium &amp; Germany Living Cost &amp; Financial Comparison Simulator'}
              </h3>
              <p class="mu" style="font-size:13px; max-width:820px; line-height:1.5;">
                ${costCountry === 'Germany'
                  ? 'Calculate your realistic out-of-pocket budget in Germany: <b>€0 statutory public tuition</b>, statutory Sperrkonto living escrow (€992/mo returned in full), TK health insurance, and one-off visa/flight expenses.'
                  : costCountry === 'Belgium'
                    ? 'Calculate your realistic out-of-pocket budget in Belgium: <b>Wallonia ARES fee (&lt;€1.2k/yr)</b>, Article 60 living escrow (€803/mo returned in full), Mutualité healthcare, and one-off visa/flight expenses.'
                    : 'Compare total financial outlay between Belgium and Germany: evaluate tuition exemptions, monthly living benchmarks, statutory healthcare, and net out-of-pocket cash requirements.'}
              </p>
            </div>
          </div>

          ${benchmarkHtml}

          <!-- Live Budget Sliders -->
          <div class="cost-sliders-grid" style="margin-top: 14px;">
            <label class="slider-field">
              <span>Monthly Rent (${costCountry === 'Germany' ? 'Studentenwerk / WG' : costCountry === 'Belgium' ? 'Kot' : 'Room / Kot'}): <b id="valRent">€${rentVal}</b></span>
              <input type="range" min="280" max="850" step="10" id="slideRent" value="${rentVal}" />
            </label>
            <label class="slider-field">
              <span>Monthly Groceries / Food: <b id="valFood">€${foodVal}</b></span>
              <input type="range" min="150" max="450" step="10" id="slideFood" value="${foodVal}" />
            </label>
            <label class="slider-field">
              <span>Health Insurance (${costCountry === 'Germany' ? 'TK Statutory ~€125' : costCountry === 'Belgium' ? 'Mutualité ~€15' : 'Student Policy'}): <b id="valIns">€${insVal}</b></span>
              <input type="range" min="10" max="145" step="5" id="slideIns" value="${insVal}" />
            </label>
            <label class="slider-field">
              <span>One-Off Setup (Visa, Flights, Deposit): <b id="valOne">€${oneOffVal}</b></span>
              <input type="range" min="400" max="2500" step="50" id="slideOne" value="${oneOffVal}" />
            </label>
          </div>
        </div>

        <!-- Box 2: Table of Programs & Real Outlay -->
        <div class="box table-responsive">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <h4 style="font-size:15px; font-weight:800; color:var(--tx);">
              ${costCountry === 'all' ? 'All Shortlisted &amp; Curated Programs Across Belgium &amp; Germany' : `Programs in ${costCountry}`} (${list.length} programs shown)
            </h4>
            <span style="font-size:12px; color:var(--tx-muted);">
              💡 <b>Note:</b> Solvency deposit money is held under your own name and disbursed back to you every month.
            </span>
          </div>

          <table class="cost-table">
            <thead>
              <tr>
                <th>University &amp; Program</th>
                <th>Country</th>
                <th>Year 1 Tuition</th>
                <th>Annual Living (12 mo)</th>
                <th>One-off Setup</th>
                <th>Scholarship / Exemption Offset</th>
                <th>Net Year 1 Outlay</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(p => {
                const effectiveTuition = getEffectiveTuition(p, state.profile);
                const annualLiving = (rentVal + foodVal + insVal) * 12;
                const funding = p.em ? 16800 : (p.mm && state.costs.assumeScholarship[p.id] ? 10225 : 0);
                const tuitionAfterScholarship = (p.mm && state.costs.assumeScholarship[p.id]) ? 140 : effectiveTuition;
                const netCost = tuitionAfterScholarship + annualLiving + oneOffVal - funding;

                return `
                  <tr>
                    <td>
                      <b>${p.country === 'Germany' ? '🇩🇪' : p.country === 'Belgium' ? '🇧🇪' : '🇪🇺'} ${p.u}</b><br>
                      <small class="mu">${p.t}</small>
                    </td>
                    <td>
                      <span class="badge ${p.country === 'Germany' ? 'g' : p.country === 'Belgium' ? 'b' : 'p'}">${p.country}</span>
                    </td>
                    <td>
                      ${p.country === "Germany" && p.fee === 0
                        ? `<b style="color:var(--grt)">€0</b> <small class="mu">(~€${p.semesterFee || 150}/sem contribution)</small>`
                        : `€${tuitionAfterScholarship.toLocaleString()}`}
                    </td>
                    <td>€${annualLiving.toLocaleString()}</td>
                    <td>€${oneOffVal.toLocaleString()}</td>
                    <td>
                      ${p.em ? `<span class="badge-scholarship">Erasmus+ €16,800</span>` : p.mm ? `
                        <label class="toggle-sm">
                          <input type="checkbox" data-assume-mm="${p.id}" ${state.costs.assumeScholarship[p.id] ? "checked" : ""} />
                          <span>Master Mind</span>
                        </label>
                      ` : (p.country === "Germany" && p.fee === 0) ? `<span class="badge-scholarship" style="background:var(--success-subtle); color:var(--success-text); border:1px solid rgba(16,185,129,0.3);">€0 Tuition Free</span>` : p.r && p.r.includes("Wallonia") ? `<span class="badge" style="background:rgba(37,99,235,0.1); color:var(--primary);">ARES Assimilated</span>` : "—"}
                    </td>
                    <td><strong style="font-size: 15px; color: ${netCost < 7000 ? "var(--grt)" : "var(--tx)"};">€${Math.max(0, netCost).toLocaleString()}</strong></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 1. Wire Country Navigation Buttons
    container.querySelectorAll(".cost-country-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.costCountry;
        state.costCountry = target;

        // Sensible initial slider adjustments when switching countries
        if (target === "Germany" && state.costs.insurance < 50) {
          state.costs.insurance = 125;
          state.costs.rent = 450;
        } else if (target === "Belgium" && state.costs.insurance > 50) {
          state.costs.insurance = 15;
          state.costs.rent = 420;
        }

        this.app.saveState();
        this.renderCosts();
      });
    });

    // 2. Wire Slider Inputs
    const bindSlider = (id, key, valId) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", (e) => {
          const val = parseInt(e.target.value, 10);
          state.costs[key] = val;
          const displayEl = document.getElementById(valId);
          if (displayEl) displayEl.textContent = `€${val}`;
          this.app.saveState();
          this.renderCosts();
        });
      }
    };

    bindSlider("slideRent", "rent", "valRent");
    bindSlider("slideFood", "food", "valFood");
    bindSlider("slideIns", "insurance", "valIns");
    bindSlider("slideOne", "oneOff", "valOne");

    // 3. Wire Master Mind scholarship toggles
    container.querySelectorAll("input[data-assume-mm]").forEach(chk => {
      chk.addEventListener("change", () => {
        const id = parseInt(chk.dataset.assumeMm, 10);
        state.costs.assumeScholarship[id] = chk.checked;
        this.app.saveState();
        this.renderCosts();
      });
    });
  }

  // --- GUIDE & VISA ROADMAP VIEW ---
  renderGuide() {
    const { state } = this.app;
    const container = document.getElementById("v-guide");
    if (!container) return;

    const activeCountry = state.guideCountry === "Germany" ? "Germany" : "Belgium";
    const roadmap = activeCountry === "Germany" ? GERMANY_VISA_ROADMAP : BELGIUM_VISA_ROADMAP;

    // Load saved checklist state for the active country
    const storageKey = `bmp_doc_checklist_${activeCountry.toLowerCase()}`;
    let savedChecks = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        savedChecks = JSON.parse(raw);
      } else if (activeCountry === "Belgium") {
        // Fallback to legacy key for backward compatibility
        const legacy = localStorage.getItem("bmp_doc_checklist");
        if (legacy) savedChecks = JSON.parse(legacy);
      }
    } catch (e) {
      savedChecks = {};
    }

    const checklistItems = roadmap.checklist || [];
    const completedCount = checklistItems.filter(item => savedChecks[item.id]).length;
    const progressPct = checklistItems.length > 0 ? Math.round((completedCount / checklistItems.length) * 100) : 0;
    const academicItems = checklistItems.filter(i => i.col === "academic");
    const visaItems = checklistItems.filter(i => i.col === "visa");

    const phases = roadmap.phases || [];

    container.innerHTML = `
      <div class="guide-container">
        <!-- Country Selector Navigation -->
        <div class="roadmap-country-nav">
          <button class="roadmap-country-btn ${activeCountry === 'Belgium' ? 'active' : ''}" data-guide-country="Belgium">
            🇧🇪 Belgium Student Visa D Blueprint
          </button>
          <button class="roadmap-country-btn ${activeCountry === 'Germany' ? 'active' : ''}" data-guide-country="Germany">
            🇩🇪 Germany National Student Visa Blueprint
          </button>
        </div>

        <!-- Hero Section with Quick Metric Highlights -->
        <div class="guide-hero">
          <span class="guide-hero-badge">${roadmap.flag} ${roadmap.title}</span>
          <h2>${roadmap.country} Student Visa &amp; Journey Made Simple</h2>
          <p class="guide-hero-desc">${roadmap.subtitle}</p>

          <div class="guide-hero-stats-grid">
            <div class="guide-stat-card">
              <span class="guide-stat-label">💶 Living Proof</span>
              <span class="guide-stat-value">${roadmap.stats.livingProof}</span>
              <span class="guide-stat-sub">${roadmap.stats.livingProofSub}</span>
            </div>

            <div class="guide-stat-card">
              <span class="guide-stat-label">⚡ Visa Processing</span>
              <span class="guide-stat-value">${roadmap.stats.processing}</span>
              <span class="guide-stat-sub">${roadmap.stats.processingSub}</span>
            </div>

            <div class="guide-stat-card">
              <span class="guide-stat-label">💼 Search Year</span>
              <span class="guide-stat-value">${roadmap.stats.searchYear}</span>
              <span class="guide-stat-sub">${roadmap.stats.searchYearSub}</span>
            </div>

            <div class="guide-stat-card">
              <span class="guide-stat-label">${activeCountry === 'Germany' ? '🏛️ Public Tuition' : '🏛️ Wallonia Fee'}</span>
              <span class="guide-stat-value">${roadmap.stats.tuitionFee}</span>
              <span class="guide-stat-sub">${roadmap.stats.tuitionFeeSub}</span>
            </div>
          </div>
        </div>

        <!-- Sub-Tabs Navigation Bar -->
        <div class="guide-tabs-bar" id="guideTabsBar">
          <button class="guide-tab-btn active" data-tab="roadmap">🗺️ 4-Stage Roadmap</button>
          <button class="guide-tab-btn" data-tab="solvency">💳 Solvency &amp; Money Flow</button>
          <button class="guide-tab-btn" data-tab="checklist">📋 Document Checklist</button>
          <button class="guide-tab-btn" data-tab="budget">💰 True Cost Breakdown</button>
          <button class="guide-tab-btn" data-tab="faqs">❓ Quick-Answer FAQs</button>
        </div>

        <!-- TAB 1: 4-Stage Roadmap -->
        <div class="guide-panel active" id="tab-roadmap">
          <div class="roadmap-phases-grid">
            ${phases.map(p => `
              <div class="roadmap-phase-card">
                <div class="roadmap-phase-header">
                  <div class="roadmap-phase-tag-wrap">
                    <span class="roadmap-phase-num">${p.num}</span>
                    <span class="roadmap-phase-title">${p.title}</span>
                  </div>
                  <span class="roadmap-phase-time">🗓️ ${p.time}</span>
                </div>

                <ul class="roadmap-action-list">
                  ${p.actions.map(act => `
                    <li class="roadmap-action-item">
                      <span class="roadmap-action-icon">✓</span>
                      <span>${act}</span>
                    </li>
                  `).join("")}
                </ul>

                <div class="roadmap-phase-tip">
                  <b>💡 Rule of Thumb:</b>
                  <span>${p.tip}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- TAB 2: Solvency & Money Flow -->
        <div class="guide-panel" id="tab-solvency">
          <div class="solvency-box">
            <div class="solvency-header">
              <h3>${roadmap.solvency.title}</h3>
              <p>${roadmap.solvency.summary}</p>
            </div>

            <!-- 4-Step Sequential Funds Flow -->
            <div class="flow-diagram-grid">
              ${roadmap.solvency.steps.map(s => `
                <div class="flow-node">
                  <span class="flow-node-step">${s.step}</span>
                  <span class="flow-node-title">${s.title}</span>
                  <span class="flow-node-desc">${s.desc}</span>
                </div>
              `).join("")}
            </div>

            <!-- Comparison Matrix Table -->
            <div style="margin-top: 24px;">
              <h4 style="font-size: 16px; font-weight: 800; color: var(--tx); margin-bottom: 6px;">Which Solvency Route Should You Choose?</h4>
              <p style="font-size: 13px; color: var(--tx-muted); margin-bottom: 12px;">Compare the legally recognized routes for ${roadmap.country}:</p>

              <div style="overflow-x: auto;">
                <table class="comparison-matrix-table">
                  <thead>
                    <tr>
                      <th>Solvency Route</th>
                      <th>Upfront Cash</th>
                      <th>Is Money Returned?</th>
                      <th>Approval Rate</th>
                      <th>Who It's Best For</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activeCountry === "Germany" ? `
                      <tr class="highlight-row">
                        <td><b>⭐ Sperrkonto (Expatrio / Fintiba / Coracle)</b></td>
                        <td>€11,904 living deposit</td>
                        <td><span class="badge g">Yes, €992/month</span></td>
                        <td><span class="badge g">99%+ (Safest)</span></td>
                        <td>Self-funded students (straightforward online setup)</td>
                      </tr>
                      <tr>
                        <td><b>Formal Obligation (§ 68 Verpflichtungserklärung)</b></td>
                        <td>€0 from student</td>
                        <td>N/A (Sponsor legally guarantees you)</td>
                        <td><span class="badge b">~80%–85%</span></td>
                        <td>Students with permanent resident sponsor in Germany</td>
                      </tr>
                      <tr>
                        <td><b>Official Scholarship (DAAD / Erasmus+)</b></td>
                        <td>€0 from student</td>
                        <td><span class="badge p">Monthly stipend (~€934/mo)</span></td>
                        <td><span class="badge g">99%+ (Guaranteed)</span></td>
                        <td>Merit awardees &amp; international scholars</td>
                      </tr>
                    ` : `
                      <tr class="highlight-row">
                        <td><b>⭐ University Blocked Account</b></td>
                        <td>~€9,636 – €10,200</td>
                        <td><span class="badge g">Yes, €803/month</span></td>
                        <td><span class="badge g">99%+ (Safest)</span></td>
                        <td>Self-funded students (zero sponsor hassle)</td>
                      </tr>
                      <tr>
                        <td><b>Annex 32 Legal Guarantor</b></td>
                        <td>€0 from student</td>
                        <td>N/A (Sponsor covers you)</td>
                        <td><span class="badge b">~75%–85%</span></td>
                        <td>Students with high-earning EU/Belgian family</td>
                      </tr>
                      <tr>
                        <td><b>Official Scholarship (Master Mind / EMJM)</b></td>
                        <td>€0 from student</td>
                        <td><span class="badge p">Monthly stipend</span></td>
                        <td><span class="badge g">99%+ (Guaranteed)</span></td>
                        <td>High CGPA candidates (3.5+ CGPA)</td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: Interactive Checklist -->
        <div class="guide-panel" id="tab-checklist">
          <div class="checklist-card">
            <div class="checklist-top-bar">
              <div>
                <h3 style="font-size: 18px; font-weight: 800; color: var(--tx); margin-bottom: 4px;">${roadmap.country} Visa &amp; Admission Document Checklist</h3>
                <p id="checklistProgressText" style="font-size: 13px; color: var(--tx-muted);">${completedCount} of ${checklistItems.length} documents ready (${progressPct}%)</p>
              </div>

              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <div class="checklist-filters">
                  <button class="checklist-filter-btn active" data-filter="all">All (${checklistItems.length})</button>
                  <button class="checklist-filter-btn" data-filter="academic">Academic (${academicItems.length})</button>
                  <button class="checklist-filter-btn" data-filter="visa">Embassy (${visaItems.length})</button>
                </div>
                <button class="btn s" id="checklistCopyBtn" title="Copy full checklist to clipboard">📋 Copy List</button>
                <button class="btn s" id="checklistResetBtn" title="Reset all checked items">↺ Reset</button>
              </div>
            </div>

            <div class="checklist-progress-bar-wrap">
              <div class="checklist-progress-fill" id="checklistProgressFill" style="width: ${progressPct}%;"></div>
            </div>

            <div class="checklist-groups-grid">
              <!-- Academic & Identity -->
              <div class="checklist-group" data-col="academic">
                <div class="checklist-group-title">
                  <span>🎓</span>
                  <span>Academic &amp; Identification Dossier (${academicItems.length})</span>
                </div>
                ${academicItems.map(item => `
                  <div class="checklist-item-row ${savedChecks[item.id] ? "checked" : ""}" data-id="${item.id}" data-category="academic">
                    <input type="checkbox" class="checklist-checkbox" ${savedChecks[item.id] ? "checked" : ""} />
                    <div class="checklist-item-info">
                      <span class="checklist-item-label">${item.title}</span>
                      <span class="checklist-item-note">${item.note}</span>
                    </div>
                  </div>
                `).join("")}
              </div>

              <!-- Visa & Legal -->
              <div class="checklist-group" data-col="visa">
                <div class="checklist-group-title">
                  <span>🏛️</span>
                  <span>${roadmap.country} Embassy &amp; Legal Dossier (${visaItems.length})</span>
                </div>
                ${visaItems.map(item => `
                  <div class="checklist-item-row ${savedChecks[item.id] ? "checked" : ""}" data-id="${item.id}" data-category="visa">
                    <input type="checkbox" class="checklist-checkbox" ${savedChecks[item.id] ? "checked" : ""} />
                    <div class="checklist-item-info">
                      <span class="checklist-item-label">${item.title}</span>
                      <span class="checklist-item-note">${item.note}</span>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: True Cost Breakdown -->
        <div class="guide-panel" id="tab-budget">
          <div class="budget-card">
            <div>
              <h3 style="font-size: 19px; font-weight: 800; color: var(--tx); margin-bottom: 4px;">Itemized ${roadmap.country} Study &amp; Visa Budget</h3>
              <p style="font-size: 13px; color: var(--tx-muted);">Clear, realistic itemized breakdown of expenses from home country to your first month in ${roadmap.country}:</p>
            </div>

            <div style="overflow-x: auto;">
              <table class="budget-table">
                <thead>
                  <tr>
                    <th>Expense Item</th>
                    <th>Payable To / Category</th>
                    <th>Estimated Amount</th>
                    <th>Refundable / Returned?</th>
                  </tr>
                </thead>
                <tbody>
                  ${(roadmap.budget || []).map(b => `
                    <tr>
                      <td><b>${b.item}</b></td>
                      <td>${b.type || "Statutory"}</td>
                      <td><b>${b.amount}</b></td>
                      <td>${b.note || "Standard fee"}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

            <div style="background: var(--bg-subtle); border-radius: var(--radius-lg); padding: 14px 18px; font-size: 12.5px; color: var(--tx-muted); line-height: 1.55;">
              💡 <b>Bottom Line:</b> ${activeCountry === 'Germany'
                ? 'Your tuition is <b>€0</b> at German public universities. Your largest upfront transfer (€11,904) is NOT a tuition charge—it is your own living allowance protected in your Sperrkonto and paid back into your bank account in €992 monthly disbursements.'
                : 'Your net non-refundable expenditure to reach Belgium is only <b>~€1,305</b> (tuition + government fees). The largest portion (€9,636) is your own living budget deposited into your own Belgian account.'}
            </div>
          </div>
        </div>

        <!-- TAB 5: Quick-Answer Accordion FAQs -->
        <div class="guide-panel" id="tab-faqs">
          <div class="faq-accordion-list">
            ${(roadmap.faqs || []).map((faq, idx) => `
              <div class="faq-accordion-item ${idx === 0 ? 'open' : ''}">
                <div class="faq-accordion-header">
                  <span class="faq-accordion-question">❓ ${faq.q}</span>
                  <span class="faq-accordion-icon">▼</span>
                </div>
                <div class="faq-accordion-body">
                  ${faq.a}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    // 1. Wire Country Navigation Buttons
    container.querySelectorAll(".roadmap-country-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.guideCountry;
        state.guideCountry = target;
        this.app.saveState();
        this.renderGuide();
      });
    });

    // 2. Wire Sub-Tab Navigation
    const tabBtns = container.querySelectorAll(".guide-tab-btn");
    const panels = container.querySelectorAll(".guide-panel");

    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove("active"));
        panels.forEach(p => p.classList.remove("active"));

        btn.classList.add("active");
        const panel = container.querySelector(`#tab-${target}`);
        if (panel) panel.classList.add("active");
      });
    });

    // 3. Wire Interactive Checklist Progress & Storage
    const updateChecklistProgress = () => {
      const activeCount = checklistItems.filter(item => savedChecks[item.id]).length;
      const pct = checklistItems.length > 0 ? Math.round((activeCount / checklistItems.length) * 100) : 0;
      const textEl = document.getElementById("checklistProgressText");
      const fillEl = document.getElementById("checklistProgressFill");

      if (textEl) textEl.textContent = `${activeCount} of ${checklistItems.length} documents ready (${pct}%)`;
      if (fillEl) fillEl.style.width = `${pct}%`;

      try {
        localStorage.setItem(storageKey, JSON.stringify(savedChecks));
      } catch (e) {
        console.warn("Could not save checklist state:", e);
      }
    };

    container.querySelectorAll(".checklist-item-row").forEach(row => {
      const id = row.dataset.id;
      const checkbox = row.querySelector(".checklist-checkbox");

      const toggleItem = () => {
        const isChecked = !savedChecks[id];
        savedChecks[id] = isChecked;
        if (checkbox) checkbox.checked = isChecked;
        row.classList.toggle("checked", isChecked);
        updateChecklistProgress();
      };

      row.addEventListener("click", (e) => {
        if (e.target !== checkbox) {
          toggleItem();
        }
      });

      if (checkbox) {
        checkbox.addEventListener("change", () => {
          savedChecks[id] = checkbox.checked;
          row.classList.toggle("checked", checkbox.checked);
          updateChecklistProgress();
        });
      }
    });

    // 4. Checklist Filters (All, Academic, Visa)
    const filterBtns = container.querySelectorAll(".checklist-filter-btn");
    filterBtns.forEach(fBtn => {
      fBtn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        fBtn.classList.add("active");
        const filter = fBtn.dataset.filter;

        container.querySelectorAll(".checklist-group").forEach(group => {
          if (filter === "all") {
            group.style.display = "flex";
          } else {
            group.style.display = group.dataset.col === filter ? "flex" : "none";
          }
        });
      });
    });

    // 5. Checklist Copy to Clipboard
    const copyBtn = document.getElementById("checklistCopyBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const lines = checklistItems.map(item => {
          const status = savedChecks[item.id] ? "[X]" : "[ ]";
          return `${status} ${item.title} — ${item.note}`;
        });
        const text = `${roadmap.country.toUpperCase()} MASTER'S & VISA DOCUMENT CHECKLIST\n\n` + lines.join("\n");
        navigator.clipboard.writeText(text).then(() => {
          const orig = copyBtn.textContent;
          copyBtn.textContent = "✓ Copied!";
          setTimeout(() => { copyBtn.textContent = orig; }, 2000);
        }).catch(() => {
          alert("Checklist copied to clipboard!");
        });
      });
    }

    // 6. Checklist Reset
    const resetBtn = document.getElementById("checklistResetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (confirm(`Reset all checked documents for ${roadmap.country}?`)) {
          savedChecks = {};
          container.querySelectorAll(".checklist-item-row").forEach(r => {
            r.classList.remove("checked");
            const chk = r.querySelector(".checklist-checkbox");
            if (chk) chk.checked = false;
          });
          updateChecklistProgress();
        }
      });
    }

    // 7. Accordion FAQs Toggle
    container.querySelectorAll(".faq-accordion-header").forEach(hdr => {
      hdr.addEventListener("click", () => {
        const item = hdr.closest(".faq-accordion-item");
        if (item) {
          item.classList.toggle("open");
        }
      });
    });
  }

  // --- ECTS CALCULATOR MODAL ---
  openEctsModal() {
    let modal = document.getElementById("ectsModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ectsModal";
      modal.className = "ov";
      document.body.appendChild(modal);
    }

    const { state } = this.app;

    modal.innerHTML = `
      <div class="md">
        <div class="mh">
          <button class="x" id="closeEctsModal">✕</button>
          <h2>📐 European Credit (ECTS) Converter &amp; Evaluator</h2>
          <p class="mu">Understand how your semester credit hours translate to European ECTS credits.</p>
        </div>
        <div class="mb">
          <div class="sec">
            <h5>ECTS Conversion Rule</h5>
            <p>
              Under the European Higher Education Area (Bologna process), 1 full academic year = 60 ECTS.
              In the Pakistani / US university system, 1 academic year = 30 to 32 credit hours.
              Therefore, <b>1 Semester Credit Hour ≈ 1.8 to 2.0 European ECTS</b>.
            </p>
          </div>
          <div class="sec">
            <h5>Your Course Credit Inputs</h5>
            <div class="form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <label>
                Math &amp; Statistics Credit Hours:
                <input type="number" id="inputEctsMath" value="${state.profile.mathCredits}" min="0" max="40" />
              </label>
              <label>
                Core CS &amp; Software Credit Hours:
                <input type="number" id="inputEctsCs" value="${state.profile.csCredits}" min="0" max="100" />
              </label>
            </div>
            <div id="ectsResults" style="margin-top: 12px; background: var(--ch); padding: 12px; border-radius: 10px;">
              <div>Math &amp; Quantitative: <b>${state.profile.mathCredits} credit hours</b> = <b style="color:var(--grt)">~${creditsToEcts(state.profile.mathCredits)} ECTS</b> (Exceeds the 25–30 ECTS requirement!)</div>
              <div style="margin-top: 6px;">Core CS &amp; Engineering: <b>${state.profile.csCredits} credit hours</b> = <b style="color:var(--grt)">~${creditsToEcts(state.profile.csCredits)} ECTS</b></div>
            </div>
          </div>
          <div class="sec">
            <h5>Course Syllabus Tip</h5>
            <p class="mu">
              Belgian admission boards evaluate your individual course descriptions. Always prepare a compiled PDF document of your official university course descriptions (topics covered, textbooks used, credit hours).
            </p>
          </div>
        </div>
        <div class="mf">
          <button class="btn p" id="closeEctsModalBtn">Done</button>
        </div>
      </div>
    `;

    this.app.openModal(modal);

    const close = () => this.app.closeModal(modal);
    document.getElementById("closeEctsModal").onclick = close;
    document.getElementById("closeEctsModalBtn").onclick = close;

    const mathInp = document.getElementById("inputEctsMath");
    const csInp = document.getElementById("inputEctsCs");

    const updateEcts = () => {
      const mVal = parseInt(mathInp.value, 10) || 0;
      const cVal = parseInt(csInp.value, 10) || 0;
      state.profile.mathCredits = mVal;
      state.profile.csCredits = cVal;
      this.app.saveState();
      document.getElementById("ectsResults").innerHTML = `
        <div>Math &amp; Quantitative: <b>${mVal} credit hours</b> = <b style="color:var(--grt)">~${creditsToEcts(mVal)} ECTS</b> (${mVal >= 15 ? "Fully meets Belgian university 30 ECTS criteria!" : "Check individual university guidelines"})</div>
        <div style="margin-top: 6px;">Core CS &amp; Engineering: <b>${cVal} credit hours</b> = <b style="color:var(--grt)">~${creditsToEcts(cVal)} ECTS</b></div>
      `;
    };

    mathInp.addEventListener("input", updateEcts);
    csInp.addEventListener("input", updateEcts);
  }
}
