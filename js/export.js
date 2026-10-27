/**
 * Markdown & Data Exporter
 * Generates structured, professional Markdown reports for GitHub, notes, or offline review.
 */

import { UNIVERSITIES, BELGIUM_DOMAINS } from './data.js';
import { calculateFitScore, creditsToEcts } from './fit-engine.js';

export function generateMarkdownReport(state) {
  const list = state.shortlist.length > 0
    ? state.shortlist.map(id => UNIVERSITIES.find(u => u.id === id)).filter(Boolean)
    : UNIVERSITIES;

  const prof = state.profile;
  const ectsMath = creditsToEcts(prof.mathCredits);

  let md = `# Belgium Master's Degree & Visa Strategy Guide (CS, AI & Game Tech)\n\n`;
  md += `_Generated on: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}_\n\n`;

  md += `## 1. Executive Summary & Strategy\n\n`;
  md += `This portal guide is designed for international Computer Science and Game Development graduates seeking Master's admissions in Belgium for the **September 2027 intake**.\n\n`;
  md += `### Three-Tier Application Strategy:\n`;
  md += `1. **Tier 1 (Safe & Budget): Wallonia-Brussels ARES Exemption (<€1,500/year)**\n`;
  md += `   - Under the Wallonia-Brussels Higher Education Decree, non-EU students from developing countries (such as Pakistan on the OECD/DAC list) are assimilated into Belgian EU tuition rates.\n`;
  md += `   - **Tuition:** €835 to €1,194/year (2026-27 indexed full rate is €1,194).\n`;
  md += `   - **Universities:** UCLouvain (Louvain-la-Neuve), University of Liège (ULiège), University of Namur (UNamur), and ULB (Brussels).\n\n`;
  md += `2. **Tier 2 (Reach / Fully Funded): Master Mind & Erasmus Mundus (€0 to €140/yr)**\n`;
  md += `   - **Flemish Master Mind Scholarship (VLUHR):** €10,225/yr grant + tuition waiver down to ~€139.40/yr. Host university pre-selection deadlines: Jan 15 – April 1.\n`;
  md += `   - **Erasmus Mundus (IMLEX & DEAI):** 100% tuition waiver + €1,400/month living stipend + insurance + travel grants.\n\n`;
  md += `3. **Tier 3 (Standard Non-EU Flanders): €4,200 – €7,800/year**\n`;
  md += `   - University of Antwerp, VUB, KU Leuven, and Ghent University.\n\n`;

  md += `## 2. Evaluation Baseline Profile\n\n`;
  md += `- **Degree:** ${prof.degree}\n`;
  md += `- **CGPA:** ${prof.cgpa} / 4.00 (Exceeds usual 3.0+ minimum; strong contender for scholarship nomination at 3.5+)\n`;
  md += `- **English Language (IELTS):** ${prof.ielts} overall (Lowest sub-band: ${prof.band})\n`;
  md += `- **GRE Test:** ${prof.gre ? "Completed" : "Not Taken (Waived across all Belgian CS programs)"}\n`;
  md += `- **Quantitative / Math Background:** ${prof.mathCredits} semester credit hours (~${ectsMath} European ECTS in Calculus, Linear Algebra, Diff Eq, Discrete Math & Probability/Statistics)\n`;
  md += `- **Portfolio Status:** ${prof.hasPortfolio ? "7 published game titles (Unity, C#, Shader Graph, XR, Multiplayer Networking)" : "None"}\n`;
  md += `- **Annual Tuition Cap:** €${prof.budget.toLocaleString()} / year\n\n`;

  md += `## 3. Comparison Table of Programs (${list.length} programs)\n\n`;
  md += `| University | Degree Program | Region | Tuition | Profile Fit | Non-EU Deadline |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  list.forEach(p => {
    const fit = calculateFitScore(p, prof);
    md += `| **${p.u}** (${p.c}) | ${p.t} | ${p.r} | ${p.pill} | ${fit.label} (${fit.score}/100) | ${p.dl || "TBA"} |\n`;
  });

  md += `\n## 4. In-Depth Program Details\n\n`;

  list.forEach((p, idx) => {
    const fit = calculateFitScore(p, prof);
    md += `### ${idx + 1}. ${p.u}: ${p.t}\n\n`;
    md += `- **Institution:** ${p.name} (${p.c}, Belgium)\n`;
    md += `- **Tuition Fee:** ${p.tu}\n`;
    md += `- **Application Fee:** ${p.appFee}\n`;
    md += `- **Language of Instruction:** ${p.lang}\n`;
    md += `- **Non-EU Application Deadline:** ${p.dl || "Check official university portal"}\n`;
    md += `- **IELTS Requirement:** ${p.iel} overall ${p.band ? `(minimum ${p.band} each)` : ""}\n`;
    md += `- **Evaluation Fit Score:** ${fit.label} (${fit.score}/100)\n`;
    md += `- **Official Website:** [${p.u} Program Link](${p.url})\n\n`;

    md += `**Strategic Advantages:**\n`;
    p.why.forEach(w => {
      md += `- ${w}\n`;
    });
    md += `\n`;

    md += `**Key Course Modules:**\n`;
    p.curriculum.forEach(c => {
      md += `- ${c}\n`;
    });
    md += `\n`;

    md += `**Eligibility Status Checks:**\n`;
    fit.checks.forEach(c => {
      const icon = c.status === "ok" ? "✓ [OK]" : c.status === "warning" ? "! [WARNING]" : "✕ [BLOCKED]";
      md += `- ${icon} **${c.category}:** ${c.message}\n`;
    });
    md += `\n---\n\n`;
  });

  md += `## 5. Belgian Financial Solvency: Blocked Account vs. Annex 32\n\n`;
  md += `Under **Article 60 of the Belgian Aliens Act**, international students must prove financial means of subsistence for the Long-Stay Student Visa D:\n\n`;
  md += `- **Statutory Monthly Index:** Minimum **€803 / month** (~€9,636 to €10,200 per academic year).\n`;
  md += `- **Route A (Blocked Account - Compte Bloqué):** You deposit the living sum into the university escrow bank account. The university issues an official certificate of financial solvency for the Belgian embassy. Upon arrival in Belgium and opening a local bank account, the university transfers the money back to you in monthly allowances of €803+. **This is your living money returned to you, NOT a university tuition charge!**\n`;
  md += `- **Route B (Annex 32 Guarantor - Annexe 32 / Bijlage 32):** An EU citizen or legal resident earning a verifiable net monthly income above ~€2,000–€2,500 signs a legal sponsorship agreement.\n`;
  md += `- **Route C (Scholarship Certificate):** An official scholarship letter (Master Mind, Erasmus Mundus, ARES) exceeding €803/month completely waives the blocked account requirement.\n\n`;

  md += `## 6. Belgian Student Visa D Step-by-Step Roadmap\n\n`;
  BELGIUM_DOMAINS.visaProcess.steps.forEach(s => {
    md += `${s.step}. **${s.title}:** ${s.desc}\n`;
  });

  md += `\n## 7. Post-Study Rights & Search Year (Zoekjaar)\n\n`;
  md += `- **Orientation Year Visa:** Belgian Master's graduates can apply for a 12-month post-study residence permit to search for a qualified job or start a business.\n`;
  md += `- **Student Working Rights:** Up to 20 hours per week permitted during the academic semester, and full-time during official vacations.\n\n`;

  md += `_Note: Figures and deadlines are subject to annual indexation. Always verify requirements on official university and consular portals._\n`;

  return md;
}

export function downloadFile(filename, content, mimeType = "text/markdown;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
