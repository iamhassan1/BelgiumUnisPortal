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

  let md = `# EuroMasters Degree & Visa Strategy Guide (Belgium & Germany)\n\n`;
  md += `_Generated on: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}_\n\n`;

  md += `## 1. Executive Summary & Strategy\n\n`;
  md += `This report provides a verified, personalized roadmap for Computer Science, AI, and Tech Master's programs across **Germany** and **Belgium** for the upcoming academic intakes.\n\n`;
  md += `### Dual-Country Strategy Highlights:\n`;
  md += `1. **Germany: 100% Tuition-Free Public Universities (€0 Tuition)**\n`;
  md += `   - Public universities across 15 of 16 German federal states charge **€0 statutory tuition** for consecutive Master's degrees.\n`;
  md += `   - Only a nominal semester contribution (~€85–€350) is charged, which almost universally includes a free public transport transit pass (Semesterticket).\n`;
  md += `   - Top programs: TUM, RWTH Aachen, Saarland University, University of Bonn, TU Berlin, FAU Erlangen-Nürnberg, University of Passau.\n\n`;
  md += `2. **Belgium: Wallonia-Brussels ARES Exemption (<€1,500/year)**\n`;
  md += `   - Under the Wallonia-Brussels Higher Education Decree, non-EU students from developing countries (such as Pakistan on the OECD/DAC list) are assimilated into Belgian EU tuition rates.\n`;
  md += `   - **Tuition:** €835 to €1,194/year (2026-27 indexed full rate is €1,194).\n`;
  md += `   - **Universities:** UCLouvain (Louvain-la-Neuve), University of Liège (ULiège), University of Namur (UNamur), and ULB (Brussels).\n\n`;
  md += `3. **Full Scholarship Pathways (DAAD, Master Mind & Erasmus Mundus)**\n`;
  md += `   - **Flemish Master Mind Scholarship (VLUHR):** €10,225/yr grant + tuition waiver down to ~€139.40/yr.\n`;
  md += `   - **DAAD / Erasmus Mundus:** 100% tuition waiver + €934 to €1,400/month living stipend + health insurance.\n\n`;

  md += `## 2. Evaluation Baseline Profile\n\n`;
  md += `- **Degree:** ${prof.degree}\n`;
  md += `- **CGPA:** ${prof.cgpa} / 4.00\n`;
  md += `- **English Language (IELTS):** ${prof.ielts} overall (Lowest sub-band: ${prof.band})\n`;
  md += `- **German Proficiency:** ${prof.germanLevel || "None (100% English taught programs)"}\n`;
  md += `- **GRE General Exam:** ${prof.gre ? "Completed / Score Ready" : "Not Taken"}\n`;
  md += `- **Quantitative / Math Background:** ${prof.mathCredits} semester credit hours (~${ectsMath} European ECTS)\n`;
  md += `- **Core CS & Engineering:** ${prof.csCredits || 45} semester credit hours (~${creditsToEcts(prof.csCredits || 45)} ECTS)\n`;
  md += `- **Portfolio Status:** ${prof.hasPortfolio ? "Portfolio Ready (shipped titles/projects)" : "None"}\n`;
  md += `- **Annual Tuition Cap:** €${prof.budget.toLocaleString()} / year\n\n`;

  md += `## 3. Comparison Table of Programs (${list.length} programs)\n\n`;
  md += `| Country | University | Degree Program | Tuition | Profile Fit | Non-EU Deadline |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  list.forEach(p => {
    const fit = calculateFitScore(p, prof);
    md += `| ${p.country || "Belgium"} | **${p.u}** (${p.c}) | ${p.t} | ${p.pill} | ${fit.tierLabel} (${fit.score}%) | ${p.dl || "TBA"} |\n`;
  });

  md += `\n## 4. In-Depth Program Details\n\n`;

  list.forEach((p, idx) => {
    const fit = calculateFitScore(p, prof);
    md += `### ${idx + 1}. [${p.country || "Belgium"}] ${p.u}: ${p.t}\n\n`;
    md += `- **Institution:** ${p.name} (${p.c}, ${p.country || "Belgium"})\n`;
    md += `- **Tuition Fee:** ${p.tu}\n`;
    md += `- **Application Route:** ${p.appRoute || "Direct Portal"}\n`;
    md += `- **Application Fee:** ${p.appFee}\n`;
    md += `- **Language of Instruction:** ${p.lang}\n`;
    md += `- **Non-EU Application Deadline:** ${p.dl || "Check official university portal"}\n`;
    md += `- **IELTS Requirement:** ${p.iel} overall ${p.band ? `(minimum ${p.band} each)` : ""}\n`;
    md += `- **Evaluation Fit Score:** ${fit.tierLabel} (${fit.score}% Match)\n`;
    md += `- **Official Website:** [${p.u} Program Link](${p.url})\n`;
    if (p.applyUrl) md += `- **Application Portal:** [Direct Apply Link](${p.applyUrl})\n`;
    md += `\n`;

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
