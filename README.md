# 🇧🇪 Belgium CS, AI & Game Design Master's Portal

A modern, responsive web application and academic advisor designed for international (specifically Non-EU / developing country) Computer Science, Software Engineering, and Game Development graduates finding, evaluating, and applying to accredited English-taught Master's programs in Belgium for the **September 2027 intake**.

Hosted seamlessly on **GitHub Pages** with zero backend infrastructure required.

---

## 🚀 Key Features

### 1. 🎯 Three-Tier Application Strategy (<€2,000/year Focus)
- **Tier 1 (Safe & Budget): Wallonia-Brussels ARES Exemption (<€1,500/yr)**
  - Non-EU students from eligible developing countries (e.g., Pakistan on the OECD/DAC list) are assimilated to local EU rates under the Wallonia Higher Education Decree.
  - Pay statutory tuition of **€835 to €1,194/year** at UCLouvain, University of Liège (ULiège), University of Namur (UNamur), and ULB (Brussels), skipping the extra €4,175 international fee.
- **Tier 2 (Full Scholarships): Master Mind & Erasmus Mundus (€0 to €140/yr)**
  - **Flemish Master Mind Scholarship (VLUHR):** €10,225/yr grant + tuition waiver down to ~€139.40/yr across Flemish universities.
  - **Erasmus Mundus (IMLEX & DEAI):** 100% tuition waiver + €1,400/month living stipend + insurance + travel grants.
- **Tier 3 (Flemish Universities Non-EEA): €4,200 – €7,800/year**
  - University of Antwerp, VUB, KU Leuven, and Ghent University.

### 2. 🤖 AI Research Agent (Powered by Groq API)
- **Floating Resizable Window:** Drag by header, resize from bottom-right corner, minimize, or maximize to fullscreen.
- **`#` Mention Autocomplete:** Type `#` anywhere in the chat box to instantly search and tag any Belgian university for focused research.
- **Official Legal Proof & Citations:** Cites official Belgian decrees, ARES circulars, Codex Hoger Onderwijs, and Office des Étrangers Article 60 regulations.
- **General Belgian Visa & Embassy Guidance:** Answers questions on Blocked Accounts, Annex 32 legal guarantors, Gerry's visa submissions, and post-study Search Year rights.
- **BYOK (Bring Your Own Key):** Fast reasoning models supported (`openai/gpt-oss-120b`, fallback to `openai/gpt-oss-20b` or `qwen/qwen3.8-27b`). Enter your free key via ⚙️ Settings (stored locally in browser localStorage only, never exposed or sent to third parties).

### 3. 📑 Dedicated Full University Deep-Dive Pages
- Every university has a dedicated full page (`#/program/:id`) featuring:
  - **Curriculum & Core Modules:** In-depth breakdown of courses (5 ECTS modules, 30 ECTS master thesis).
  - **Admission Criteria & Prerequisites:** ECTS requirements, minimum GPA, English proficiency, and GRE waiver policies.
  - **ECTS Credit Hour Converter:** Explains how 15 semester credit hours in Math/Stats equal ~30 European ECTS.
  - **City & Campus Guide:** Living costs, student housing (kots: €350–€480/mo), transit passes (€12/yr in Brussels), and student work rights.
  - **Direct Actions:** One-click official portal link, Add to plan, and "Ask AI About this University".

### 4. 📐 European Credit (ECTS) Converter
- Solves the common deficiency confusion: Converts Pakistani / US semester credit hours (132 total credits) to European ECTS (1 credit hour ≈ 1.8 to 2.0 ECTS).
- 15 credit hours across Calculus, Linear Algebra, Differential Equations, Discrete Math, and Probability & Statistics equals 30 ECTS, satisfying strict quantitative criteria.

### 5. 💰 Living Cost & Blocked Account Simulator
- Calculates first-year cash outlay: Tuition, statutory living solvency (**€803/month** under Article 60 of Belgian Aliens Act), health insurance (Mutualité), and one-off visa/flights.
- Separates tuition costs from blocked escrow accounts returned to the student monthly.

### 6. 📋 Milestone Application Tracker & Kanban
- Track progress across stages: *Researching*, *Preparing Documents*, *Applied*, *Interview*, *Offer Received*.
- Live milestone checklist and deadline countdown timeline.

### 7. ⚖️ Side-by-Side Comparison Matrix
- Compare up to 4 programs simultaneously across fees, requirements, prerequisites, and deadlines.

### 8. 📥 Comprehensive Markdown & JSON Export
- Generates a full markdown report (`Belgium_CS_GameDesign_Masters_Guide.md`) containing executive summary, comparison tables, program details, and visa checklist.

---

## 📁 Repository Structure

```
Belgium/
├── index.html                   # Main entry point (GitHub Pages ready)
├── belgium_masters_portal.html  # Redirect mirror for legacy bookmarks
├── README.md                    # Project documentation
├── css/
│   ├── base.css                 # Color tokens, themes (dark/light), typography
│   ├── layout.css               # Header, main layout, sticky filter bar, responsive grid
│   ├── components.css           # Cards, buttons, pills, tables, modals, progress bars
│   ├── university-page.css      # Dedicated deep-dive university page styling
│   └── ai-agent.css             # Resizable floating chat window, # mention popover
└── js/
    ├── data.js                  # Fact-checked accredited universities & Belgian domain facts
    ├── fit-engine.js            # Dynamic candidate evaluator & ECTS conversion math
    ├── ai-agent.js              # Groq API client, prompt engineering, mention autocomplete
    ├── views.js                 # Discover, University Page, Compare, Plan, Costs, Guide
    ├── export.js                # Markdown report generator & Blob downloader
    └── app.js                   # State manager, hash router, theme switcher & event delegation
```

---

## 🛠️ How to Deploy on GitHub Pages

1. Ensure your remote origin is set:
   ```bash
   git add .
   git commit -m "Initial commit: Belgium CS & Game Design Master's Portal"
   git push -u origin main
   ```
2. In your GitHub repository (`BelgiumUnisPortal`):
   - Go to **Settings** > **Pages** (under "Code and automation").
   - Under **Build and deployment** > **Source**, select **Deploy from a branch**.
   - Choose `main` branch and `/ (root)` folder.
   - Click **Save**.
3. Your portal will be live at `https://imhassan12.github.io/BelgiumUnisPortal/`!

---

## ⚖️ Fact-Checked Baseline Profile

The portal is designed for any student while setting this intelligent baseline default:
- **Degree:** BS in Computer Science (4 Years, 132 Credit Hours, HEC Attested & recognized)
- **CGPA:** 3.75 / 4.00 (Quality points 495, 81.56%)
- **English Language (IELTS Academic):** Overall 6.5 (Listening: 6.5, Reading: 7.5, Writing: 6.5, Speaking: 6.0)
- **Math / Stats Credits:** 15 Semester Credit Hours (Calculus, Linear Algebra, Differential Equations, Discrete Structures, Probability & Statistics) = ~30 European ECTS
- **Practical Experience:** 5+ years experience, 7 published game titles live on App Store, Google Play, and itch.io (Unity 6, C#, Shaders, Photon Fusion multiplayer, XR)
- **Nationality / Fee Category:** Developing Country list (Wallonia ARES fee exemption eligible)

---

## 📜 Official References & Legal Citations

- **Wallonia-Brussels Federation Higher Education Decree:** Statutory fee assimilation for DAC/OECD list nationals (ARES annual circular).
- **Flemish Higher Education Codex (Codex Hoger Onderwijs):** Deregulated non-EEA tuition schedules & Master Mind regulations (VLUHR).
- **Belgian Immigration Office (Office des Étrangers / Dienst Vreemdelingenzaken):** Student Visa D (Article 60) minimum subsistence living proof (€803/month for 2025/2026/2027).
- **Belgian Embassy Islamabad & Gerry's Visa Dropbox:** Legalization requirements (HEC attestation, MOFA Apostille, medical clearance, police certificate).
