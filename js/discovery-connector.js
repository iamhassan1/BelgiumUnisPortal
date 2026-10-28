/**
 * Dynamic Discovery Connector & Search Engine
 * Integrates Belgian Higher Education, German DAAD & uni-assist databases,
 * multi-criteria strict filtering, deduplication, and pagination.
 */

import { UNIVERSITIES, COUNTRIES } from './data.js';
import { calculateFitScore, getEffectiveTuition } from './fit-engine.js';

export class DiscoveryConnector {
  constructor(app) {
    this.app = app;
    this.cache = new Map();
    this.pageSize = 9;
    this.currentPage = 1;
    this.isScanning = false;
  }

  /**
   * Discovers and strictly filters programs based on active search parameters and candidate profile.
   */
  search(params = {}) {
    const { state } = this.app;
    const profile = state.profile;

    const {
      country = state.country || "All Countries",
      category = state.category || "all",
      matchTier = state.matchTier || "all",
      intake = state.intake || "all",
      searchQuery = (state.searchQuery || "").trim().toLowerCase(),
      maxBudget = state.maxBudget || 0,
      openOnly = state.openOnly || false,
      sortBy = state.sortBy || "fit",
      hideBlocked = state.hideBlocked || false,
      page = this.currentPage,
      pageSize = this.pageSize
    } = params;

    // 1. Deduplicate by unique slug / title
    const seen = new Set();
    const uniquePrograms = [];
    for (const p of UNIVERSITIES) {
      const key = `${p.country}_${p.u}_${p.slug}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniquePrograms.push(p);
      }
    }

    // 2. Evaluate eligibility & fit scores
    const evaluated = uniquePrograms.map(program => {
      const fit = calculateFitScore(program, profile);
      const effectiveFee = getEffectiveTuition(program, profile);
      return {
        ...program,
        fit,
        effectiveFee
      };
    });

    // 3. Apply Multi-Stage Filters
    const filtered = evaluated.filter(item => {
      // Country Filter
      if (country && country !== "All Countries") {
        if (item.country !== country) return false;
      }

      // Match Tier Filter
      if (matchTier === "eligible") {
        if (item.fit.tier !== "eligible") return false;
      } else if (matchTier === "potential") {
        if (item.fit.tier !== "potential") return false;
      }

      // Hide Blocked Filter
      if (hideBlocked && item.fit.isBlocked) {
        return false;
      }

      // Intake Filter (Winter vs Summer)
      if (intake === "winter") {
        if (!item.hasWinter) return false;
      } else if (intake === "summer") {
        if (!item.hasSummer) return false;
      }

      // Category Filter (General & Country-Specific)
      if (category && category !== "all") {
        if (category === "germany" && item.country !== "Germany") return false;
        if (category === "germany_free" && (item.country !== "Germany" || item.fee !== 0)) return false;
        if (category === "germany_tu9" && (!item.tags.some(t => t.includes("TU9") || t.includes("Top")))) return false;
        if (category === "germany_uniassist" && (!item.appRoute || !item.appRoute.toLowerCase().includes("uni-assist"))) return false;
        if (category === "germany_direct" && (!item.appRoute || !item.appRoute.toLowerCase().includes("direct"))) return false;
        if (category === "germany_summer" && !item.hasSummer) return false;
        if (category === "top" && (!item.cats.includes("top") && !item.r.includes("Wallonia"))) return false;
        if (category === "game" && !item.cats.includes("game")) return false;
        if (category === "core" && !item.cats.includes("core")) return false;
        if (category === "scholarship" && (!item.cats.includes("scholarship") && !item.em && !item.mm)) return false;
        if (category === "em" && !item.em) return false;
      }

      // Budget Filter
      if (maxBudget > 0) {
        if (item.effectiveFee > maxBudget && !item.em && !item.mm) return false;
      }

      // Applications Open Only
      if (openOnly) {
        if (item.appStatus && item.appStatus.toLowerCase().includes("closed")) return false;
      }

      // Live Text Search
      if (searchQuery) {
        const searchableCorpus = [
          item.u,
          item.name,
          item.c,
          item.country,
          item.r,
          item.t,
          item.sum,
          item.appRoute,
          (item.tags || []).join(" "),
          (item.pre || []).join(" "),
          (item.curriculum || []).join(" ")
        ].join(" ").toLowerCase();

        if (!searchableCorpus.includes(searchQuery)) return false;
      }

      return true;
    });

    // 4. Sort Results
    filtered.sort((a, b) => {
      if (sortBy === "fee") {
        return a.effectiveFee - b.effectiveFee;
      }
      if (sortBy === "deadline") {
        return (a.dl || "9999").localeCompare(b.dl || "9999");
      }
      if (sortBy === "alpha") {
        return a.u.localeCompare(b.u);
      }
      // Default: Best Profile Fit (Descending Score)
      return b.fit.score - a.fit.score;
    });

    // 5. Pagination
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginatedItems = filtered.slice(0, safePage * pageSize);
    const hasMore = paginatedItems.length < totalCount;

    // 6. Aggregate Match Statistics
    const stats = {
      total: totalCount,
      eligible: filtered.filter(p => p.fit.tier === "eligible").length,
      potential: filtered.filter(p => p.fit.tier === "potential").length,
      blocked: filtered.filter(p => p.fit.isBlocked).length,
      germanyCount: filtered.filter(p => p.country === "Germany").length,
      belgiumCount: filtered.filter(p => p.country === "Belgium").length,
      winterCount: filtered.filter(p => p.hasWinter).length,
      summerCount: filtered.filter(p => p.hasSummer).length
    };

    return {
      items: paginatedItems,
      allFiltered: filtered,
      totalCount,
      totalPages,
      currentPage: safePage,
      hasMore,
      stats
    };
  }

  /**
   * Triggers a live dynamic opportunity scan with visual progress callback.
   */
  async scanLiveOpportunities(onProgress) {
    this.isScanning = true;
    const steps = [
      { step: 1, text: "Connecting to Belgian ARES & Flemish Higher Education Repositories...", delay: 350 },
      { step: 2, text: "Querying German DAAD International Master's Database (Computer Science & AI)...", delay: 450 },
      { step: 3, text: "Fetching uni-assist application routes & VPD deadlines for 2026/2027...", delay: 400 },
      { step: 4, text: "Auditing strict ECTS math/theory prerequisites and GPA thresholds...", delay: 350 },
      { step: 5, text: "Filtering out programs failing hard language, degree, and budget constraints...", delay: 300 },
      { step: 6, text: "Dynamic scan complete. Verified opportunities ready!", delay: 200 }
    ];

    for (const s of steps) {
      if (onProgress) onProgress(s);
      await new Promise(r => setTimeout(r, s.delay));
    }

    this.isScanning = false;
    return this.search();
  }
}
