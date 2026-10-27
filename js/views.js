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

    // Load saved checklist state
    let savedChecks = {};
    try {
      savedChecks = JSON.parse(localStorage.getItem("bmp_doc_checklist") || "{}");
    } catch (e) {
      savedChecks = {};
    }

    const checklistItems = [
      { id: "passport", col: "academic", title: "Valid International Passport", note: "At least 18 months validity remaining + 2 blank pages." },
      { id: "degree_transcript", col: "academic", title: "Bachelor Degree & Transcripts", note: "Originals verified by HEC and MOFA with Apostille stamp." },
      { id: "ielts", col: "academic", title: "IELTS Academic Certificate", note: "Minimum 6.5 overall (minimum 6.0 in each sub-band)." },
      { id: "syllabi", col: "academic", title: "Course Syllabi PDF Booklet", note: "Detailed breakdown of completed modules (topics, textbooks, credit hours)." },
      { id: "cv_motivation", col: "academic", title: "Europass CV & Motivation Letters", note: "Tailored statement of purpose for each applied university." },
      { id: "recommendations", col: "academic", title: "2 Recommendation Letters", note: "Signed references from university professors or tech employers." },
      { id: "admission_offer", col: "visa", title: "Official University Offer Letter", note: "Unconditional or conditional admission letter from Belgian institution." },
      { id: "solvency_proof", col: "visa", title: "Proof of Financial Solvency", note: "University Blocked Account attestation or signed Annex 32 guarantee." },
      { id: "medical_cert", col: "visa", title: "Embassy Panel Doctor Medical", note: "Fit-to-travel certificate from Belgian Embassy-approved panel clinic." },
      { id: "police_cert", col: "visa", title: "Police Character Certificate", note: "Clean criminal record certificate issued within 6 months, MOFA attested." },
      { id: "admin_fee", col: "visa", title: "Federal Admin Fee Receipt", note: "Bank Swift proof of ~€250 paid to Belgian Immigration Office." },
      { id: "visa_form", col: "visa", title: "Visa D Application Form & Photos", note: "Completed Long-Stay Visa D form with 2 Schengen biometric photos." }
    ];

    const completedCount = checklistItems.filter(item => savedChecks[item.id]).length;
    const progressPct = Math.round((completedCount / checklistItems.length) * 100);

    const phases = [
      {
        num: "01",
        title: "University Admission",
        time: "Oct – Mar",
        actions: [
          "Apply to 3–4 programs across Flanders and Wallonia portals.",
          "Submit academic transcripts, CV, and English test (IELTS 6.5+).",
          "Receive your official admission offer letter."
        ],
        tip: "Apply to at least one Wallonia university (UCLouvain or ULiège) to lock in low EU rates under €1,200/yr."
      },
      {
        num: "02",
        title: "Attestation & Blocked Account",
        time: "Mar – Jun",
        actions: [
          "Attest Bachelor degree & transcripts via HEC and MOFA Apostille.",
          "Transfer ~€9,636 into university blocked account escrow.",
          "University issues your formal Solvency Attestation."
        ],
        tip: "University Blocked Account has a 99%+ visa approval rate because the money is already secured in Belgium in your name."
      },
      {
        num: "03",
        title: "Embassy Visa D Dossier",
        time: "Jun – Aug",
        actions: [
          "Medical checkup with an official embassy-designated panel clinic.",
          "Obtain Police Character Certificate (<6 months old, MOFA attested).",
          "Pay federal administrative fee (~€250) to Belgian Immigration.",
          "Submit physical dossier & biometric fingerprints at VFS / Gerry's."
        ],
        tip: "Do not get your police certificate too early—it must be under 6 months old when submitted to the visa center!"
      },
      {
        num: "04",
        title: "Landing & Belgian ID (Card A)",
        time: "Sept – Oct",
        actions: [
          "Book student room ('kot') and fly into Brussels Airport.",
          "Register at local town hall (Commune) within 8 days of landing.",
          "Open Belgian bank account to receive €803 payout every month.",
          "Local police confirms address; pick up your Biometric Residence Card A."
        ],
        tip: "Your Card A legally allows you to work 20 hrs/week during classes and full-time 38 hrs/week during summer!"
      }
    ];

    container.innerHTML = `
      <div class="guide-container">
        <!-- Hero Section with Quick Metric Highlights -->
        <div class="guide-hero">
          <span class="guide-hero-badge">🇧🇪 Belgian Student Visa D Blueprint (2026 / 2027)</span>
          <h2>Belgium Student Visa &amp; Journey Made Simple</h2>
          <p class="guide-hero-desc">Zero confusion, zero legal jargon. Here is exactly what happens, how much it costs, and when to take action for your Master's journey.</p>

          <div class="guide-hero-stats-grid">
            <div class="guide-stat-card">
              <span class="guide-stat-label">💶 Living Proof</span>
              <span class="guide-stat-value">€803 / mo</span>
              <span class="guide-stat-sub">100% returned to you in Belgium</span>
            </div>

            <div class="guide-stat-card">
              <span class="guide-stat-label">⚡ Visa Processing</span>
              <span class="guide-stat-value">3 to 5 Wks</span>
              <span class="guide-stat-sub">Average turnaround via Embassy / VFS</span>
            </div>

            <div class="guide-stat-card">
              <span class="guide-stat-label">💼 Search Year</span>
              <span class="guide-stat-value">12 Months</span>
              <span class="guide-stat-sub">Post-grad work permit (Zoekjaar)</span>
            </div>

            <div class="guide-stat-card">
              <span class="guide-stat-label">🏛️ Wallonia Fee</span>
              <span class="guide-stat-value">€835 – €1,194</span>
              <span class="guide-stat-sub">Standard EU rate for DAC nationals</span>
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
                  <b>💡 Beginner Rule:</b>
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
              <h3>How the University Blocked Account Works</h3>
              <p>Under Article 60 of the Belgian Aliens Act, students must demonstrate €803/month for living expenses. You are NOT paying a fee—you are simply placing your living money into escrow in your own name.</p>
            </div>

            <!-- 4-Step Sequential Funds Flow -->
            <div class="flow-diagram-grid">
              <div class="flow-node">
                <span class="flow-node-step">Stage 1</span>
                <span class="flow-node-title">Deposit Living Funds</span>
                <span class="flow-node-desc">Transfer ~€9,636 to your Belgian university's official escrow bank account.</span>
              </div>

              <div class="flow-node">
                <span class="flow-node-step">Stage 2</span>
                <span class="flow-node-title">Solvency Certificate</span>
                <span class="flow-node-desc">University immediately issues your formal "Attestation of Solvency" for the embassy.</span>
              </div>

              <div class="flow-node">
                <span class="flow-node-step">Stage 3</span>
                <span class="flow-node-title">Visa D Issued</span>
                <span class="flow-node-desc">Embassy grants your Long-Stay Visa D. You book your flight and land in Belgium.</span>
              </div>

              <div class="flow-node">
                <span class="flow-node-step">Stage 4</span>
                <span class="flow-node-title">Monthly Payback</span>
                <span class="flow-node-desc">Open a free Belgian bank account. University transfers €803 back to you every month!</span>
              </div>
            </div>

            <!-- Comparison Matrix Table -->
            <div style="margin-top: 24px;">
              <h4 style="font-size: 16px; font-weight: 800; color: var(--tx); margin-bottom: 6px;">Which Solvency Route Should You Choose?</h4>
              <p style="font-size: 13px; color: var(--tx-muted); margin-bottom: 12px;">Compare the 3 legal methods recognized by Belgian embassies worldwide:</p>

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
                <h3 style="font-size: 18px; font-weight: 800; color: var(--tx); margin-bottom: 4px;">Visa &amp; Admission Document Checklist</h3>
                <p id="checklistProgressText" style="font-size: 13px; color: var(--tx-muted);">${completedCount} of ${checklistItems.length} documents ready (${progressPct}%)</p>
              </div>

              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <div class="checklist-filters">
                  <button class="checklist-filter-btn active" data-filter="all">All (12)</button>
                  <button class="checklist-filter-btn" data-filter="academic">Academic (6)</button>
                  <button class="checklist-filter-btn" data-filter="visa">Embassy (6)</button>
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
                  <span>Academic &amp; Identification Dossier</span>
                </div>
                ${checklistItems.filter(i => i.col === "academic").map(item => `
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
                  <span>Belgian Embassy &amp; Legal Dossier</span>
                </div>
                ${checklistItems.filter(i => i.col === "visa").map(item => `
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
              <h3 style="font-size: 19px; font-weight: 800; color: var(--tx); margin-bottom: 4px;">Itemized Belgian Study &amp; Visa Budget</h3>
              <p style="font-size: 13px; color: var(--tx-muted);">Clear, realistic itemized breakdown of every expense from home country to your first month in Belgium:</p>
            </div>

            <div style="overflow-x: auto;">
              <table class="budget-table">
                <thead>
                  <tr>
                    <th>Expense Item</th>
                    <th>Payable To</th>
                    <th>Estimated Amount</th>
                    <th>Refundable / Returned?</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Blocked Living Escrow Account</b></td>
                    <td>Belgian University</td>
                    <td><b>€9,636</b></td>
                    <td><span class="badge g">100% Returned (€803/mo)</span></td>
                  </tr>
                  <tr>
                    <td><b>University Tuition (Wallonia DAC rate)</b></td>
                    <td>UCLouvain / ULiège</td>
                    <td><b>~€835</b></td>
                    <td>Standard annual tuition fee</td>
                  </tr>
                  <tr>
                    <td><b>Federal Administrative Contribution</b></td>
                    <td>Office des Étrangers (Immigration)</td>
                    <td><b>~€250</b></td>
                    <td>Non-refundable state fee</td>
                  </tr>
                  <tr>
                    <td><b>Visa Application &amp; Biometrics</b></td>
                    <td>VFS / Gerry's Visa Center</td>
                    <td><b>~€85</b></td>
                    <td>Non-refundable processing</td>
                  </tr>
                  <tr>
                    <td><b>Embassy Panel Medical Examination</b></td>
                    <td>Embassy Panel Clinic</td>
                    <td><b>~€90</b></td>
                    <td>Direct clinic fee</td>
                  </tr>
                  <tr>
                    <td><b>HEC Verification &amp; MOFA Apostille</b></td>
                    <td>Government Offices</td>
                    <td><b>~€30</b></td>
                    <td>Stamp and attestation fees</td>
                  </tr>
                  <tr>
                    <td><b>Police Character Clearance</b></td>
                    <td>Police Facilitation Center</td>
                    <td><b>~€15</b></td>
                    <td>Certificate processing</td>
                  </tr>
                  <tr class="budget-total-row">
                    <td><b>Total Upfront Cash Required</b></td>
                    <td>All Combined</td>
                    <td><b>~€10,941</b></td>
                    <td><span style="color: var(--primary-text); font-weight: 800;">(€9,636 is paid back to you!)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="background: var(--bg-subtle); border-radius: var(--radius-lg); padding: 14px 18px; font-size: 12.5px; color: var(--tx-muted); line-height: 1.55;">
              💡 <b>Bottom Line:</b> Your net non-refundable expenditure to reach Belgium is only <b>~€1,305</b> (tuition + government fees). The largest portion (€9,636) is your own living budget deposited into your own Belgian account.
            </div>
          </div>
        </div>

        <!-- TAB 5: Quick-Answer Accordion FAQs -->
        <div class="guide-panel" id="tab-faqs">
          <div class="faq-accordion-list">
            <div class="faq-accordion-item open">
              <div class="faq-accordion-header">
                <span class="faq-accordion-question">❓ Is the Blocked Account a fee or my own money?</span>
                <span class="faq-accordion-icon">▼</span>
              </div>
              <div class="faq-accordion-body">
                <b>It is 100% your money!</b> Under Belgian immigration law (Article 60), the university acts as a secure escrow agent. Once you arrive in Belgium and open a free local bank account, the university transfers <b>€803 directly into your personal account every single month</b> to pay for your rent and food.
              </div>
            </div>

            <div class="faq-accordion-item">
              <div class="faq-accordion-header">
                <span class="faq-accordion-question">❓ Can I apply for admission before taking the IELTS?</span>
                <span class="faq-accordion-icon">▼</span>
              </div>
              <div class="faq-accordion-body">
                <b>Yes.</b> Major Belgian institutions (notably UCLouvain, ULiège, and VUB) regularly accept applications with proof of an upcoming test registration, granting a conditional offer. Your official test result (6.5+ overall) is required before final visa enrollment.
              </div>
            </div>

            <div class="faq-accordion-item">
              <div class="faq-accordion-header">
                <span class="faq-accordion-question">❓ Why is Wallonia tuition so low (~€835/yr) for developing nations?</span>
                <span class="faq-accordion-icon">▼</span>
              </div>
              <div class="faq-accordion-body">
                Under the Wallonia-Brussels Higher Education Decree, non-EU students who are nationals of developing countries included in the DAC/OECD list are legally assimilated to EU status. This exempts you from the standard €4,175+ international surtax, so you pay only the standard EU fee of <b>~€835 to €1,194 per year</b>.
              </div>
            </div>

            <div class="faq-accordion-item">
              <div class="faq-accordion-header">
                <span class="faq-accordion-question">❓ Can I work part-time while studying in Belgium?</span>
                <span class="faq-accordion-icon">▼</span>
              </div>
              <div class="faq-accordion-body">
                <b>Yes!</b> Non-EU students holding a valid Belgian residence card A are legally entitled to work up to <b>20 hours per week</b> during academic semesters and <b>full-time (38 hrs/week) during official holidays</b> (July &amp; August) without needing any separate work permit. Average pay ranges between €12 and €16/hour.
              </div>
            </div>

            <div class="faq-accordion-item">
              <div class="faq-accordion-header">
                <span class="faq-accordion-question">❓ What is a "Kot" and how much does student rent cost?</span>
                <span class="faq-accordion-icon">▼</span>
              </div>
              <div class="faq-accordion-body">
                In Belgium, a "kot" is a private furnished student bedroom in a shared student house with communal kitchen and bathroom facilities. Monthly rent averages between <b>€350 and €550/month</b> (utilities included) in university cities like Louvain-la-Neuve, Liège, and Ghent.
              </div>
            </div>

            <div class="faq-accordion-item">
              <div class="faq-accordion-header">
                <span class="faq-accordion-question">❓ What happens after I graduate from my Master's?</span>
                <span class="faq-accordion-icon">▼</span>
              </div>
              <div class="faq-accordion-body">
                Upon graduation, you are legally entitled to a <b>12-month post-study residence permit ("Zoekjaar" / Search Year)</b>. This gives you 1 full year to find a software or tech job anywhere in Belgium and transition smoothly to a Belgian Single Permit with reduced salary thresholds for recent graduates.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 1. Wire Sub-Tab Navigation
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

    // 2. Wire Interactive Checklist Progress & Storage
    const updateChecklistProgress = () => {
      const activeCount = checklistItems.filter(item => savedChecks[item.id]).length;
      const pct = Math.round((activeCount / checklistItems.length) * 100);
      const textEl = document.getElementById("checklistProgressText");
      const fillEl = document.getElementById("checklistProgressFill");

      if (textEl) textEl.textContent = `${activeCount} of ${checklistItems.length} documents ready (${pct}%)`;
      if (fillEl) fillEl.style.width = `${pct}%`;

      try {
        localStorage.setItem("bmp_doc_checklist", JSON.stringify(savedChecks));
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

    // 3. Checklist Filters (All, Academic, Visa)
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

    // 4. Checklist Copy to Clipboard
    const copyBtn = document.getElementById("checklistCopyBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const lines = checklistItems.map(item => {
          const status = savedChecks[item.id] ? "[X]" : "[ ]";
          return `${status} ${item.title} — ${item.note}`;
        });
        const text = "BELGIUM MASTER'S & VISA DOCUMENT CHECKLIST\n\n" + lines.join("\n");
        navigator.clipboard.writeText(text).then(() => {
          const orig = copyBtn.textContent;
          copyBtn.textContent = "✓ Copied!";
          setTimeout(() => { copyBtn.textContent = orig; }, 2000);
        }).catch(() => {
          alert("Checklist copied to clipboard!");
        });
      });
    }

    // 5. Checklist Reset
    const resetBtn = document.getElementById("checklistResetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (confirm("Reset all checked documents?")) {
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

    // 6. Accordion FAQs Toggle
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
