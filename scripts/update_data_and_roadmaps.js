import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '..', 'js', 'data.js');
const mod = await import('file:///' + dataPath.replace(/\\/g, '/'));

// Enrich 26 universities with standardized intake & date properties
const enrichedUnis = mod.UNIVERSITIES.map(u => {
  const isGermany = u.country === "Germany";
  
  // German programs with both winter & summer
  // TUM Informatics & Data Engineering: Winter (Nov 15/Jan 1 - May 31), Summer (Sep 1 - Nov 30)
  // RWTH Aachen CS & SSE: Winter (Dec 1 - Mar 1), Summer (Jun 1 - Sep 1)
  // Saarland CS & Visual: Winter (Jan 15 - May 15), Summer (Jul 15 - Nov 15)
  // Bonn AI & Robotics: Winter (Dec 1 - Mar 15), Summer (May 1 - Sep 15)
  // TU Berlin: Winter (Apr 4 - May 15), Summer (Dec 1 - Jan 15)
  // FAU: Winter (Feb 1 - Apr 15), Summer (Aug 1 - Oct 15)
  // Passau: Winter (Apr 1 - Jun 30), Summer (Oct 1 - Dec 15)
  const summerGermanSlugs = [
    'tum-informatics',
    'tum-data-engineering',
    'rwth-aachen-cs',
    'rwth-aachen-sse',
    'saarland-cs',
    'saarland-visual-computing',
    'bonn-ai-robotics',
    'tu-berlin-cs',
    'fau-computational-engineering',
    'passau-ai-cs'
  ];

  const hasSummer = isGermany && summerGermanSlugs.includes(u.slug);
  const intakes = hasSummer ? ["Winter", "Summer"] : ["Winter"];

  let winterOpening = "1 Dec 2026";
  let winterDeadline = u.dl || "31 Mar 2027";
  let summerOpening = null;
  let summerDeadline = null;

  if (u.slug.startsWith("tum-")) {
    winterOpening = "1 Jan 2027";
    winterDeadline = "31 May 2027";
    summerOpening = "1 Sep 2026";
    summerDeadline = "30 Nov 2026";
  } else if (u.slug.startsWith("rwth-")) {
    winterOpening = "1 Dec 2026";
    winterDeadline = "1 Mar 2027";
    summerOpening = "1 Jun 2026";
    summerDeadline = "1 Sep 2026";
  } else if (u.slug.startsWith("saarland-")) {
    winterOpening = "15 Jan 2027";
    winterDeadline = "15 May 2027";
    summerOpening = "15 Jul 2026";
    summerDeadline = "15 Nov 2026";
  } else if (u.slug === "bonn-ai-robotics") {
    winterOpening = "1 Dec 2026";
    winterDeadline = "15 Mar 2027";
    summerOpening = "1 May 2026";
    summerDeadline = "15 Sep 2026";
  } else if (u.slug === "tu-berlin-cs") {
    winterOpening = "4 Apr 2027";
    winterDeadline = "15 May 2027";
    summerOpening = "1 Dec 2026";
    summerDeadline = "15 Jan 2027";
  } else if (u.slug === "stuttgart-cs") {
    winterOpening = "1 Dec 2026";
    winterDeadline = "15 Feb 2027";
  } else if (u.slug === "fau-computational-engineering") {
    winterOpening = "1 Feb 2027";
    winterDeadline = "15 Apr 2027";
    summerOpening = "1 Aug 2026";
    summerDeadline = "15 Oct 2026";
  } else if (u.slug === "passau-ai-cs") {
    winterOpening = "1 Apr 2027";
    winterDeadline = "30 Jun 2027";
    summerOpening = "1 Oct 2026";
    summerDeadline = "15 Dec 2026";
  } else if (u.slug === "cologne-game-lab-games") {
    winterOpening = "1 Feb 2027";
    winterDeadline = "31 Mar 2027";
  } else if (u.slug.startsWith("uclouvain-")) {
    winterOpening = "15 Nov 2026";
    winterDeadline = "31 Mar 2027";
  } else if (u.slug.startsWith("uliege-") || u.slug.startsWith("unamur-") || u.slug.startsWith("ulb-")) {
    winterOpening = "1 Feb 2027";
    winterDeadline = u.dl || "31 Mar 2027";
  } else if (u.em) {
    winterOpening = "15 Oct 2026";
    winterDeadline = "15 Jan 2027";
  } else {
    winterOpening = "1 Nov 2026";
    winterDeadline = u.dl || "1 Mar 2027";
  }

  const winterTimeline = `Opens ${winterOpening} · Closes ${winterDeadline}`;
  const summerTimeline = hasSummer ? `Opens ${summerOpening} · Closes ${summerDeadline}` : null;

  return {
    ...u,
    intakes,
    hasWinter: true,
    hasSummer,
    winterOpening,
    winterDeadline,
    summerOpening,
    summerDeadline,
    winterTimeline,
    summerTimeline
  };
});

// Dynamic country-specific category mappings
const categoriesByCountry = {
  "All Countries": [
    ["all", "All Programs"],
    ["germany", "🇩🇪 Germany: €0 Tuition"],
    ["top", "🇧🇪 Wallonia ARES (<€1.5k/yr)"],
    ["game", "Game Design & XR"],
    ["core", "Core CS & AI"],
    ["scholarship", "Full Scholarships (DAAD / Master Mind / EM)"]
  ],
  "Germany": [
    ["all", "All German Programs"],
    ["germany_free", "€0 Public Tuition"],
    ["germany_tu9", "TU9 & Elite Tech"],
    ["germany_uniassist", "uni-assist VPD Portals"],
    ["germany_direct", "Direct Portals"],
    ["germany_summer", "Summer & Winter Intakes"],
    ["game", "Game Design (CGL)"]
  ],
  "Belgium": [
    ["all", "All Belgian Programs"],
    ["top", "Wallonia ARES (<€1.5k/yr)"],
    ["scholarship", "Flemish Master Mind Eligible"],
    ["game", "Game Design & XR (LUCA / Howest)"],
    ["core", "Core CS & AI (UCLouvain, ULiège, VUB, KUL)"],
    ["em", "Erasmus Mundus (€0 + €1.4k/mo)"]
  ]
};

const defaultCategories = categoriesByCountry["All Countries"];

const intakes = [
  { key: "all", label: "🌍 All Intakes" },
  { key: "winter", label: "📅 Winter / Fall 2027 (Sept/Oct)" },
  { key: "summer", label: "☀️ Summer / Spring 2027 (Mar/Apr)" }
];

const regions = [
  "Germany: Bavaria",
  "Germany: North Rhine-Westphalia",
  "Germany: Saarland",
  "Germany: Berlin",
  "Germany: Baden-Württemberg",
  "Wallonia/Brussels",
  "Flanders",
  "International / Joint",
  "Netherlands (Benchmark)"
];

const countries = [
  "All Countries",
  "Belgium",
  "Germany",
  "Netherlands"
];

// Belgium Visa Roadmap Data
const belgiumVisaRoadmap = {
  country: "Belgium",
  flag: "🇧🇪",
  title: "Belgian Student Visa D Blueprint (2026 / 2027)",
  subtitle: "Zero confusion, zero legal jargon. How much it costs, what documents are required, and when to take action for your Belgian Master's journey.",
  stats: {
    livingProof: "€803 / mo",
    livingProofSub: "Statutory Compte Bloqué (100% returned monthly)",
    processing: "3 to 5 Wks",
    processingSub: "Average turnaround via Gerry's / Embassy",
    searchYear: "12 Months",
    searchYearSub: "Orientation year work permit (Zoekjaar)",
    tuitionFee: "€835 – €1,194",
    tuitionFeeSub: "Wallonia ARES EU-rate for developing countries"
  },
  phases: [
    {
      num: "01",
      title: "University Admission & Exemption",
      time: "Oct – Mar",
      actions: [
        "Apply to 3–4 programs across Wallonia (UCLouvain, ULiège, UNamur) and Flanders portals.",
        "Submit academic transcripts, CV, and English test certificate (IELTS 6.5+).",
        "Verify DAC developing-country assimilation for Wallonia ARES exemption under €1.2k/year.",
        "Receive your formal university Admission Offer Letter."
      ],
      tip: "Apply to at least one Wallonia university to lock in statutory EU rates (<€1.2k/yr) and avoid €5k+ surcharges!"
    },
    {
      num: "02",
      title: "Attestation & Blocked Account",
      time: "Mar – Jun",
      actions: [
        "Attest Bachelor degree & transcripts via HEC and MOFA Apostille stamp.",
        "Transfer ~€9,636 to €10,200 into university blocked account escrow (or obtain signed Annex 32 guarantee).",
        "University issues your formal Solvency Certificate for the Belgian Embassy."
      ],
      tip: "The University Blocked Account has a 99%+ visa approval rate because funds are pre-secured in Belgium in your own name."
    },
    {
      num: "03",
      title: "Embassy Visa D Dossier",
      time: "Jun – Aug",
      actions: [
        "Undergo medical checkup with an official Belgian embassy-designated panel doctor.",
        "Obtain Police Character Certificate (<6 months old at submission, MOFA attested).",
        "Pay federal administrative contribution (~€246) to the Belgian Immigration Office (Office des Étrangers).",
        "Submit physical dossier & biometric fingerprints at VFS Global / Gerry's Visa Drop Box."
      ],
      tip: "Do not get your police character certificate too early—it must be strictly under 6 months old when submitted!"
    },
    {
      num: "04",
      title: "Landing & Belgian ID (Card A)",
      time: "Sept – Oct",
      actions: [
        "Book student accommodation ('kot') and fly into Brussels Airport (BRU).",
        "Register at your local town hall (Maison Communale / Gemeentehuis) within 8 days of landing.",
        "Open a local Belgian bank account (KBC, ING, BNP Paribas Fortis) to receive €803 monthly payouts.",
        "Local police officer validates residential address; collect your Biometric Residence Card A."
      ],
      tip: "Your Card A grants full legal rights to work 20 hrs/week during classes and full-time 38 hrs/week during holidays!"
    }
  ],
  solvency: {
    title: "How the Belgian Blocked Account (Compte Bloqué) Works",
    summary: "Under Article 60 of the Belgian Aliens Act, international students must demonstrate €803/month for living expenses. You are NOT paying a fee—you are simply placing your living money into escrow in your own name, which the university releases back into your personal Belgian account every month.",
    steps: [
      { step: "Step 1", title: "Transfer Living Deposit", desc: "Transfer €9,636 to €10,200 into the university escrow bank account before visa submission." },
      { step: "Step 2", title: "Embassy Attestation", desc: "University financial office issues an official Solvency Certificate confirming funds are held for you." },
      { step: "Step 3", title: "Visa D Granted", desc: "Belgian Immigration Office (OE) reviews and approves your Long-Stay Category D student visa." },
      { step: "Step 4", title: "Monthly Payouts", desc: "Arrive in Belgium, open a bank account, and receive €803 transferred back to you on the 1st of each month!" }
    ]
  },
  checklist: [
    { id: "be_passport", col: "academic", title: "Valid International Passport", note: "At least 18 months validity remaining + 2 blank visa pages." },
    { id: "be_degree", col: "academic", title: "Bachelor Degree & Transcripts", note: "Originals verified by HEC and MOFA with official Apostille stamp." },
    { id: "be_ielts", col: "academic", title: "IELTS Academic Certificate", note: "Minimum 6.5 overall (minimum 6.0 in each sub-band)." },
    { id: "be_syllabi", col: "academic", title: "Course Syllabi PDF Booklet", note: "Detailed breakdown of completed modules (topics, textbooks, credit hours)." },
    { id: "be_cv", col: "academic", title: "Europass CV & Motivation Letters", note: "Tailored statement of purpose explaining your specialization choice." },
    { id: "be_refs", col: "academic", title: "2 Recommendation Letters", note: "Signed references from university professors or tech employers." },
    { id: "be_offer", col: "visa", title: "Official University Offer Letter", note: "Unconditional or conditional admission letter from Belgian institution." },
    { id: "be_solvency", col: "visa", title: "Proof of Financial Solvency", note: "University Blocked Account attestation or signed Annex 32 guarantee." },
    { id: "be_medical", col: "visa", title: "Embassy Panel Doctor Medical", note: "Fit-to-travel certificate from Belgian Embassy-approved panel clinic." },
    { id: "be_police", col: "visa", title: "Police Character Certificate", note: "Clean criminal record certificate issued within 6 months, MOFA attested." },
    { id: "be_admin_fee", col: "visa", title: "Federal Admin Fee Receipt", note: "Bank Swift proof of ~€246 paid to Belgian Immigration Office." },
    { id: "be_visa_form", col: "visa", title: "Visa D Application Form & Photos", note: "Completed Long-Stay Visa D form with 2 Schengen biometric photos." }
  ],
  budget: [
    { item: "Belgian Federal Admin Fee", amount: "€246", type: "Mandatory Government Fee", note: "Paid directly to Office des Étrangers via bank transfer" },
    { item: "Gerry's / VFS Drop Box Fee", amount: "€35 – €50", type: "Submission & Biometrics", note: "Courier and biometric collection processing" },
    { item: "Embassy Medical Examination", amount: "€80 – €120", type: "Designated Panel Doctor", note: "Chest X-ray, blood screening, and fit-to-travel certificate" },
    { item: "HEC & MOFA Document Attestations", amount: "€40 – €70", type: "Academic Verification", note: "Per document Apostille and verification stamps" },
    { item: "One-Way Flight to Brussels (BRU)", amount: "€400 – €550", type: "Travel Outlay", note: "Direct or one-stop connection to Brussels" },
    { item: "First Month Kot Deposit (Refundable)", amount: "€400 – €500", type: "Housing Escrow", note: "Held by landlord or university housing office" }
  ],
  faqs: [
    { q: "Is the €803/month blocked account deposit separate from university tuition?", a: "YES, 100% separate! The blocked account is YOUR living money for food, rent, and daily expenses. It is deposited in escrow and transferred back into your Belgian pocket every month in €803 disbursements." },
    { q: "Who qualifies for the Wallonia ARES tuition rate (<€1.5k/year)?", a: "Under Wallonia-Brussels decree, students holding nationality from countries listed on the OECD/DAC list of developing countries (e.g. Pakistan, Bangladesh, Nigeria, Ghana, etc.) are exempted from the €4,175 surcharge at UCLouvain, ULiège, UNamur, and ULB." },
    { q: "Can an EU relative sponsor me instead of depositing a blocked account?", a: "Yes! An Annex 32 (Annexe 32 / Bijlage 32) financial guarantee signed by an EU citizen or legal permanent resident earning a verifiable net monthly income above ~€2,000–€2,500 completely waives the blocked account requirement." },
    { q: "Can I work part-time while studying in Belgium?", a: "Yes. Non-EU students holding Residence Card A are legally authorized to work up to 20 hours per week during the semester, and full-time (up to 38 hours/week) during summer and university holidays." },
    { q: "What is the Zoekjaar (Search Year) after graduation?", a: "Upon completing your Master's, you receive a 12-month post-study residence permit to search for a qualified job or launch a startup in Belgium. Once hired, your company transitions you to a Belgian Single Permit." }
  ]
};

// Germany Visa Roadmap Data
const germanyVisaRoadmap = {
  country: "Germany",
  flag: "🇩🇪",
  title: "German National Student Visa (Category D) Blueprint (2026 / 2027)",
  subtitle: "Step-by-step master plan for German tuition-free universities: uni-assist VPD, Sperrkonto (€992/mo), health insurance, embassy appointment, and § 16b residence permit.",
  stats: {
    livingProof: "€992 / mo",
    livingProofSub: "Statutory Sperrkonto (€11,904/yr returned monthly)",
    processing: "4 to 8 Wks",
    processingSub: "Turnaround via German Mission / VFS Global",
    searchYear: "18 Months",
    searchYearSub: "Post-study jobseeker visa with Blue Card PR",
    tuitionFee: "€0 / yr",
    tuitionFeeSub: "Public university tuition-free statutory policy"
  },
  phases: [
    {
      num: "01",
      title: "uni-assist VPD & University Portals",
      time: "Nov – May",
      actions: [
        "Check whether your target programs (e.g. TUM, Passau) mandate a preliminary inspection (VPD) through uni-assist.",
        "Submit certified bachelor degree, transcripts, and IELTS report to uni-assist 6 to 8 weeks prior to deadline.",
        "Once uni-assist issues your VPD grade certificate, upload it directly into the university application portal.",
        "Receive your formal Admission Letter (Zulassungsbescheid)."
      ],
      tip: "Apply for uni-assist VPD as early as December/January—the evaluation takes 4–6 weeks during peak season!"
    },
    {
      num: "02",
      title: "Blocked Account (Sperrkonto) & Health Insurance",
      time: "Apr – Jul",
      actions: [
        "Open a digital German blocked account (Sperrkonto) via approved providers: Expatrio, Fintiba, or Coracle.",
        "Transfer statutory living deposit: €992/month = €11,904 for the 1-year visa duration.",
        "Sign up for German statutory student health insurance (Techniker Krankenkasse - TK, Barmer, or DAK) or incoming travel coverage.",
        "Download your official Blocking Confirmation (Sperrbestätigung) for the embassy."
      ],
      tip: "Providers like Expatrio offer all-in-one 'Value Packages' combining the Sperrkonto, free incoming insurance, and TK public health coverage with fee cashback!"
    },
    {
      num: "03",
      title: "German National Visa (Category D) Appointment",
      time: "Jun – Aug",
      actions: [
        "Book an appointment via the German Embassy or VFS Global Visa Center (using the official CSP booking system).",
        "Complete and print the Videx National Visa Application Form with 2 Schengen biometric photos.",
        "Compile complete dossier: Zulassungsbescheid, Sperrbestätigung, HEC/MOFA transcripts, English certificate, and motivation letter.",
        "Attend visa interview, submit biometrics, and pay the statutory €75 national visa fee."
      ],
      tip: "Prepare a clear 1-2 page Motivation Letter explaining why you chose this specific degree, university, and how it aligns with your career goals."
    },
    {
      num: "04",
      title: "Anmeldung, Bank Payouts & Residence Permit (§ 16b)",
      time: "Sept – Oct",
      actions: [
        "Fly to Germany, move into your student WG or Studentenwerk dorm, and obtain your landlord confirmation (Wohnungsgeberbestätigung).",
        "Register your address at the local City Hall (Bürgeramt / Einwohnermeldeamt) within 14 days (Anmeldung).",
        "Open a German Girokonto bank account (N26, Revolut, Sparkasse) and activate your Sperrkonto for monthly €992 payouts.",
        "Book an appointment at the local Immigration Office (Ausländerbehörde) to receive your Electronic Residence Permit (§ 16b AufenthG)."
      ],
      tip: "Your German student residence permit legally allows you to work 140 full days or 280 half days per calendar year (20 hours/week)!"
    }
  ],
  solvency: {
    title: "How the German Blocked Account (Sperrkonto) Works",
    summary: "For the German National Student Visa (§ 16b AufenthG), international students must prove financial means of €992/month (€11,904 for 2026/2027). You are NOT paying a fee—your money is held in a protected bank escrow under your own name and disbursed back to you every month.",
    steps: [
      { step: "Step 1", title: "Open Account Online", desc: "Set up a digital Sperrkonto in 15 minutes through Expatrio, Fintiba, or Coracle from home." },
      { step: "Step 2", title: "Transfer €11,904", desc: "Transfer the living funds via international wire. Provider instantly issues official Sperrbestätigung." },
      { step: "Step 3", title: "Embassy Visa Issued", desc: "The German consulate verifies the Sperrbestätigung and grants your Category D national entry visa." },
      { step: "Step 4", title: "Monthly €992 Payouts", desc: "Land in Germany, open a local current account, and receive €992 deposited automatically each month!" }
    ]
  },
  checklist: [
    { id: "de_passport", col: "academic", title: "Valid National Passport", note: "Valid for at least 12 months with minimum 2 blank visa pages." },
    { id: "de_degree", col: "academic", title: "Bachelor Degree & Transcripts", note: "Originals verified by HEC and MOFA with certified English copies." },
    { id: "de_ielts", col: "academic", title: "IELTS / TOEFL English Certificate", note: "Minimum IELTS 6.5 overall (or TOEFL iBT 88+)." },
    { id: "de_admission", col: "visa", title: "University Admission Letter (Zulassungsbescheid)", note: "Official acceptance letter or uni-assist VPD documentation." },
    { id: "de_sperrkonto", col: "visa", title: "Blocked Account Confirmation (€11,904)", note: "Official Sperrbestätigung from Expatrio, Fintiba, or Coracle." },
    { id: "de_health", col: "visa", title: "Proof of Health Insurance", note: "Statutory student health coverage (TK, Barmer) or travel health certificate." },
    { id: "de_videx", col: "visa", title: "Videx National Visa Form", note: "Completed online, printed, and signed (2 sets of copies)." },
    { id: "de_motivation", col: "academic", title: "Letter of Motivation", note: "Detailed explanation of study plans, reasons for choosing Germany, and career prospects." },
    { id: "de_cv", col: "academic", title: "Chronological Europass CV", note: "Complete educational background with zero unexplained gaps." },
    { id: "de_photos", col: "visa", title: "3 Biometric Passport Photos", note: "35x45mm, neutral facial expression, white background." },
    { id: "de_fee", col: "visa", title: "Visa Processing Fee (€75)", note: "Payable in local currency or demand draft at the visa appointment." }
  ],
  budget: [
    { item: "German National Visa Fee", amount: "€75", type: "Statutory Embassy Fee", note: "Payable at Embassy / VFS Global interview" },
    { item: "uni-assist VPD Application", amount: "€75 first / €30 additional", type: "Credential Evaluation", note: "For universities requiring preliminary VPD" },
    { item: "Semester Contribution (Semesterbeitrag)", amount: "€85 – €350", type: "Statutory University Dues", note: "Charged per semester; almost always includes free public transit ticket" },
    { item: "Blocked Account Setup Fee", amount: "€49 – €89", type: "Escrow Administration", note: "One-off fee to Expatrio / Fintiba" },
    { item: "One-Way Flight to Germany (FRA/MUC/BER)", amount: "€450 – €600", type: "Travel Outlay", note: "Direct or transit flight to Munich, Frankfurt, or Berlin" },
    { item: "Dorm / WG Security Deposit (Kaution)", amount: "€500 – €800", type: "Refundable Housing Deposit", note: "Returned at the end of the tenancy agreement" }
  ],
  faqs: [
    { q: "Is public university tuition really €0 in Germany?", a: "YES! 15 out of 16 German federal states have completely abolished tuition for consecutive Master's degrees at public universities. You pay only a semester contribution (~€85–€350) which includes your public transportation pass." },
    { q: "How do I activate my blocked account (Sperrkonto) after arriving in Germany?", a: "After landing, complete your City Registration (Anmeldung) at the Bürgeramt, open a free German checking account (e.g. N26 or Sparkasse), and upload your entry visa stamp and IBAN onto your Expatrio/Fintiba dashboard. Your €992 monthly payout starts immediately." },
    { q: "Do I need an APS certificate to apply from Pakistan?", a: "No! The APS certificate is currently mandatory only for applicants with educational credentials from India, China, and Vietnam. Applicants from Pakistan, Bangladesh, and other regions do not require APS unless specifically instructed by a university." },
    { q: "What are the student working rights in Germany?", a: "International students can legally work up to 140 full days or 280 half days per calendar year (up to 20 hours/week during semester term). Working as an academic student assistant (HiWi) has virtually no hourly cap." },
    { q: "How does the 18-month post-study jobseeker visa work?", a: "Upon graduating from a German university, you receive an 18-month residence permit to find a job matching your qualifications. Once employed, you can transition directly into an EU Blue Card, which offers permanent residence (PR) in just 21 months with B1 German (or 27 months with basic German)." }
  ]
};

// Combine and write file
const output = `/**
 * Dynamic AI-Powered University Discovery Portal
 * Verified dataset: Belgium, Germany (DAAD & uni-assist), and Netherlands
 * Fact-checked fees, statutory exemptions, ECTS requirements & application routes
 */

export const UNIVERSITIES = ${JSON.stringify(enrichedUnis, null, 2)};

export const CATEGORIES_BY_COUNTRY = ${JSON.stringify(categoriesByCountry, null, 2)};

export const CATEGORIES = ${JSON.stringify(defaultCategories, null, 2)};

export const INTAKES = ${JSON.stringify(intakes, null, 2)};

export const REGIONS = ${JSON.stringify(regions, null, 2)};

export const COUNTRIES = ${JSON.stringify(countries, null, 2)};

export const BELGIUM_DOMAINS = ${JSON.stringify(mod.BELGIUM_DOMAINS, null, 2)};

export const GERMANY_DOMAINS = ${JSON.stringify(mod.GERMANY_DOMAINS, null, 2)};

export const BELGIUM_VISA_ROADMAP = ${JSON.stringify(belgiumVisaRoadmap, null, 2)};

export const GERMANY_VISA_ROADMAP = ${JSON.stringify(germanyVisaRoadmap, null, 2)};

export const SAMPLE_QUESTIONS = ${JSON.stringify(mod.SAMPLE_QUESTIONS, null, 2)};
`;

fs.writeFileSync(dataPath, output, 'utf-8');
console.log('Successfully updated js/data.js with intakes, dates, and Germany/Belgium roadmaps!');

