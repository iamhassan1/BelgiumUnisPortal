/**
 * Dynamic Fit & Eligibility Engine
 * Evaluates candidate profile against university requirements with ECTS credit hour conversion.
 */

export const DEFAULT_PROFILE = {
  degree: "BS in Computer Science",
  cgpa: 3.75,
  ielts: 6.5,
  band: 6.0,
  gre: false,
  mathCredits: 15,       // Pakistani / US semester credit hours
  csCredits: 45,         // Core CS semester credit hours
  hasPortfolio: true,    // Shipped titles / GitHub / itch.io
  budget: 2000,          // Max annual tuition budget in EUR
  aresEligible: true,    // Nationality on Wallonia ARES exemption list (e.g., Pakistan)
  notes: "5+ years game development experience, 7 shipped titles, Unity / C#"
};

/**
 * Converts semester credit hours to European Credit Transfer System (ECTS).
 * Standard international ratio: 1 US/Pakistani credit hour ≈ 1.8 to 2.0 ECTS.
 */
export function creditsToEcts(creditHours) {
  return Math.round(creditHours * 2.0);
}

/**
 * Performs itemized checks for a university program.
 */
export function checkProgramEligibility(program, profile) {
  const prof = { ...DEFAULT_PROFILE, ...profile };
  const checks = [];
  const userEcts = creditsToEcts(prof.mathCredits);

  // 1. GRE Check
  if (program.gre && !prof.gre) {
    checks.push({
      status: "blocked",
      category: "GRE Test",
      message: "GRE score required by this program, but none on file."
    });
  } else {
    checks.push({
      status: "ok",
      category: "GRE Test",
      message: "No GRE required (or waived)."
    });
  }

  // 2. English Language (IELTS)
  if (prof.ielts < program.iel) {
    checks.push({
      status: "blocked",
      category: "English (IELTS)",
      message: `Requires IELTS ${program.iel} overall (you have ${prof.ielts}).`
    });
  } else if (program.band && prof.band < program.band) {
    checks.push({
      status: "warning",
      category: "English (Sub-score)",
      message: `Requires minimum ${program.band} in each band (your lowest is ${prof.band}). Check university waiver/re-test policy.`
    });
  } else {
    checks.push({
      status: "ok",
      category: "English (IELTS)",
      message: `IELTS requirement met (${prof.ielts} overall, lowest band ${prof.band}).`
    });
  }

  // 3. Tuition & Budget Check
  const effectiveFee = (prof.aresEligible && program.r.includes("Wallonia"))
    ? program.statutoryFee
    : (program.em ? 0 : program.fee);

  if (effectiveFee <= prof.budget) {
    checks.push({
      status: "ok",
      category: "Tuition / Budget",
      message: `${program.pill} is within your annual budget of €${prof.budget.toLocaleString()}.`
    });
  } else if (program.cats.includes("scholarship") || program.em || program.mm) {
    checks.push({
      status: "warning",
      category: "Tuition / Budget",
      message: `Standard fee (€${program.fee.toLocaleString()}) exceeds budget, but fully eligible for scholarship / tuition waiver.`
    });
  } else {
    checks.push({
      status: "blocked",
      category: "Tuition / Budget",
      message: `Fee of €${program.fee.toLocaleString()}/yr exceeds your budget cap of €${prof.budget.toLocaleString()}/yr.`
    });
  }

  // 4. Mathematics & Theoretical Foundations (ECTS Conversion)
  if (program.mathReq > 0) {
    if (prof.mathCredits >= program.mathReq || userEcts >= (program.mathEcts || 30)) {
      checks.push({
        status: "ok",
        category: "Math & Foundations",
        message: `Your ${prof.mathCredits} credit hours (~${userEcts} ECTS in Calculus, Linear Algebra, Diff Eq, Discrete Math & Stats) satisfy the ${program.mathEcts || 30} ECTS requirement.`
      });
    } else {
      checks.push({
        status: "warning",
        category: "Math & Foundations",
        message: `Wants ~${program.mathEcts || 30} ECTS in quantitative subjects. You have ${prof.mathCredits} credit hours (~${userEcts} ECTS). Request syllabus evaluation.`
      });
    }
  } else {
    checks.push({
      status: "ok",
      category: "Math & Foundations",
      message: "No heavy theoretical math prerequisite required."
    });
  }

  // 5. Portfolio & Practical Project Check
  if (program.port) {
    if (prof.hasPortfolio) {
      checks.push({
        status: "ok",
        category: "Creative Portfolio",
        message: "Portfolio requirement satisfied with shipped games, prototypes, and code repository."
      });
    } else {
      checks.push({
        status: "blocked",
        category: "Creative Portfolio",
        message: "This program strictly requires a game/media portfolio and creative submission."
      });
    }
  }

  // 6. Academic GPA Check
  if (prof.cgpa >= program.gpa) {
    checks.push({
      status: "ok",
      category: "Academic Standing",
      message: `CGPA ${prof.cgpa} comfortably exceeds the general minimum requirement of ${program.gpa}.`
    });
  } else {
    checks.push({
      status: "warning",
      category: "Academic Standing",
      message: `Typical competitive bar is ${program.gpa}+ (your current CGPA is ${prof.cgpa}).`
    });
  }

  // 7. Selectivity & Scholarship Nomination
  if (program.sel >= 4) {
    if (prof.cgpa >= 3.5) {
      checks.push({
        status: "warning",
        category: "Selectivity / Awards",
        message: "High competition program. Your 3.5+ CGPA qualifies you for faculty scholarship nomination."
      });
    } else {
      checks.push({
        status: "warning",
        category: "Selectivity",
        message: "Highly selective program. Apply with strong references and detailed motivation letter."
      });
    }
  }

  return checks;
}

/**
 * Calculates a consolidated fit score (0 - 100) and recommendation tier.
 */
export function calculateFitScore(program, profile) {
  const checks = checkProgramEligibility(program, profile);
  let score = 65 + (program.int || 3) * 5;

  checks.forEach(c => {
    if (c.status === "warning") score -= 8;
    if (c.status === "blocked") score -= 38;
  });

  // Adjust for selectivity
  score = Math.max(5, Math.min(98, score - ((program.sel || 3) - 3) * 4));

  const hasBlocked = checks.some(c => c.status === "blocked");
  const rounded = Math.round(score);

  let label = "Good fit";
  let color = "p"; // purple / blue

  if (hasBlocked) {
    label = "Blocked";
    color = "r"; // red
  } else if (rounded >= 80) {
    label = "Strong fit";
    color = "g"; // green
  } else if (rounded >= 65) {
    label = "Good match";
    color = "p"; // primary
  } else {
    label = "Reach / Stretch";
    color = "a"; // amber
  }

  return {
    score: rounded,
    isBlocked: hasBlocked,
    label,
    color,
    checks
  };
}
