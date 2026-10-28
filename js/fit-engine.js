/**
 * Dynamic Multi-Stage Eligibility & Fit Engine
 * Enforces strict hard disqualifiers, transparent weighted scoring,
 * and gap diagnosis across Belgian and German university programs.
 */

export const DEFAULT_PROFILE = {
  // Academic Background
  degreeLevel: "BSc in Computer Science",
  major: "Computer Science / Software Engineering",
  cgpa: 3.75,
  gradYear: 2023,
  
  // Quantitative & ECTS Breakdown
  mathCredits: 15,       // Pakistani / US semester credit hours (~30 ECTS)
  csCredits: 45,         // Core CS semester credit hours (~90 ECTS)
  
  // Language Proficiency
  englishTest: "IELTS",
  ielts: 6.5,
  band: 6.0,
  toefl: 90,
  germanLevel: "None",   // "None" | "A1-A2" | "B1" | "B2+" | "TestDaF"
  
  // Tests & Portfolio
  gre: false,
  hasPortfolio: true,    // Shipped titles / GitHub / itch.io / shaders
  
  // Financial Budget & Affordability
  budget: 2000,          // Max annual tuition budget in EUR
  aresEligible: true,    // Nationality on Wallonia ARES exemption list (e.g. Pakistan)
  needsScholarship: false,
  blockedComfort: true,  // Can arrange blocked account (~€9.6k BE / ~€11.9k DE)
  
  // Preferences
  targetCountries: ["Belgium", "Germany"],
  targetCities: [],
  uniType: "All",        // "All" | "Research / TU9" | "Applied Sciences (FH)"
  intake: "Winter / Fall (Sept/Oct)",
  nationality: "Pakistan",
  notes: "5+ years game development experience, 7 shipped titles, Unity / C#"
};

/**
 * Converts semester credit hours to European Credit Transfer System (ECTS).
 * Standard international ratio: 1 US/Pakistani credit hour ≈ 1.8 to 2.0 ECTS.
 */
export function creditsToEcts(creditHours) {
  return Math.round((creditHours || 0) * 2.0);
}

/**
 * Calculates effective annual tuition based on student profile and statutory exemptions.
 */
export function getEffectiveTuition(program, profile) {
  if (!program) return 0;
  const prof = { ...DEFAULT_PROFILE, ...profile };
  
  // 1. Germany Public Tuition-Free Policy
  if (program.country === "Germany" && program.fee === 0) {
    return 0;
  }
  
  // 2. Wallonia ARES Developing Country Exemption (Belgium)
  if (prof.aresEligible && program.r && program.r.includes("Wallonia")) {
    return program.statutoryFee || 1194;
  }
  
  // 3. Full Scholarship Programs (Erasmus Mundus / Master Mind full waiver)
  if (program.em || (program.mm && prof.needsScholarship)) {
    return 0;
  }
  
  return program.fee || 0;
}

/**
 * Performs strict, multi-stage itemized eligibility checks for a program against candidate profile.
 */
export function checkProgramEligibility(program, profile) {
  if (!program) return [];
  const prof = { ...DEFAULT_PROFILE, ...profile };
  const checks = [];
  const userMathEcts = creditsToEcts(prof.mathCredits);
  const userCsEcts = creditsToEcts(prof.csCredits);
  const effectiveFee = getEffectiveTuition(program, prof);

  // 1. Degree & Academic Eligibility
  checks.push({
    status: "ok",
    category: "Degree Level",
    message: `Bachelor's background in ${prof.major || "Computer Science"} satisfies master's entry prerequisite.`
  });

  // 2. English Language (IELTS / TOEFL) - Hard Disqualifier
  const requiredIelts = program.iel || 6.5;
  const requiredBand = program.band || 6.0;

  if (prof.ielts < requiredIelts) {
    checks.push({
      status: "blocked",
      category: "English Language",
      message: `Hard Disqualifier: Requires IELTS ${requiredIelts} overall (you have ${prof.ielts}). Score must be improved before submission.`
    });
  } else if (prof.band < requiredBand) {
    checks.push({
      status: "warning",
      category: "English Sub-score",
      message: `Requires minimum ${requiredBand} in each sub-band (your lowest is ${prof.band}). Request department conditional waiver or retake single skill.`
    });
  } else {
    checks.push({
      status: "ok",
      category: "English Language",
      message: `English proficiency requirement met (${prof.ielts} overall, lowest sub-band ${prof.band}).`
    });
  }

  // 3. German Language Requirement - Hard Disqualifier
  const isGermanRequired = program.germanReq && !program.germanReq.toLowerCase().includes("none");
  if (isGermanRequired) {
    if (prof.germanLevel === "None" || prof.germanLevel === "A1-A2") {
      checks.push({
        status: "blocked",
        category: "German Language",
        message: `Hard Disqualifier: Program requires German proficiency (${program.germanReq}). Your profile indicates English only.`
      });
    } else {
      checks.push({
        status: "ok",
        category: "German Language",
        message: `German language prerequisite satisfied (${prof.germanLevel}).`
      });
    }
  } else {
    checks.push({
      status: "ok",
      category: "German Language",
      message: "No German required: 100% English-taught program."
    });
  }

  // 4. GRE Test Requirement - Hard Disqualifier if mandatory
  if (program.gre === 1 && !prof.gre) {
    checks.push({
      status: "blocked",
      category: "GRE Examination",
      message: "Hard Disqualifier: Mandatory GRE General Test score required for non-EU bachelor degree holders."
    });
  } else if (program.gre === 2 && !prof.gre) {
    checks.push({
      status: "warning",
      category: "GRE Examination",
      message: "GRE is recommended by faculty to strengthen admission competitiveness, but not strictly mandatory."
    });
  } else {
    checks.push({
      status: "ok",
      category: "GRE Examination",
      message: "No GRE test required (or test requirement satisfied)."
    });
  }

  // 5. Creative / Game Portfolio Requirement - Hard Disqualifier
  if (program.port) {
    if (prof.hasPortfolio) {
      checks.push({
        status: "ok",
        category: "Creative Portfolio",
        message: "Portfolio requirement satisfied with shipped games, prototypes, and GitHub code repository."
      });
    } else {
      checks.push({
        status: "blocked",
        category: "Creative Portfolio",
        message: "Hard Disqualifier: Program strictly mandates a game or creative project portfolio."
      });
    }
  }

  // 6. Tuition Fee & Budget Cap - Hard Disqualifier
  if (effectiveFee <= prof.budget) {
    checks.push({
      status: "ok",
      category: "Tuition / Affordability",
      message: `Annual tuition (€${effectiveFee.toLocaleString()}/yr) is within your budget cap of €${prof.budget.toLocaleString()}/yr.`
    });
  } else if (program.cats && (program.cats.includes("scholarship") || program.em || program.mm)) {
    checks.push({
      status: "warning",
      category: "Tuition / Affordability",
      message: `Standard fee (€${program.fee.toLocaleString()}/yr) exceeds self-funded budget, but program has full scholarship / tuition waiver opportunity.`
    });
  } else {
    checks.push({
      status: "blocked",
      category: "Tuition / Affordability",
      message: `Hard Disqualifier: Annual tuition of €${program.fee.toLocaleString()}/yr exceeds your budget cap of €${prof.budget.toLocaleString()}/yr.`
    });
  }

  // 7. Academic Standing & CGPA
  const competitiveGpa = program.gpa || 3.0;
  if (prof.cgpa >= competitiveGpa) {
    checks.push({
      status: "ok",
      category: "Academic Standing",
      message: `CGPA ${prof.cgpa} comfortably exceeds the competitive threshold of ${competitiveGpa}.`
    });
  } else if (prof.cgpa >= competitiveGpa - 0.25) {
    checks.push({
      status: "warning",
      category: "Academic Standing",
      message: `Borderline CGPA: typical competitive threshold is ${competitiveGpa}+ (your CGPA is ${prof.cgpa}). Strong motivation letter and references required.`
    });
  } else {
    checks.push({
      status: "blocked",
      category: "Academic Standing",
      message: `Hard Disqualifier: CGPA ${prof.cgpa} is below the university minimum threshold (${competitiveGpa}).`
    });
  }

  // 8. Quantitative & ECTS Prerequisite (German & Belgian university standard)
  const reqMathEcts = program.mathEcts || 0;
  if (reqMathEcts > 0) {
    if (userMathEcts >= reqMathEcts) {
      checks.push({
        status: "ok",
        category: "Math & ECTS Foundations",
        message: `Your ${prof.mathCredits} credit hours (~${userMathEcts} ECTS in Calculus, Linear Algebra, Diff Eq & Stats) satisfy the ${reqMathEcts} ECTS requirement.`
      });
    } else if (userMathEcts >= reqMathEcts - 8) {
      checks.push({
        status: "warning",
        category: "Math & ECTS Foundations",
        message: `Requires ~${reqMathEcts} ECTS in quantitative and theoretical foundations (you have ~${userMathEcts} ECTS). Request syllabus evaluation.`
      });
    } else {
      checks.push({
        status: "blocked",
        category: "Math & ECTS Foundations",
        message: `Hard Disqualifier: Significant quantitative prerequisite gap: requires ~${reqMathEcts} ECTS (you have ~${userMathEcts} ECTS).`
      });
    }
  } else {
    checks.push({
      status: "ok",
      category: "Math & ECTS Foundations",
      message: "No heavy theoretical mathematics prerequisite enforced."
    });
  }

  // 9. Country Preference Alignment
  if (prof.targetCountries && prof.targetCountries.length > 0 && !prof.targetCountries.includes("All Countries")) {
    if (!prof.targetCountries.includes(program.country)) {
      checks.push({
        status: "warning",
        category: "Country Preference",
        message: `Located in ${program.country}, which is outside your currently active target country filters (${prof.targetCountries.join(", ")}).`
      });
    }
  }

  return checks;
}

/**
 * Calculates consolidated match score (0 - 100), diagnosis, and categorization tier.
 */
export function calculateFitScore(program, profile) {
  if (!program) {
    return {
      score: 0,
      tier: "blocked",
      tierLabel: "Not Eligible",
      tierColor: "r",
      isBlocked: true,
      effectiveFee: 0,
      whyMatched: [],
      gapsToVerify: ["Program details unavailable"],
      hardBlockers: ["Program details unavailable"],
      checks: []
    };
  }
  const prof = { ...DEFAULT_PROFILE, ...profile };
  const checks = checkProgramEligibility(program, prof);
  
  const hardBlockers = checks.filter(c => c.status === "blocked");
  const warnings = checks.filter(c => c.status === "warning");
  const okChecks = checks.filter(c => c.status === "ok");

  // Weighted base calculation
  let score = 68;

  // GPA Weight (+14 to -12)
  const gpaDiff = prof.cgpa - (program.gpa || 3.0);
  if (gpaDiff >= 0.5) score += 12;
  else if (gpaDiff >= 0) score += 7;
  else score -= 12;

  // Math/ECTS Weight (+8 to -12)
  const userMathEcts = creditsToEcts(prof.mathCredits);
  const mathEcts = program.mathEcts || 25;
  if (userMathEcts >= mathEcts + 5) score += 8;
  else if (userMathEcts < mathEcts) score -= 10;

  // Language Buffer (+5)
  if (prof.ielts >= (program.iel || 6.5) + 0.5) score += 5;

  // Affordability Weight (+8)
  const effectiveFee = getEffectiveTuition(program, prof);
  if (effectiveFee <= prof.budget) score += 8;

  // Portfolio Alignment (+5)
  if (program.port && prof.hasPortfolio) score += 6;

  // Deductions for warnings and hard blockers
  warnings.forEach(() => { score -= 7; });
  hardBlockers.forEach(() => { score -= 36; });

  // Selectivity factor adjustment
  const selFactor = (program.sel || 3) - 3;
  score -= selFactor * 3;

  score = Math.max(5, Math.min(98, Math.round(score)));

  // Generate "Why You Match" positive highlights
  const whyMatched = [];
  if (prof.cgpa >= (program.gpa || 3.0)) {
    whyMatched.push(`Your CGPA of ${prof.cgpa} comfortably exceeds the university baseline (${program.gpa || 3.0}).`);
  }
  if (effectiveFee === 0) {
    whyMatched.push(`100% Tuition-Free program (€0 tuition) perfectly matches zero-cost study preference.`);
  } else if (effectiveFee <= prof.budget) {
    whyMatched.push(`Affordable tuition of €${effectiveFee.toLocaleString()}/yr is within your €${prof.budget.toLocaleString()} budget.`);
  }
  if (!program.germanReq || program.germanReq.toLowerCase().includes("none")) {
    whyMatched.push(`100% English curriculum with zero German language prerequisites.`);
  }
  if (program.port && prof.hasPortfolio) {
    whyMatched.push(`Your practical game development / code portfolio directly fulfills creative criteria.`);
  }
  if (userMathEcts >= (program.mathEcts || 25)) {
    whyMatched.push(`Quantitative credit hours (~${userMathEcts} ECTS) fully satisfy theoretical mathematics prerequisites.`);
  }

  // Generate "Gaps to Verify" actionable advice
  const gapsToVerify = [];
  warnings.forEach(w => {
    gapsToVerify.push(`${w.category}: ${w.message}`);
  });
  if (program.appRoute && program.appRoute.includes("uni-assist")) {
    gapsToVerify.push("Requires uni-assist credential evaluation (submit documents 6–8 weeks early for VPD).");
  }
  if (program.gre === 1) {
    gapsToVerify.push("Requires official GRE General score report directly dispatched to institution code.");
  }

  // Determine Categorization Tier
  const isBlocked = hardBlockers.length > 0;
  let tier = "eligible";
  let tierLabel = "Eligible";
  let tierColor = "g"; // green

  if (isBlocked) {
    tier = "blocked";
    tierLabel = "Not Eligible";
    tierColor = "r"; // red
  } else if (score >= 76 && warnings.length <= 1) {
    tier = "eligible";
    tierLabel = "Eligible (Confirmed Match)";
    tierColor = "g"; // green
  } else {
    tier = "potential";
    tierLabel = "Potential Match — Needs Verification";
    tierColor = "a"; // amber
  }

  return {
    score,
    tier,
    tierLabel,
    tierColor,
    isBlocked,
    effectiveFee,
    whyMatched: whyMatched.slice(0, 3),
    gapsToVerify: gapsToVerify.slice(0, 3),
    hardBlockers: hardBlockers.map(b => b.message),
    checks
  };
}
