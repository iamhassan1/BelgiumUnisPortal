/**
 * Views & Rendering Engine
 * Handles Discover Grid, Full University Deep-Dive Page, Comparison, Application Tracker, Cost Simulator, and Visa Roadmap.
 */

import { UNIVERSITIES, CATEGORIES, REGIONS, BELGIUM_DOMAINS } from './data.js';
import { calculateFitScore, creditsToEcts } from './fit-engine.js';

export class PortalViews {
  constructor(app) {
    this.app = app;
  }

  // --- DISCOVER VIEW ---
  renderDiscover() {
    const { state } = this.app;
    const container = document.getElementById("v-discover");
    if (!container) return;

    // Filter programs
    const filtered = this.getFilteredPrograms();

    container.innerHTML = `
      <!-- Briefing Alert Banner -->
      <div class="brief-banner">
        <div class="brief-main">
          <div class="brief-badge">Evaluation Baseline</div>
          <h3>Consultant Strategy: Wallonia ARES Exemption (<€1.5k/yr) + Top Flemish Scholarships</h3>
          <p>
            Baseline profile: <b>CGPA ${state.profile.cgpa}</b>, <b>IELTS ${state.profile.ielts}</b> (lowest band ${state.profile.band}), <b>${state.profile.mathCredits} Math credits (~${creditsToEcts(state.profile.mathCredits)} ECTS)</b>, <b>${state.profile.hasPortfolio ? "Shipped Game Portfolio" : "No Portfolio"}</b>.
            Wallonia-Brussels universities (UCLouvain, ULiège, UNamur) exempt developing country nationals from the €4,175 fee, keeping tuition under €1.2k/year.
          </p>
          <div class="brief-stats-row">
            <div class="brief-stat-pill">
              <span class="stat-tier">Tier 1: Safe &amp; Budget</span>
              <strong>Wallonia ARES: €835 – €1,194/yr</strong>
              <small>UCLouvain · ULiège · UNamur · ULB</small>
            </div>
            <div class="brief-stat-pill">
              <span class="stat-tier">Tier 2: Full Scholarships</span>
              <strong>Master Mind &amp; Erasmus Mundus</strong>
              <small>€0 – €140/yr + €1,400/mo Stipend</small>
            </div>
            <div class="brief-stat-pill">
              <span class="stat-tier">Tier 3: Standard Non-EU</span>
              <strong>Flanders: €4,200 – €7,800/yr</strong>
              <small>Antwerp · VUB · KU Leuven</small>
            </div>
          </div>
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
            <option value="1500" ${state.maxBudget === 1500 ? "selected" : ""}>Under €1,500 / yr</option>
            <option value="2000" ${state.maxBudget === 2000 ? "selected" : ""}>Under €2,000 / yr (Top Priority)</option>
            <option value="5000" ${state.maxBudget === 5000 ? "selected" : ""}>Under €5,000 / yr</option>
          </select>
          <select id="regionSelect" aria-label="Region filter">
            <option value="" ${state.region === "" ? "selected" : ""}>All Regions</option>
            <option value="Wallonia/Brussels" ${state.region === "Wallonia/Brussels" ? "selected" : ""}>Wallonia / Brussels (Low Fee)</option>
            <option value="Flanders" ${state.region === "Flanders" ? "selected" : ""}>Flanders (Master Mind)</option>
            <option value="International / Joint" ${state.region === "International / Joint" ? "selected" : ""}>Joint / Erasmus Mundus</option>
          </select>
          <label class="toggle-label" title="Hide programs where your profile has blocked criteria">
            <input type="checkbox" id="hideBlockedCheck" ${state.hideBlocked ? "checked" : ""} />
            <span>Hide Blocked</span>
          </label>
        </div>

        <!-- Category Filter Pills -->
        <div class="category-pills">
          ${CATEGORIES.map(([key, label]) => `
            <button class="cat-pill ${state.category === key ? "active" : ""}" data-cat="${key}">
              ${label}
            </button>
          `).join("")}
        </div>
      </div>

      <!-- Counter & Active Filter summary -->
      <div class="results-header">
        <span class="results-count">
          Showing <b>${filtered.length}</b> of <b>${UNIVERSITIES.length}</b> accredited programs
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
        ${filtered.length > 0 ? filtered.map(p => this.renderProgramCard(p)).join("") : `
          <div class="empty-state">
            <div class="empty-icon">🔎</div>
            <h3>No matching programs found</h3>
            <p>Try loosening your budget filters, resetting search keywords, or enabling "Show Blocked".</p>
            <button class="btn p" id="btnResetFilters">Reset All Filters</button>
          </div>
        `}
      </div>
    `;

    this.bindDiscoverEvents();
  }

  renderProgramCard(p) {
    const { state } = this.app;
    const fit = calculateFitScore(p, state.profile);
    const isShortlisted = state.shortlist.includes(p.id);
    const isCompared = state.compare.includes(p.id);

    return `
      <article class="program-card ${fit.isBlocked ? "blocked-card" : ""}" data-id="${p.id}">
        <div class="card-top">
          <div class="card-uni-meta">
            <span class="uni-name">${p.u}</span>
            <span class="uni-city">${p.c}</span>
          </div>
          <span class="region-badge">${p.r}</span>
        </div>

        <h4 class="card-title">
          <a href="#/program/${p.id}" class="card-title-link" title="View Full Dedicated Page for ${p.t}">${p.t}</a>
        </h4>

        <div class="card-price-row">
          <span class="price-pill ${p.cl}">${p.pill}</span>
          <span class="fit-score-badge ${fit.color}">${fit.label} · ${fit.score}</span>
        </div>

        <div class="card-tags">
          ${p.tags.slice(0, 3).map(t => `<span class="tag-chip">${t}</span>`).join("")}
        </div>

        <p class="card-summary">${p.sum}</p>

        <div class="card-actions">
          <button class="btn btn-quick-details" data-open-modal="${p.id}" title="Quick modal summary">Quick Details</button>
          <a href="#/program/${p.id}" class="btn btn-full-page" title="Open complete dedicated university page">Full Page</a>
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
    const { state } = this.app;
    const q = state.searchQuery.toLowerCase().trim();

    return UNIVERSITIES.filter(p => {
      // Category filter
      if (state.category !== "all" && !p.cats.includes(state.category)) return false;

      // Budget filter
      if (state.maxBudget > 0) {
        const effectiveFee = (state.profile.aresEligible && p.r.includes("Wallonia"))
          ? p.statutoryFee
          : (p.em ? 0 : p.fee);
        if (effectiveFee > state.maxBudget) return false;
      }

      // Region filter
      if (state.region && p.r !== state.region) return false;

      // Hide blocked
      if (state.hideBlocked) {
        const fit = calculateFitScore(p, state.profile);
        if (fit.isBlocked) return false;
      }

      // Live search query
      if (q) {
        const hay = [
          p.u, p.name, p.c, p.t, p.sum,
          p.tags.join(" "), p.pre.join(" "),
          p.curriculum.join(" ")
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (state.sortBy === "fee") {
        const feeA = (state.profile.aresEligible && a.r.includes("Wallonia")) ? a.statutoryFee : a.fee;
        const feeB = (state.profile.aresEligible && b.r.includes("Wallonia")) ? b.statutoryFee : b.fee;
        return feeA - feeB;
      }
      if (state.sortBy === "deadline") {
        return (a.dl || "9999").localeCompare(b.dl || "9999");
      }
      if (state.sortBy === "alpha") {
        return a.u.localeCompare(b.u);
      }
      // Default: fit score
      return calculateFitScore(b, state.profile).score - calculateFitScore(a, state.profile).score;
    });
  }

  bindDiscoverEvents() {
    const qInput = document.getElementById("qSearch");
    if (qInput) {
      qInput.addEventListener("input", (e) => {
        this.app.state.searchQuery = e.target.value;
        this.renderDiscover();
      });
    }

    const clearBtn = document.getElementById("clearSearch");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.app.state.searchQuery = "";
        this.renderDiscover();
      });
    }

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
        this.app.saveState();
        this.renderDiscover();
      });
    }

    const regionSelect = document.getElementById("regionSelect");
    if (regionSelect) {
      regionSelect.addEventListener("change", (e) => {
        this.app.state.region = e.target.value;
        this.app.saveState();
        this.renderDiscover();
      });
    }

    const hideBlocked = document.getElementById("hideBlockedCheck");
    if (hideBlocked) {
      hideBlocked.addEventListener("change", (e) => {
        this.app.state.hideBlocked = e.target.checked;
        this.app.saveState();
        this.renderDiscover();
      });
    }

    document.querySelectorAll(".cat-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        this.app.state.category = pill.dataset.cat;
        this.app.saveState();
        this.renderDiscover();
      });
    });

    const resetBtn = document.getElementById("btnResetFilters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.app.state.searchQuery = "";
        this.app.state.category = "all";
        this.app.state.maxBudget = 0;
        this.app.state.region = "";
        this.app.state.hideBlocked = false;
        this.app.saveState();
        this.renderDiscover();
      });
    }

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
      "Utrecht University": "UU"
    }[p.u] || p.u;

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
                <span>${p.c}, Belgium</span>
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
              <small>${p.r.includes("Wallonia") ? "ARES assimilation rate" : "Standard non-EU rate"}</small>
            </div>
            <div class="uni-stat-box">
              <span class="stat-lbl">Application Fee</span>
              <strong class="stat-val">${p.appFee}</strong>
              <small>${p.appFeeVal === 0 ? "Free Application" : "Official portal charge"}</small>
            </div>
            <div class="uni-stat-box">
              <span class="stat-lbl">Non-EU Deadline</span>
              <strong class="stat-val">${p.dl || "Check official site"}</strong>
              <small>September 2027 intake</small>
            </div>
            <div class="uni-stat-box">
              <span class="stat-lbl">English (IELTS)</span>
              <strong class="stat-val">${p.iel} Overall</strong>
              <small>${p.band ? `Min ${p.band} in each band` : "Standard B2/C1"}</small>
            </div>
            <div class="uni-stat-box">
              <span class="stat-lbl">Your Profile Fit</span>
              <strong class="stat-val ${fit.color}">${fit.label} (${fit.score}/100)</strong>
              <small>${fit.isBlocked ? "Blocked prerequisite" : "Fully eligible"}</small>
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
              <p class="section-desc">Master's degrees in Belgium consist of 120 ECTS spread across 4 semesters (2 years), culminating in a 30 ECTS research thesis or industry internship.</p>
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
                <strong>Quantitative &amp; Math Requirement:</strong>
                <p>
                  This program specifies approximately <b>${p.mathEcts || 30} ECTS</b> in mathematics and statistics.
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
                  Belgian Visa D Solvency (Compte Bloqué / Annex 32)
                  <b>Minimum €803 / month (Article 60 statutory index) ≈ €9,636 to €10,200/year returned to you monthly</b>
                </div>
              </div>
              <p class="section-subtext" style="margin-top: 10px;">
                <b>Note:</b> The blocked account deposit is NOT a tuition charge. It is your personal living money held in escrow by the university or bank, released back to your Belgian account every month for rent and groceries.
              </p>
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
              <h3 class="section-title">Campus &amp; Student Life in ${p.c}</h3>
              <p>${p.cityLife}</p>
              <div class="city-quick-facts" style="margin-top: 10px;">
                <div class="fact-row"><span>Average Student Kot:</span> <b>${p.livingEstimate.split('Kot room: ')[1]?.split(',')[0] || "€380–€480/mo"}</b></div>
                <div class="fact-row"><span>Student Transit:</span> <b>Affordable train/tram passes (€12–€50/yr)</b></div>
                <div class="fact-row"><span>Work Rights:</span> <b>20 hours/week during studies</b></div>
                <div class="fact-row"><span>Post-Study:</span> <b>12-Month Search Year Visa (Zoekjaar)</b></div>
              </div>
            </div>

            <!-- Action Card -->
            <div class="box uni-section-box cta-box">
              <h3>Ready to apply to ${p.u}?</h3>
              <p class="mu">Ensure you have your course syllabus PDF, HEC attestation, and motivation letter ready.</p>
              <div class="cta-actions">
                <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="btn p full-width">
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
      ["City & Region", p => `${p.c} · <span class="region-badge">${p.r}</span>`],
      ["Annual Tuition", p => `<span class="price-pill ${p.cl}">${p.pill}</span>`],
      ["Your Fit Score", p => {
        const fit = calculateFitScore(p, state.profile);
        return `<span class="fit-score-badge ${fit.color}">${fit.label} (${fit.score})</span>`;
      }],
      ["Application Fee", p => p.appFee],
      ["Non-EU Deadline", p => p.dl || "TBA"],
      ["IELTS Minimum", p => `${p.iel} overall ${p.band ? `(min ${p.band} each)` : ""}`],
      ["GRE Policy", p => p.gre ? "Required" : "Not Required (Waived)"],
      ["Math Requirement", p => `~${p.mathEcts || 30} ECTS (${p.mathReq} credits)`],
      ["Funding Route", p => p.em ? "Erasmus Mundus (€0 + €1.4k/mo)" : p.mm ? "Master Mind Eligible" : p.r.includes("Wallonia") ? "Wallonia ARES Exemption" : "Self-Funded"],
      ["Key Tracks", p => p.curriculum.slice(0, 3).join("<br>")],
      ["Official URL", p => `<a href="${p.url}" target="_blank" rel="noopener">Official Website ↗</a>`],
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
          <p class="mu">Comparing fees, admission hurdles, and funding routes for your shortlist.</p>
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
                  <small style="color: var(--mu); font-weight: normal;">${p.c}</small>
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
      "Scholarship nomination form (Master Mind / ARES)",
      "Blocked account transferred OR Annex 32 signed",
      "Belgian Visa D appointment at Gerry's / Embassy"
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

    const list = (state.shortlist.length > 0 ? state.shortlist : UNIVERSITIES.slice(0, 5)).map(id => UNIVERSITIES.find(u => u.id === id)).filter(Boolean);

    container.innerHTML = `
      <div class="box" style="margin-bottom: 14px;">
        <h3>Belgian Living Cost &amp; First-Year Budget Simulator</h3>
        <p class="mu">Calculate total estimated outlay for Year 1: Tuition, Blocked Account solvency (€803/mo statutory minimum), health insurance, and one-off visa/flights.</p>

        <div class="cost-sliders-grid" style="margin-top: 14px;">
          <label class="slider-field">
            <span>Monthly Rent (Kot) (€): <b id="valRent">${state.costs.rent}</b></span>
            <input type="range" min="300" max="800" step="20" id="slideRent" value="${state.costs.rent}" />
          </label>
          <label class="slider-field">
            <span>Monthly Groceries / Food (€): <b id="valFood">${state.costs.food}</b></span>
            <input type="range" min="150" max="450" step="10" id="slideFood" value="${state.costs.food}" />
          </label>
          <label class="slider-field">
            <span>Health Mutualité (€/mo): <b id="valIns">${state.costs.insurance}</b></span>
            <input type="range" min="10" max="50" step="5" id="slideIns" value="${state.costs.insurance}" />
          </label>
          <label class="slider-field">
            <span>One-Off (Visa, Flights, Deposit) (€): <b id="valOne">${state.costs.oneOff}</b></span>
            <input type="range" min="400" max="2500" step="50" id="slideOne" value="${state.costs.oneOff}" />
          </label>
        </div>
      </div>

      <div class="box table-responsive">
        <table class="cost-table">
          <thead>
            <tr>
              <th>University &amp; Program</th>
              <th>Year 1 Tuition</th>
              <th>Annual Living (12 mo)</th>
              <th>One-off Costs</th>
              <th>Scholarship Offset</th>
              <th>Net Year 1 Cost</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(p => {
              const isWallonia = p.r.includes("Wallonia");
              const effectiveTuition = (state.profile.aresEligible && isWallonia) ? p.statutoryFee : (p.em ? 0 : p.fee);
              const annualLiving = (state.costs.rent + state.costs.food + state.costs.insurance) * 12;
              const funding = p.em ? 16800 : (p.mm && state.costs.assumeScholarship[p.id] ? 10225 : 0);
              const tuitionAfterScholarship = (p.mm && state.costs.assumeScholarship[p.id]) ? 140 : effectiveTuition;
              const netCost = tuitionAfterScholarship + annualLiving + state.costs.oneOff - funding;

              return `
                <tr>
                  <td>
                    <b>${p.u}</b><br>
                    <small class="mu">${p.t}</small>
                  </td>
                  <td>€${tuitionAfterScholarship.toLocaleString()}</td>
                  <td>€${annualLiving.toLocaleString()}</td>
                  <td>€${state.costs.oneOff.toLocaleString()}</td>
                  <td>
                    ${p.em ? `<span class="badge-scholarship">Erasmus+ €16,800</span>` : p.mm ? `
                      <label class="toggle-sm">
                        <input type="checkbox" data-assume-mm="${p.id}" ${state.costs.assumeScholarship[p.id] ? "checked" : ""} />
                        <span>Master Mind</span>
                      </label>
                    ` : "—"}
                  </td>
                  <td><strong style="font-size: 15px; color: ${netCost < 5000 ? "var(--grt)" : "var(--tx)"};">€${Math.max(0, netCost).toLocaleString()}</strong></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;

    // Sliders
    const bindSlider = (id, key, valId) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", (e) => {
          const val = parseInt(e.target.value, 10);
          state.costs[key] = val;
          document.getElementById(valId).textContent = val;
          this.app.saveState();
          this.renderCosts();
        });
      }
    };

    bindSlider("slideRent", "rent", "valRent");
    bindSlider("slideFood", "food", "valFood");
    bindSlider("slideIns", "insurance", "valIns");
    bindSlider("slideOne", "oneOff", "valOne");

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
    const container = document.getElementById("v-guide");
    if (!container) return;

    container.innerHTML = `
      <div class="two-col-layout">
        <!-- Step by Step Roadmap -->
        <div class="box">
          <h3>Roadmap to Belgium (September 2027 Intake)</h3>
          <p class="mu">Chronological checklist from university shortlisting to Belgian commune registration.</p>

          <div class="roadmap-timeline" style="margin-top: 14px;">
            ${BELGIUM_DOMAINS.visaProcess.steps.map(s => `
              <div class="roadmap-step">
                <div class="step-num">${s.step}</div>
                <div class="step-text">
                  <strong>${s.title}</strong>
                  <p>${s.desc}</p>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Solvency, Annex 32 & FAQs -->
        <div>
          <!-- Solvency explanation box -->
          <div class="box" style="margin-bottom: 14px;">
            <h3>Proof of Solvency: Blocked Account vs Annex 32</h3>
            <p class="mu">Article 60 statutory living proof requirement (€803/month for 2025/2026/2027).</p>

            <div class="solvency-cards-grid" style="margin-top: 10px;">
              ${BELGIUM_DOMAINS.blockedAccount.routes.map(r => `
                <div class="solvency-mini-card">
                  <strong>${r.name}</strong>
                  <p>${r.details}</p>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Search Year & Work Rights -->
          <div class="box" style="margin-bottom: 14px;">
            <h3>Post-Study Work Visa (Zoekjaar)</h3>
            <p>${BELGIUM_DOMAINS.searchYear.summary}</p>
            <p style="margin-top: 6px;"><b>Working while studying:</b> ${BELGIUM_DOMAINS.workRights.summary}</p>
          </div>

          <!-- Document checklist -->
          <div class="box">
            <h3>Document Preparation Checklist</h3>
            <ul class="clean-bullet-list" style="margin-top: 8px;">
              <li>Valid International Passport (valid at least 18 months).</li>
              <li>Bachelor Degree &amp; Transcript, HEC attested + MOFA Apostille stamp.</li>
              <li>IELTS Academic certificate (minimum 6.5 overall).</li>
              <li>Comprehensive Course Syllabi (detailed module descriptions PDF).</li>
              <li>Europass CV + Tailored Motivation Letter per university.</li>
              <li>2 Academic or Employer Recommendation Letters.</li>
              <li>Game Portfolio / GitHub code repository (for graphics &amp; game tracks).</li>
              <li>Police Clearance Certificate (issued within 6 months, MOFA attested).</li>
              <li>Medical Certificate from Belgian Embassy approved panel physician.</li>
              <li>Proof of Financial Solvency (Blocked Account / Annex 32 / Scholarship).</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  // --- ECTS CALCULATOR MODAL ---
  openEctsModal() {
    let modal = document.getElementById("ectsModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ectsModal";
      modal.className = "ov on";
      document.body.appendChild(modal);
    } else {
      modal.classList.add("on");
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

    const close = () => modal.classList.remove("on");
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
