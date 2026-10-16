# Probaho Remit — Titan Edition
> **2026 Shenzhen International FinTech Competition (AI DEV FEST 2026)**  
> *International Track · Topic C: AI as a Financial Participant*

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-10b981?style=for-the-badge)](https://fahad3235.github.io/probaho-remit/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 1. Project Overview

### 1.1 The Problem Addressed
International students and cross-border families face severe financial friction:
1. **Exorbitant & Hidden Fees**: Traditional remittance providers bury high margins inside opaque foreign exchange (FX) markups and tiered transfer fees.
2. **Tuition Deadlines & University Compliance**: Overseas students struggle to coordinate multi-year tuition payments with strict university disbursement schedules and fluctuating foreign exchange rates.
3. **Escalating Scams & Fraud**: International students are prime targets for tuition payment scams, fake agency spoofing, and predatory money transfer schemes.
4. **Opaque & Fragmented Transfers**: Lack of real-time explainability leaves remitters uncertain about intermediate bank fees, settlement times, and regulatory compliance requirements.

### 1.2 Proposed Solution
**Probaho Remit (Titan Edition)** is an intelligent, explainable cross-border financial participant platform engineered specifically for international students and their families. It acts as an autonomous financial co-pilot that:
- Optimizes remittance routes across 18+ corridors and 12+ currencies.
- Projects 4-year tuition schedules with predictive currency hedging models.
- Employs an on-device heuristic AI risk scoring engine (**ScamShield**) to protect remitters from tuition and transfer fraud.
- Delivers an explainable, deterministic AI assistant (**Ask Probaho Copilot**) that answers cross-border financial queries without external data leakage.

### 1.3 Purpose of the Project
Built as a competition-grade demonstration for the **2026 Shenzhen International FinTech Competition**, Probaho Remit proves how AI can participate responsibly and safely in cross-border consumer finance with transparent risk controls, strict privacy, and zero hallucinated financial advice.

> **Simulation Disclosure**: Probaho Remit is an educational simulation. Rates, fees, provider comparisons, FX history, AI responses, and risk scores are illustrative synthetic demonstration data. No real funds are moved.

---

## 2. Features & AI Implementation

### 2.1 Complete Screen & Module Catalogue

| # | Screen / Module | Route | Purpose & Key Features |
|---|---|---|---|
| 1 | **Public Landing Page** | `#/home` | Cosmic hero banner, instant remittance calculator ($1,000 USD → 119,480 BDT), partner university badges, live rate previews. |
| 2 | **User Dashboard** | `#/dashboard` | 4 KPI summary cards (Users, Transactions, Volume, Active Users), SVG trend lines, 4-slice distribution donut, and recent transfers ledger. |
| 3 | **Corridor Optimizer** | `#/corridor-optimizer` | 4-step wizard comparing WorldRemit, Wise, Remitly, and Western Union with transparent fee and speed breakdowns. |
| 4 | **Tuition Planner** | `#/tuition-planner` | University degree tuition tracker (e.g. U of Toronto CS), 4-year multi-currency cost projector, funding progress radial meter. |
| 5 | **ScamShield Risk Engine** | `#/scamshield` | 0–100 security score meter, pattern-matching scam text analyzer, safety tips, and live scam alert feeds. |
| 6 | **FX Advisor & Board** | `#/rates` | 7-currency live exchange rate board, 90-day interactive SVG rate trajectory, volatility indicators, and optimal transfer timing hints. |
| 7 | **Payment & Document Vault** | `#/payment-vault` | Encrypted synthetic credential vault (Passport, National ID, Visa, Admission Letter) with mock verification status. |
| 8 | **Ask Probaho Copilot** | `#/ask-probaho` & `#/copilot` | Context-aware AI financial assistant with pre-configured prompts, transfer action triggers, and corridor explanations. |
| 9 | **Notification Center** | `#/notifications` | Filterable notification and payment reminders hub (All, Rates, KYC, Reminders, Security) with badge counters. |
| 10 | **Student Registration** | `#/sign-up` | Self-service student registration with 5-criteria real-time password strength meter and instant dashboard login. |
| 11 | **Student Sign-In** | `#/sign-in` | Clean split-screen authentication with manual credential entry enforcement and rate-limited security protections. |
| 12 | **Dedicated Admin Login** | `#/admin/login` | Air-gapped dark console login for platform administrators with 5-attempt brute-force lockout (15-minute freeze). |
| 13 | **Administrator Console** | `#/admin` | High-security administrative command center for volume tracking, KYC queue triage, and audit trail inspection. |
| 14 | **KYC Verification Queue** | `#/admin/kyc` | Administrative document review workflow with approve/reject actions and risk-tier badge indicators. |
| 15 | **Audit Trail Explorer** | `#/admin/audit` | Tamper-evident administrative action logs tracking actor IDs, timestamps, IP addresses, and state diffs. |
| 16 | **Platform Settings** | `#/admin/settings` | Operational controls for corridor limits, maintenance mode toggles, and notification dispatches. |
| 17 | **Transactions Ledger** | `#/transactions` | Full ledger with multi-column filtering, search, date range picking, and CSV export. |
| 18 | **Analytics Engine** | `#/analytics` | Service volume breakdown, revenue analytics, conversion funnels, and payout method distribution. |
| 19 | **Architecture Blueprint** | `#/architecture` | Interactive system architecture diagrams covering client layers, API design, database schemas, and AI pipelines. |
| 20 | **Design Studio** | `#/design-studio` | Live skin switcher with 4 aesthetic themes: Titan Blue, Obsidian Dark, Emerald Green, and Warm Sand. |

### 2.2 How AI Components Are Implemented
Probaho Remit implements AI across three specialized layers:

1. **On-Device Financial Reasoning Engine (`js/services/local-llm.js`)**:
   - Runs deterministic, client-side semantic inference with zero external API dependencies.
   - Parses intent for transfer queries, tuition advice, and rate explanations without transmitting sensitive student data to third-party cloud LLMs.
   - Generates actionable interactive buttons inside the chat stream (e.g., `[Initiate Transfer to Bangladesh]`, `[Compare Rates]`).

2. **ScamShield Heuristic Risk Engine (`js/risk-engine.js`)**:
   - Analyzes transfer memos, payment requests, and communication patterns for common fraud signatures (e.g., impersonation of visa officials, urgency coercion, unverified bank accounts).
   - Computes an explainable risk score (0–100) with detailed contributing factors and preventative guidance.

3. **Predictive FX & Volatility Engine (`js/fx-engine.js`)**:
   - Uses deterministic pseudo-random market walks (mulberry32 algorithm) to model real-world FX volatility across 18 corridors.
   - Calculates 7-day volatility bands, spread efficiency ratings, and recommended conversion timing.

---

## 3. Technology Stack

- **Core & Runtime**: HTML5, Vanilla JavaScript (ES6+), CSS3 with CSS Custom Properties (Design Tokens).
- **Styling & Design System**: Custom Vanilla CSS Design System with responsive grid layouts, glassmorphism accents, luxury UI skins, and accessibility compliance.
- **Data Persistence**: In-memory deterministic mock state + browser `localStorage` and `sessionStorage` fallback layers.
- **AI & Analytics**: Custom on-device Natural Language heuristic intent parser, statistical FX simulator, SVG chart vector engine.
- **Security & RBAC**: Air-gapped role separation, client-side PBKDF2/SHA-256 simulation, brute-force rate limiter, CSP/X-Frame-Options/X-Content-Type headers.
- **Hosting & Deployment**: Static hosting (GitHub Pages). No backend, no build step.

---

## 4. Requirements & Prerequisites

To run or develop the project locally:
- **Web Browser**: Any modern browser (Google Chrome 110+, Microsoft Edge 110+, Mozilla Firefox 110+, Safari 16+).
- **Disk Space**: ~10 MB for source code and dependencies.
- **Network**: All core functionality runs 100% offline (demo data is bundled).

---

## 5. Installation and Setup

### 5.1 Clone the Repository
```bash
git clone https://github.com/fahad3235/probaho-remit.git
cd probaho-remit
```

### 5.2 Install Dependencies
None. No dependencies, no environment files, no build step — open `index.html` in a browser or serve the folder from any static host.

---

## 7. Run

Probaho Remit is a zero-dependency client-side SPA. Open `index.html` directly in any modern browser, or serve the folder from any static host:

```bash
python3 -m http.server 8000
```

Live demo: https://fahad3235.github.io/probaho-remit/

---

## 8. Live Deployment

Judges and evaluators can access the live application directly:

- 🚀 **Live Demo**: [https://fahad3235.github.io/probaho-remit/](https://fahad3235.github.io/probaho-remit/)

---

## 9. Testing Instructions & Feature Verification

### 9.1 Automated Test Suites
No automated suite ships in this repo. Verification is manual via §9.2 below: walk the sign-in, registration, admin console, corridor optimizer, tuition planner, ScamShield, vault, and copilot flows in the live demo and confirm zero console errors.

### 9.2 Interactive Manual Testing Guide

#### A. Student Portal Manual Sign-In
1. Navigate to: `#/sign-in`
2. Enter the student credentials manually:
   - **Email**: `ishan@probaho.demo`
   - **Password**: `demo1234`
3. Click **Sign In**.
4. Verify redirection to `#/dashboard` and confirm that the floating **AI Copilot** widget becomes visible at the bottom right.

#### B. Open Student Registration
1. Navigate to: `#/sign-up`
2. Enter any valid name, student email, and password.
3. Observe the dynamic 5-point password strength meter.
4. Click **Create Student Account**.
5. Verify instant account creation and automatic login into the dashboard.

#### C. Dedicated High-Security Admin Portal
1. Navigate to: `#/admin/login`
2. Verify the dark-themed high-security interface with the **"AIR-GAPPED SECURITY GATE"** banner.
3. Attempt to enter student credentials (`ishan@probaho.demo`). Notice the explicit security denial.
4. Enter authorized administrator credentials:
   - **Email**: `owner@probaho.demo`
   - **Password**: `demo1234`
5. Click **Authorize & Access Portal**.
6. Verify redirection to the protected administrator overview at `#/admin`.

#### D. Notification & Alerts Hub
1. Click the **🔔 Alerts** button in the top navigation bar or navigate to `#/notifications`.
2. Verify the multi-tab interface (All, Rates, KYC, Reminders, Security).
3. Switch categories and test marking alerts as read.

---

## 10. Other Configuration & Credentials

### 10.1 Pre-Configured Demo Credentials

| Portal | URL Route | Demo Email | Demo Password | Role & Permissions |
|---|---|---|---|---|
| **Student Portal** | `#/sign-in` | `ishan@probaho.demo` | `demo1234` | Verified Student; full access to transfers, tuition planner, scamshield, and AI copilot. |
| **Open Student Sign Up** | `#/sign-up` | *(User choice)* | *(User choice)* | Newly created student accounts. |
| **Admin Console** | `#/admin/login` | `owner@probaho.demo` | `demo1234` | Platform Owner / Auditor; full access to KYC queue, audit trails, and corridor controls. |

### 10.2 Security & Air-Gap Configuration
- **Credential Storage**: Passwords are validated using client-side salted SHA-256 hashes in demo mode.
- **Brute-Force Lockout**: 5 failed consecutive attempts trigger an automatic 15-minute lock. A *"Reset Demo Lock"* button is available in demo mode for evaluators.
- **Robots Directives**: Administrative views dynamically inject `<meta name="robots" content="noindex, nofollow, noarchive">` to prevent search engine indexing.

---

## 11. Team & Hackathon Submission Metadata

- **Competition**: 2026 Shenzhen International FinTech Competition (AI DEV FEST 2026)
- **Track**: International Track
- **Topic**: Topic C — *AI as a Financial Participant*
- **Team**: Probaho FinTech Team
- **Repository**: [https://github.com/fahad3235/probaho-remit](https://github.com/fahad3235/probaho-remit)
