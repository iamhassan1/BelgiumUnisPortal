# Role & Objective
Act as a Senior UI/UX Designer and Frontend Developer. Build a single-file, responsive web application (combining HTML, CSS, and Vanilla JavaScript in one `.html` file) titled **"Belgium CS & Game Design Master's Finder"**. 

The purpose of this tool is to help international (specifically Non-EU / Developing Country) Computer Science & Game Development graduates find, filter, compare, and export Master's programs in Belgium, focusing heavily on programs under €2,000/year and fully-funded scholarships.

---

# CRITICAL UX RULE: NO "OVERDOSE OF TEXT" (Anti-Clutter Mandate)
Previous versions of this site failed because they dumped massive paragraphs onto the main screen. You MUST strictly follow **Progressive Disclosure**:
1. **The Main Grid Cards must be ultra-minimalist (Scannable in 3 seconds):**
   - Each card may ONLY display:
     1. University Name & City (small muted text + region badge: Flanders vs. Wallonia/Brussels).
     2. Program Title (bold, max 2 lines).
     3. **Price Pill** (e.g., `€835 / yr` in green, or `€0 + €1,400/mo Stipend` in purple, or `€4,200 / yr` in amber).
     4. **3 Short Tag Chips max** (e.g., `Game Dev & XR`, `No GRE`, `Under €2k`).
     5. **One-line summary** (Strictly maximum 90 characters—no paragraphs on cards!).
     6. **Two Action Buttons:** `[Quick Details]` (opens modal) and `[Visit Site ↗]` (opens official URL in new tab).
2. **All deep information belongs ONLY inside the `[Quick Details]` Popup Modal and the `.md` Export.**
3. **No Personalization:** Keep the tool 100% generic for any Computer Science / IT / Game Design student. Do not include any specific student names, transcripts, or personal CGPAs.

---

# Visual Design & Layout Specifications
- **Aesthetic:** Clean, modern SaaS directory aesthetic (inspired by Linear, Stripe, or Notion templates).
- **Color Palette:** Light mode by default (clean `#F8FAFC` background, `#FFFFFF` cards with subtle `#E2E8F0` 1px borders, `#0F172A` slate typography, `#2563EB` primary royal blue accents, `#10B981` emerald green for <€2,000 fees). Include a clean Dark Mode toggle if possible.
- **Typography:** Load Google Font `'Inter'` or `'Plus Jakarta Sans'`.
- **Layout Structure:**
  1. **Compact Header Bar:** App logo/title on the left. On the right: a primary button `[📥 Export Filtered List (.MD)]` and a secondary button `[ℹ️ How Belgium Fees Work]`.
  2. **3-Pill Summary Banner (Compact):** 3 small stat boxes in a single row:
     - *Tier 1: Under €2,000/yr* (Wallonia ARES Exemption: €835–€1,194/yr)
     - *Tier 2: Full Scholarships* (Master Mind & Erasmus Mundus)
     - *Tier 3: Standard Non-EU* (€2,700–€8,000/yr)
  3. **Sticky Filter & Search Bar:**
     - **Live Search Input:** Search by university, program name, or keyword.
     - **Category Filter Pills:** `All Programs`, `🔥 Top Priority (<€2k/yr)`, `🎮 Game Design & Graphics`, `💻 Core CS, AI & Data`, `🏆 Full Scholarship Possible`.
     - **Max Tuition Dropdown/Slider:** `Any Budget`, `Under €1,500/yr`, `Under €2,000/yr`, `Under €5,000/yr`.
     - **GRE Toggle:** Checkbox for `Hide programs requiring GRE`.
  4. **3-Column Responsive Card Grid:** Displays the ultra-clean course cards.

---

# Essential Domain Knowledge & Dataset to Embed in JavaScript
Hardcode the following accurate dataset of **12 programs** into a clean JavaScript array (`const programs = [...]`). Every item must contain full metadata for the modal/export, but only show the minimal fields on the card:

### Tier 1: Top Priority — Guaranteed Under €2,000/yr (Wallonia-Brussels ARES Exemption)
*Context for Modal/Export: Non-EU students from eligible developing countries (like Pakistan, etc.) listed in the Wallonia-Brussels ARES Circular are exempt from the €4,175+ international fee and pay the local EU rate of €835 to €1,194/year for 100% English-taught Master's degrees.*

1. **UCLouvain (Louvain-la-Neuve)** — *MSc in Computer Science*
   - **Tuition:** €835 – €1,194 / year | **App Fee:** €200 (deducted from tuition)
   - **Track:** Core CS, AI & Software | **Priority:** Top Priority (<€2k) | **GRE:** Not Required
   - **Prereqs:** Strong BS in CS/IT, Algorithms, OOP, Linear Algebra, Probability, IELTS 6.5.
   - **URL:** `https://uclouvain.be/en-prog-sinfo2m`
2. **UCLouvain (Louvain-la-Neuve)** — *MSc in Data Science (Information Technology)*
   - **Tuition:** €835 – €1,194 / year | **App Fee:** €200
   - **Track:** Core CS, AI & Data | **Priority:** Top Priority (<€2k) | **GRE:** Not Required
   - **Prereqs:** BS in CS/Math, Statistics, Calculus, Programming, Databases.
   - **URL:** `https://uclouvain.be/en-prog-dati2m`
3. **University of Liège (ULiège)** — *MSc in Computer Science (Computer Graphics, Vision & AI)*
   - **Tuition:** €835 / year (with developing country assimilation) | **App Fee:** €0
   - **Track:** Game Design & Graphics / AI | **Priority:** Top Priority (<€2k) | **GRE:** Not Required
   - **Prereqs:** BS in CS, Computer Graphics, Algorithms, C++/Python, Linear Algebra.
   - **URL:** `https://www.programmes.uliege.be/`
4. **University of Namur (UNamur)** — *MSc in Computer Science (Software Engineering & HCI)*
   - **Tuition:** €835 – €1,194 / year | **App Fee:** €150
   - **Track:** Core CS & HCI | **Priority:** Top Priority (<€2k) | **GRE:** Not Required
   - **Prereqs:** BS in CS/SE, Human-Computer Interaction, Software Engineering, Databases.
   - **URL:** `https://www.unamur.be/en/sci/info`
5. **ULB (Université libre de Bruxelles)** — *MSc in Cybersecurity (or Computer Science)*
   - **Tuition:** €835 – €4,175 / year (Reduction available on merit/nationality) | **App Fee:** €200
   - **Track:** Core CS & Security | **Priority:** Top Priority (<€2k) | **GRE:** Not Required
   - **Prereqs:** BS in CS, Information Security, Computer Networks, Operating Systems.
   - **URL:** `https://www.ulb.be/en/programme/ma-secu`

### Tier 2: Game Design, Computer Graphics, XR/VR & Digital Media
6. **Erasmus Mundus IMLEX (KU Leuven + EU Partners)** — *Joint MSc in Imaging & Light in Extended Reality (VR/AR & Game Graphics)*
   - **Tuition:** €0 (Full Scholarship) + €1,400/month stipend | **App Fee:** €0
   - **Track:** Game Design & Graphics | **Priority:** Full Scholarship | **GRE:** Not Required
   - **Prereqs:** BS in CS/IT, Computer Graphics & Animation, Game Dev, C++, Multimedia.
   - **URL:** `https://imlex.org/`
7. **VUB (Vrije Universiteit Brussel)** — *MSc in Applied Sciences & Engineering: Computer Science (Digital Media & AI)*
   - **Tuition:** €4,200 / year (€139.40/yr if nominated for Master Mind Scholarship) | **App Fee:** €0
   - **Track:** Game Design & Graphics / AI | **Priority:** Full Scholarship | **GRE:** Not Required
   - **Prereqs:** BS in CS, Multimedia Systems, HCI, Web/Mobile Dev, AI.
   - **URL:** `https://www.vub.be/en/studying-at-vub/all-study-programmes-at-vub/bachelors-and-masters-programmes-at-vub/applied-sciences-and-engineering-computer-science`
8. **LUCA School of Arts (Genk / KU Leuven Assoc.)** — *Master of Game Design / Audiovisual Arts*
   - **Tuition:** €139.40/yr (with Master Mind) or ~€7,000/yr self-funded | **App Fee:** €75
   - **Track:** Game Design & Graphics | **Priority:** Game Design Focus | **GRE:** Not Required
   - **Prereqs:** Game Development portfolio, 3D Graphics/Animation, Unity/Unreal prototype, Interview.
   - **URL:** `https://www.luca-arts.be/en`
9. **Utrecht University (Netherlands - Nearby Neighbor Benchmark)** — *MSc in Game and Media Technology*
   - **Tuition:** €0 with Utrecht Excellence Scholarship (Otherwise >€20k) | **App Fee:** €100
   - **Track:** Game Design & Graphics | **Priority:** Game Design Focus | **GRE:** Not Required
   - **Prereqs:** BS in CS, Physics Engines, 3D Graphics, AI for Games, Linear Algebra.
   - **URL:** `https://www.uu.nl/en/masters/game-and-media-technology`

### Tier 3: Top-Ranked CS & Full Scholarship Contenders (Master Mind & Erasmus)
10. **ULB Brussels (Erasmus Mundus BDMA)** — *Joint MSc in Big Data Management & Analytics*
    - **Tuition:** €0 (Full Scholarship) + €1,400/month stipend | **App Fee:** €0
    - **Track:** Core CS, AI & Data | **Priority:** Full Scholarship | **GRE:** Not Required
    - **Prereqs:** BS in CS, Databases, Data Structures, Probability & Statistics, CGPA 3.3+.
    - **URL:** `https://bdma.ulb.ac.be/`
11. **Hasselt University (Flanders)** — *MSc in Statistics & Data Science*
    - **Tuition:** €2,699 / year (€139.40/yr with Master Mind Scholarship) | **App Fee:** €0
    - **Track:** Core CS, AI & Data | **Priority:** Budget Flanders | **GRE:** Not Required
    - **Prereqs:** BS in CS/Math, Probability & Statistics, Linear Algebra, Programming.
    - **URL:** `https://www.uhasselt.be/en/study/programmes/master-of-statistics-and-data-science`
12. **University of Antwerp** — *MSc in Computer Science (Software Engineering / Data Science)*
    - **Tuition:** €5,800 / year (€139.40/yr with Master Mind Scholarship) | **App Fee:** €0
    - **Track:** Core CS, AI & Data | **Priority:** Full Scholarship | **GRE:** Not Required
    - **Prereqs:** Research-oriented BS in CS, Algorithms, Distributed Systems, Software Engineering.
    - **URL:** `https://www.uantwerpen.be/en/study/programmes/all-programmes/master-software-engineering/`

---

# Interactive Features Required

### 1. `[Quick Details]` Popup Modal
Clicking `[Quick Details]` on any card opens a clean, centered modal overlay (with backdrop blur and `ESC` / click-outside-to-close) organized into 4 scannable sections:
- **Header:** University, Program Name, Region, and Tuition Badge.
- **Why It's Recommended:** 2–3 bullet points explaining the cost rule (e.g., Wallonia ARES exemption or Master Mind eligibility) and career value.
- **Required CS Background (Prerequisites):** Shown as clean pill badges (e.g., `Data Structures`, `Computer Graphics`, `Linear Algebra`).
- **Application Deadlines & Specs:** Application Fee, Non-EU Deadline (usually Jan 15 for scholarships, Feb/Mar 1 for general admission), IELTS requirement (6.5 overall), and Blocked Account info (~€800–€1,000/month living proof, returned monthly upon arrival).
- **Modal Footer:** `[Visit Official Course Website ↗]` button.

### 2. `[ℹ️ How Belgium Fees Work]` Info Modal
A secondary modal triggered from the header explaining in 4 short bullet points:
1. **Wallonia Exemption (<€2,000/yr):** How developing-country citizens pay €835–€1,194/yr at UCLouvain, UNamur, and ULiège.
2. **Flemish Master Mind Scholarship:** Pays €10,225/yr stipend and drops tuition to €139.40/yr (Requires 3.5+ CGPA & IELTS 7.0).
3. **Erasmus Mundus:** Full tuition waiver + €1,400/month stipend.
4. **Blocked Account vs. Tuition:** Clarifies that the ~€10,000 blocked account is living money returned to the student monthly in Belgium, or waived via an Annex 32 EU sponsor.

### 3. One-Click `.MD` File Export (`[📥 Export Filtered List (.MD)]`)
Clicking the export button must dynamically generate a well-formatted Markdown file (`Belgium_CS_GameDesign_Masters_Guide.md`) and trigger an automatic browser download using `Blob` and `URL.createObjectURL`.
- **What the `.md` file must contain:**
  1. Executive Summary of the <€2,000/yr Wallonia Strategy vs. Full Scholarships.
  2. A Markdown Comparison Table of all currently filtered programs (or all programs if no filter is active).
  3. Detailed breakdown of each program (Tuition, Application Fee, Deadlines, Prerequisites, Direct URL).
  4. Step-by-Step Application & Visa Checklist (IELTS, Course Description Syllabus PDF, Document Legalization, Blocked Account / Annex 32).

---

# Output Format
Provide the complete, self-contained, production-ready code inside a single `.html` code block with zero placeholders or truncated arrays.