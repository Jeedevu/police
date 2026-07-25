/**
 * Karnataka State Police — Executive Intelligence Dossier PDF Generator
 * Professional Government-Grade Multi-Page Classified Report Engine
 * Generates A4 Executive Reports with Palantir Gotham / Interpol Design Language
 */
import { jsPDF } from "jspdf";

// ── COLOR PALETTE ─────────────────────────────────────────────────────────────
const NAVY = [15, 23, 42];        // #0F172A Header / Cover / Primary
const POLICE_BLUE = [37, 99, 235]; // #2563EB Accent / Banners / Lines
const CYAN = [6, 182, 212];       // #06B6D4 Highlight / Secondary
const SLATE_BG = [248, 250, 252];  // #F8FAFC Card backgrounds
const CARD_BORDER = [226, 232, 240];// #E2E8F0 Table / Card borders
const TEXT_DARK = [15, 23, 42];    // #0F172A Primary text
const TEXT_MUTED = [100, 116, 139];// #64748B Secondary text
const RED_ALERT = [225, 29, 72];   // #E11D48 Critical / Wanted
const EMERALD = [16, 185, 129];    // #10B981 Solved / Match / Low Risk
const AMBER = [245, 158, 11];      // #F59E0B Medium Risk / Warning

// ── UTILITY HELPERS ──────────────────────────────────────────────────────────

function drawHeader(doc, pageNum, totalPages, reportId = "KSP-INT-2026-8801-X9") {
  if (pageNum === 1) return; // Skip cover page header

  const pw = doc.internal.pageSize.getWidth();

  // Top Navy Bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pw, 14, "F");

  // Accent line
  doc.setFillColor(...POLICE_BLUE);
  doc.rect(0, 14, pw, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("KARNATAKA STATE POLICE • CRIME INTELLIGENCE DOSSIER", 14, 9.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(`CONFIDENTIAL // POLICE USE ONLY | REF: ${reportId}`, pw - 14, 9.5, { align: "right" });

  // Watermark text in background
  doc.setFont("helvetica", "bold");
  doc.setFontSize(54);
  doc.setTextColor(241, 245, 249);
  doc.text("CONFIDENTIAL", pw / 2, 160, { align: "center", angle: 45 });
}

function drawFooter(doc, pageNum, totalPages, reportId = "KSP-INT-2026-8801-X9") {
  if (pageNum === 1) return; // Custom cover footer

  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const fy = ph - 14;

  // Bottom Line
  doc.setDrawColor(...CARD_BORDER);
  doc.setLineWidth(0.5);
  doc.line(14, fy - 4, pw - 14, fy - 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("CONFIDENTIAL • POLICEAssist AI INTELLIGENCE MATRIX v4.2", 14, fy);

  doc.setFont("helvetica", "bold");
  doc.text(`Page ${pageNum} of ${totalPages}`, pw / 2, fy, { align: "center" });

  doc.setFont("helvetica", "mono");
  doc.text(`SHA-256: 8F92A...4B12 | QR VERIFIED`, pw - 14, fy, { align: "right" });
}

function addSectionTitle(doc, y, title, iconStr = "■") {
  const pw = doc.internal.pageSize.getWidth();
  
  // Section banner fill
  doc.setFillColor(...NAVY);
  doc.roundedRect(14, y, pw - 28, 8, 1.5, 1.5, "F");

  // Accent bar left
  doc.setFillColor(...POLICE_BLUE);
  doc.rect(14, y, 3, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`${iconStr}  ${title.toUpperCase()}`, 20, y + 5.5);

  return y + 12;
}

function drawBadge(doc, x, y, text, bgColor, textColor = [255, 255, 255]) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  const textWidth = doc.getTextWidth(text) + 6;

  doc.setFillColor(...bgColor);
  doc.roundedRect(x, y - 4.5, textWidth, 6, 1, 1, "F");

  doc.setTextColor(...textColor);
  doc.text(text, x + 3, y);

  return x + textWidth + 4;
}

function drawCard(doc, x, y, w, h, title = "", bg = SLATE_BG) {
  doc.setFillColor(...bg);
  doc.setDrawColor(...CARD_BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");

  if (title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...POLICE_BLUE);
    doc.text(title.toUpperCase(), x + 4, y + 6);
    doc.setDrawColor(...CARD_BORDER);
    doc.line(x + 4, y + 8, x + w - 4, y + 8);
  }
}

// ── MAIN DOSSIER GENERATOR FUNCTION ──────────────────────────────────────────

export function generateExecutiveIntelligenceDossier(data = {}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth(); // 210
  const ph = doc.internal.pageSize.getHeight(); // 297

  const criminal = data.criminal || {
    criminal_id: "CRM-2026-8801",
    name: "Vikram 'Bhai' Gowda",
    alias: "Vicky / Black Cobra",
    age: 38,
    dob: "1988-04-14",
    height: "5'11\" (180 cm)",
    weight: "82 kg",
    blood_group: "B+",
    identification_marks: "Cobra tattoo on right forearm, scar below left eye",
    district: "Bengaluru City",
    police_station: "Cubbon Park PS",
    wanted_status: "WANTED - INTERPOL RED CORNER",
    threat_level: "CRITICAL",
    risk_score: 96,
    last_seen: "Majestic Bus Terminus, Bengaluru • 2026-07-22 21:45 IST",
    address: "No. 42, 1st Cross, Kalasipalya, Bengaluru City, Karnataka",
    crime_types: ["Armed Robbery", "Extortion", "Contract Assault", "Illegal Firearms"],
    firs: [
      { fir_number: "FIR-2024-8821", crime: "Armed Dacoity & Robbery", police_station: "Cubbon Park PS", date: "2024-11-12", status: "Under Investigation", officer: "Insp. Jeevan Kumar" },
      { fir_number: "FIR-2023-4102", crime: "Extortion & Criminal Intimidation", police_station: "Kalasipalya PS", date: "2023-08-04", status: "Chargesheet Filed", officer: "Insp. R. Seshadri" },
      { fir_number: "FIR-2021-1904", crime: "Possession of Illegal Arms (Arms Act)", police_station: "Upparpet PS", date: "2021-03-19", status: "Bail Jumped", officer: "Sub-Insp. M. Nagesh" }
    ],
    arrest_history: [
      { year: "2019", event: "Arrested in Commercial Street Gold Shop Robbery Case", badge: "ARRESTED" },
      { year: "2020", event: "Released on conditional bail by Session Court", badge: "BAIL" },
      { year: "2021", event: "Implicated in Illegal Firearms Trafficking Racket", badge: "CHARGED" },
      { year: "2023", event: "Absconded during trial hearing; NBW issued", badge: "WARRANT" },
      { year: "2024", event: "Declared Proclaimed Offender by High Court", badge: "PROCLAIMED" },
      { year: "2026", event: "Matched via Live AI Facial Intelligence Stream", badge: "MATCHED" }
    ],
    associates: [
      { name: "Syed 'Blade' Tanveer", relation: "Primary Enforcer / Hitman", crimes: "Assault, Extortion" },
      { name: "Ramesh 'Don' Naik", relation: "Hawala Operator & Financier", crimes: "Money Laundering, Fraud" },
      { name: "Kiran 'Phantom' Das", relation: "Safehouse Supplier & Logistics", crimes: "Sheltering Fugitives" }
    ],
    vehicles: [
      { model: "Mahindra Thar 4x4 (Black)", reg_no: "KA-01-MJ-9901", color: "Midnight Black", type: "SUV" },
      { model: "KTM Duke 390 (Modified)", reg_no: "KA-04-EV-4412", color: "Orange / Black", type: "Motorcycle" }
    ],
    weapons: [
      { type: "Country-made 7.65mm Pistol", caliber: "7.65mm", status: "Active / Unrecovered" },
      { type: "Machete / Tactical Blade", caliber: "N/A", status: "Seized in 2021" }
    ],
    evidence_files: [
      { type: "CCTV", title: "CCTV Footage — MG Road ATM Heist", date: "2026-07-15", size: "42.8 MB" },
      { type: "VIDEO", title: "Traffic Cam Video Dump — Silk Board", date: "2026-07-20", size: "128.4 MB" },
      { type: "PDF", title: "Certified FIR Copy #8821", date: "2024-11-12", size: "3.1 MB" },
      { type: "PHOTO", title: "Seized 7.65mm Pistol Forensic Snap", date: "2021-03-20", size: "14.2 MB" },
      { type: "PHOTO", title: "Confiscated Mahindra Thar Inspection Photo", date: "2023-09-10", size: "8.7 MB" },
      { type: "DUMP", title: "UFED Cellebrite Phone Call Logs Dump", date: "2026-07-02", size: "890.0 MB" }
    ]
  };

  const reportId = `KSP-INT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-X9`;
  const generatedTime = new Date().toLocaleString() + " IST";

  // =========================================================================
  // PAGE 1: COVER PAGE
  // =========================================================================

  // Full Cover Background Top Half
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pw, 130, "F");

  // Accent Line
  doc.setFillColor(...POLICE_BLUE);
  doc.rect(0, 130, pw, 4, "F");

  // State Police Emblem Circle Badge
  doc.setFillColor(30, 41, 59);
  doc.setDrawColor(...POLICE_BLUE);
  doc.setLineWidth(1.5);
  doc.circle(pw / 2, 45, 22, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("KSP", pw / 2, 43, { align: "center" });

  doc.setFontSize(7);
  doc.setTextColor(...CYAN);
  doc.text("POLICEAssist AI", pw / 2, 51, { align: "center" });

  // Main Cover Titles
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("KARNATAKA STATE POLICE", pw / 2, 80, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(148, 163, 184);
  doc.text("CRIME INTELLIGENCE & BIOMETRIC DOSSIER", pw / 2, 90, { align: "center" });

  // Classification Pill
  doc.setFillColor(...RED_ALERT);
  doc.roundedRect(pw / 2 - 35, 102, 70, 9, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("CLASSIFIED // RESTRICTED ACCESS", pw / 2, 107.5, { align: "center" });

  // Lower Section Details Box
  let cy = 150;

  // Metadata Card
  drawCard(doc, 20, cy, pw - 40, 105, "DOCUMENT METADATA CONTROL", SLATE_BG);

  let my = cy + 16;
  const metaItem = (label, val) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(label.toUpperCase(), 28, my);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text(String(val), 90, my);
    my += 8.5;
  };

  metaItem("Subject Target Name", criminal.name);
  metaItem("Alias / Street Name", criminal.alias);
  metaItem("Criminal Identification ID", criminal.criminal_id);
  metaItem("Wanted Status Level", criminal.wanted_status);
  metaItem("Threat & Risk Score", `${criminal.threat_level} (${criminal.risk_score} / 100)`);
  metaItem("Jurisdiction Unit", `${criminal.district} (${criminal.police_station})`);
  metaItem("Document Control ID", reportId);
  metaItem("Generated Timestamp", generatedTime);
  metaItem("Investigating Officer", "Insp. Jeevan Kumar (Badge KSP-8821)");
  metaItem("Digital Hash Standard", "SHA-256 Encrypted Matrix v4.2");

  // Cover Footer
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("CONFIDENTIAL • POLICE USE ONLY • UNAUTHORIZED DISTRIBUTION IS PUNISHABLE BY LAW", pw / 2, ph - 15, { align: "center" });

  // =========================================================================
  // PAGE 2: EXECUTIVE SUMMARY & TABLE OF CONTENTS
  // =========================================================================
  doc.addPage();
  let y = 22;

  y = addSectionTitle(doc, y, "Executive Summary & Risk Assessment", "1");

  // Risk Score KPI Grid Row
  drawCard(doc, 14, y, 42, 28, "", SLATE_BG);
  doc.setFontSize(7); doc.setTextColor(...TEXT_MUTED); doc.text("OVERALL RISK", 18, y + 6);
  doc.setFontSize(16); doc.setTextColor(...RED_ALERT); doc.text(`${criminal.risk_score}/100`, 18, y + 16);
  doc.setFontSize(7); doc.setTextColor(...RED_ALERT); doc.text("CRITICAL RATING", 18, y + 23);

  drawCard(doc, 60, y, 42, 28, "", SLATE_BG);
  doc.setFontSize(7); doc.setTextColor(...TEXT_MUTED); doc.text("THREAT LEVEL", 64, y + 6);
  doc.setFontSize(13); doc.setTextColor(...RED_ALERT); doc.text(criminal.threat_level, 64, y + 16);
  doc.setFontSize(7); doc.setTextColor(...TEXT_MUTED); doc.text("INTERPOL NOTICE", 64, y + 23);

  drawCard(doc, 106, y, 42, 28, "", SLATE_BG);
  doc.setFontSize(7); doc.setTextColor(...TEXT_MUTED); doc.text("AI CONFIDENCE", 110, y + 6);
  doc.setFontSize(16); doc.setTextColor(...EMERALD); doc.text("96.8%", 110, y + 16);
  doc.setFontSize(7); doc.setTextColor(...EMERALD); doc.text("512-D VECTOR MATCH", 110, y + 23);

  drawCard(doc, 152, y, 44, 28, "", SLATE_BG);
  doc.setFontSize(7); doc.setTextColor(...TEXT_MUTED); doc.text("OPEN CASES", 156, y + 6);
  doc.setFontSize(16); doc.setTextColor(...POLICE_BLUE); doc.text(`${criminal.firs?.length || 3}`, 156, y + 16);
  doc.setFontSize(7); doc.setTextColor(...TEXT_MUTED); doc.text("ACTIVE FIR FILES", 156, y + 23);

  y += 34;

  // Executive Overview Paragraph Box
  drawCard(doc, 14, y, pw - 28, 38, "AI STRATEGIC INTELLIGENCE SUMMARY", SLATE_BG);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  const execSummaryText = `${criminal.name} (${criminal.alias}) is identified as a high-priority syndicate operative operating primarily across ${criminal.district}. Biometric facial recognition cross-checks confirm a 96.8% match confidence against Interpol and KSP master offender databases. The subject is currently implicated in ${criminal.firs?.length || 3} active FIR proceedings including ${criminal.crime_types?.join(", ")}. Immediate tactical deployment and cell tower surveillance are recommended.`;
  const splitExec = doc.splitTextToSize(execSummaryText, pw - 38);
  doc.text(splitExec, 18, y + 14);

  y += 44;

  // Table of Contents Section
  y = addSectionTitle(doc, y, "Table of Contents", "2");

  drawCard(doc, 14, y, pw - 28, 85, "", SLATE_BG);

  const tocItems = [
    { num: "01", title: "Executive Summary & Risk Assessment", page: "Page 2" },
    { num: "02", title: "Criminal Profile & Personal Identifiers", page: "Page 3" },
    { num: "03", title: "Risk Assessment & Facial Recognition Comparison", page: "Page 4" },
    { num: "04", title: "Criminal Timeline & Offender History", page: "Page 5" },
    { num: "05", title: "Registered FIR Case Dossiers", page: "Page 6" },
    { num: "06", title: "Crime Analytics & Regional Distribution", page: "Page 7" },
    { num: "07", title: "Known Associates & Syndicate Network", page: "Page 8" },
    { num: "08", title: "Evidence Vault & Location Intelligence", page: "Page 9" },
    { num: "09", title: "Predictive AI Intelligence & Tactical Checklist", page: "Page 10" },
    { num: "10", title: "Final Authorization & Verification Seal", page: "Page 10" }
  ];

  let ty = y + 8;
  tocItems.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...POLICE_BLUE);
    doc.text(item.num, 20, ty);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text(item.title, 32, ty);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_MUTED);
    doc.text(". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .", 100, ty);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...POLICE_BLUE);
    doc.text(item.page, pw - 22, ty, { align: "right" });

    ty += 7.5;
  });

  // Demo Disclaimer Notice on Page 2
  y += 92;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(14, y, pw - 28, 14, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text("⚠️ DEMO MODE NOTICE:", 18, y + 5.5);
  doc.setFont("helvetica", "normal");
  doc.text("This intelligence dossier is generated for demonstration purposes. Full live biometric model integration will be finalized in the refined prototype phase.", 18, y + 10);

  // =========================================================================
  // PAGE 3: CRIMINAL PROFILE & PERSONAL DETAILS
  // =========================================================================
  doc.addPage();
  y = 22;

  y = addSectionTitle(doc, y, "Criminal Profile & Personal Details", "3");

  // Mugshot Frame Left + Personal Details Right
  drawCard(doc, 14, y, 48, 62, "SUSPECT MUGSHOT", SLATE_BG);
  
  // Mugshot Placeholder Graphics
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(18, y + 12, 40, 44, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text("👤", 38, y + 38, { align: "center" });

  doc.setFillColor(...RED_ALERT);
  doc.roundedRect(18, y + 48, 40, 6, 1, 1, "F");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("WANTED SUBJECT", 38, y + 52.5, { align: "center" });

  // Details Table Right
  drawCard(doc, 66, y, pw - 80, 62, "PERSONAL ATTRIBUTES MATRIX", SLATE_BG);

  let py = y + 14;
  const detailRow = (l1, v1, l2, v2) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...TEXT_MUTED);
    doc.text(l1.toUpperCase(), 70, py);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
    doc.text(String(v1), 102, py);

    if (l2) {
      doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_MUTED);
      doc.text(l2.toUpperCase(), 138, py);
      doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
      doc.text(String(v2), 168, py);
    }
    py += 6.5;
  };

  detailRow("Full Name", criminal.name, "Alias", criminal.alias);
  detailRow("Age / DOB", `${criminal.age} Yrs (${criminal.dob})`, "Gender", "Male");
  detailRow("Height / Weight", `${criminal.height} / ${criminal.weight}`, "Blood Group", criminal.blood_group);
  detailRow("District Unit", criminal.district, "Police Station", criminal.police_station);
  detailRow("Wanted Status", criminal.wanted_status, "Threat Rating", criminal.threat_level);
  detailRow("Languages", "Kannada, Hindi, English", "Occupation", "Unemployed / Offender");

  y += 68;

  // Identification Marks & Address Box
  drawCard(doc, 14, y, pw - 28, 30, "PHYSICAL IDENTIFIERS & LOGISTICS", SLATE_BG);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...TEXT_MUTED);
  doc.text("IDENTIFICATION MARKS & TATTOOS:", 18, y + 12);
  doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
  doc.text(criminal.identification_marks, 70, y + 12);

  doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_MUTED);
  doc.text("REGISTERED PERMANENT ADDRESS:", 18, y + 20);
  doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
  doc.text(criminal.address, 70, y + 20);

  y += 36;

  // Vehicles & Weapons Grid
  y = addSectionTitle(doc, y, "Associated Vehicles & Registered Weapons", "4");

  drawCard(doc, 14, y, (pw - 34) / 2, 45, "VEHICLES TAGGED", SLATE_BG);
  let vy = y + 14;
  criminal.vehicles?.forEach((v) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...POLICE_BLUE);
    doc.text(`• ${v.model}`, 18, vy);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...TEXT_DARK);
    doc.text(`  Reg: ${v.reg_no} | Color: ${v.color}`, 18, vy + 4.5);
    vy += 10;
  });

  drawCard(doc, 14 + (pw - 34) / 2 + 6, y, (pw - 34) / 2, 45, "WEAPONS RECORDED", SLATE_BG);
  let wy = y + 14;
  criminal.weapons?.forEach((w) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...RED_ALERT);
    doc.text(`• ${w.type}`, 14 + (pw - 34) / 2 + 10, wy);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...TEXT_DARK);
    doc.text(`  Caliber: ${w.caliber} | Status: ${w.status}`, 14 + (pw - 34) / 2 + 10, wy + 4.5);
    wy += 10;
  });

  // =========================================================================
  // PAGE 4: FACIAL RECOGNITION COMPARISON
  // =========================================================================
  doc.addPage();
  y = 22;

  y = addSectionTitle(doc, y, "Facial Recognition AI Comparison Matrix", "5");

  // Comparison Cards Row
  const boxW = (pw - 40) / 2;
  drawCard(doc, 14, y, boxW, 70, "SUSPECT UPLOAD FRAME", SLATE_BG);
  doc.setFillColor(30, 41, 59); doc.roundedRect(18, y + 12, boxW - 8, 50, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.setTextColor(255, 255, 255);
  doc.text("📷", 14 + boxW / 2, y + 42, { align: "center" });

  drawCard(doc, 14 + boxW + 12, y, boxW, 70, "DATABASE MATCHED MUGSHOT", SLATE_BG);
  doc.setFillColor(30, 41, 59); doc.roundedRect(18 + boxW + 12, y + 12, boxW - 8, 50, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.setTextColor(255, 255, 255);
  doc.text("👤", 14 + boxW + 12 + boxW / 2, y + 42, { align: "center" });

  y += 76;

  // Match Vector Score Specs
  drawCard(doc, 14, y, pw - 28, 48, "512-D EMBEDDING BIOMETRIC METRICS", SLATE_BG);
  let fx = 18;
  const fMetric = (label, val, col = TEXT_DARK) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...TEXT_MUTED);
    doc.text(label.toUpperCase(), fx, y + 14);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...col);
    doc.text(String(val), fx, y + 23);
    fx += 45;
  };

  fMetric("Match Confidence", "96.8%", EMERALD);
  fMetric("Vector Distance", "0.142 L2", POLICE_BLUE);
  fMetric("Landmark Nodes", "68 Points", TEXT_DARK);
  fMetric("Database Index", "3.8M Mugshots", TEXT_DARK);

  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...TEXT_DARK);
  doc.text("AI Neural Match Notes: Facial geometry alignment confirmed across eye distance, nasal bridge curvature, and jawline contours. Match score exceeds criminal identification threshold (90.0%).", 18, y + 36);

  y += 54;

  // =========================================================================
  // PAGE 5: CRIMINAL TIMELINE & REGISTERED FIR CASES
  // =========================================================================
  doc.addPage();
  y = 22;

  y = addSectionTitle(doc, y, "Chronological Criminal Timeline", "6");

  drawCard(doc, 14, y, pw - 28, 70, "", SLATE_BG);
  let tmy = y + 10;
  criminal.arrest_history?.forEach((item) => {
    doc.setFillColor(...POLICE_BLUE); doc.circle(22, tmy - 1, 2.5, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(...POLICE_BLUE);
    doc.text(item.year, 28, tmy);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...TEXT_DARK);
    doc.text(item.event, 45, tmy);
    drawBadge(doc, pw - 42, tmy, item.badge, NAVY);
    tmy += 10;
  });

  y += 76;

  y = addSectionTitle(doc, y, "Registered FIR Case Dossiers", "7");

  // FIR Table Headers
  doc.setFillColor(...NAVY);
  doc.rect(14, y, pw - 28, 7, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255);
  doc.text("FIR NUMBER", 18, y + 5);
  doc.text("CRIME HEAD", 50, y + 5);
  doc.text("POLICE STATION", 100, y + 5);
  doc.text("DATE", 145, y + 5);
  doc.text("STATUS", 175, y + 5);

  y += 7;
  criminal.firs?.forEach((fir, idx) => {
    doc.setFillColor(...(idx % 2 === 0 ? SLATE_BG : [255, 255, 255]));
    doc.rect(14, y, pw - 28, 8, "F");
    doc.setDrawColor(...CARD_BORDER); doc.line(14, y + 8, pw - 14, y + 8);

    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...POLICE_BLUE);
    doc.text(fir.fir_number, 18, y + 5.5);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_DARK);
    doc.text(fir.crime, 50, y + 5.5);
    doc.text(fir.police_station, 100, y + 5.5);
    doc.text(fir.date, 145, y + 5.5);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...AMBER);
    doc.text(fir.status, 175, y + 5.5);

    y += 8;
  });

  // =========================================================================
  // PAGE 6: KNOWN ASSOCIATES & EVIDENCE VAULT
  // =========================================================================
  doc.addPage();
  y = 22;

  y = addSectionTitle(doc, y, "Known Criminal Associates Network", "8");

  drawCard(doc, 14, y, pw - 28, 55, "", SLATE_BG);
  let ay = y + 10;
  criminal.associates?.forEach((assoc) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...TEXT_DARK);
    doc.text(`• ${assoc.name}`, 20, ay);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...POLICE_BLUE);
    doc.text(`  Role: ${assoc.relation}`, 70, ay);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MUTED);
    doc.text(`  Known Crimes: ${assoc.crimes}`, 130, ay);
    ay += 14;
  });

  y += 62;

  y = addSectionTitle(doc, y, "Catalyst File Store Evidence Vault", "9");

  doc.setFillColor(...NAVY);
  doc.rect(14, y, pw - 28, 7, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255);
  doc.text("TYPE", 18, y + 5);
  doc.text("EVIDENCE ARTIFACT TITLE", 40, y + 5);
  doc.text("DATE RECORDED", 130, y + 5);
  doc.text("FILE SIZE", 168, y + 5);

  y += 7;
  criminal.evidence_files?.forEach((ev, idx) => {
    doc.setFillColor(...(idx % 2 === 0 ? SLATE_BG : [255, 255, 255]));
    doc.rect(14, y, pw - 28, 8, "F");
    doc.setDrawColor(...CARD_BORDER); doc.line(14, y + 8, pw - 14, y + 8);

    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...CYAN);
    doc.text(ev.type, 18, y + 5.5);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...TEXT_DARK);
    doc.text(ev.title, 40, y + 5.5);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MUTED);
    doc.text(ev.date, 130, y + 5.5);
    doc.text(ev.size, 168, y + 5.5);

    y += 8;
  });

  // =========================================================================
  // PAGE 7: PREDICTIVE AI INTELLIGENCE & RECOMMENDED ACTIONS
  // =========================================================================
  doc.addPage();
  y = 22;

  y = addSectionTitle(doc, y, "Predictive AI Intelligence & Risk Forecast", "10");

  drawCard(doc, 14, y, pw - 28, 48, "AI RECURRENCE & LOCATION PREDICTIONS", SLATE_BG);
  let px = 18;
  const pItem = (lbl, val) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...TEXT_MUTED);
    doc.text(lbl.toUpperCase(), px, y + 14);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...TEXT_DARK);
    doc.text(val, px, y + 23);
    px += 44;
  };

  pItem("Likely Next Crime", "Armed Dacoity");
  pItem("Probability Score", "88.4%");
  pItem("Likely District", criminal.district);
  pItem("Time Window", "22:00 - 04:00 IST");

  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...TEXT_DARK);
  doc.text("Predictive Strategy: High probability of syndicate operations near transport hubs and commercial safehouses. Enhanced night patrol grid recommended.", 18, y + 36);

  y += 54;

  y = addSectionTitle(doc, y, "Recommended Tactical Actions Checklist", "11");

  drawCard(doc, 14, y, pw - 28, 60, "", SLATE_BG);
  const checklist = [
    "Verify Suspect Biometric Identity via 512-D Vector Engine",
    "Alert District HQ & State Police Control Rooms",
    "Issue Immediate Statewide Lookout Circular (LOC)",
    "Deploy Special Tactical Unit (STU) to Last Known GPS Grid",
    "Intercept & Monitor Associate Cell Communications",
    "Freeze Known Syndicate Bank Accounts & Crypto Wallets",
    "Execute Non-Bailable Arrest Warrant (NBW)"
  ];

  let chkY = y + 10;
  checklist.forEach((item) => {
    doc.setDrawColor(...POLICE_BLUE); doc.rect(20, chkY - 3.5, 4, 4, "S");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...POLICE_BLUE);
    doc.text("✓", 20.8, chkY);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(...TEXT_DARK);
    doc.text(item, 28, chkY);
    chkY += 7.5;
  });

  // =========================================================================
  // PAGE 8: FINAL AUTHORIZATION & VERIFICATION SEAL
  // =========================================================================
  doc.addPage();
  y = 22;

  y = addSectionTitle(doc, y, "Final Authorization & Verification Seal", "12");

  drawCard(doc, 14, y, pw - 28, 120, "", SLATE_BG);

  // Gold / Blue Official Seal Graphic
  doc.setFillColor(...NAVY);
  doc.circle(pw / 2, y + 30, 18, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(255, 255, 255);
  doc.text("KSP SEAL", pw / 2, y + 31, { align: "center" });

  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...TEXT_DARK);
  doc.text("OFFICIAL POLICE INTELLIGENCE CERTIFICATION", pw / 2, y + 55, { align: "center" });

  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...TEXT_MUTED);
  doc.text("This intelligence dossier has been generated via PoliceAssist AI Biometric Matrix. All biometric matches, criminal profiles, and evidence files have been validated against Karnataka State Police master archives.", pw / 2, y + 63, { align: "center", maxWidth: 150 });

  // Signature Block
  let sigY = y + 82;
  doc.line(24, sigY, 74, sigY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...TEXT_DARK);
  doc.text("INSPECTING OFFICER", 49, sigY + 5, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...TEXT_MUTED);
  doc.text("Insp. Jeevan Kumar (KSP-8821)", 49, sigY + 9, { align: "center" });

  doc.line(pw - 74, sigY, pw - 24, sigY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...TEXT_DARK);
  doc.text("SUPERINTENDENT OF POLICE", pw - 49, sigY + 5, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...TEXT_MUTED);
  doc.text("SP Intelligence Headquarters", pw - 49, sigY + 9, { align: "center" });

  y += 130;

  // End of Report Banner
  doc.setFillColor(...NAVY);
  doc.roundedRect(14, y, pw - 28, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(255, 255, 255);
  doc.text("*** END OF CONFIDENTIAL INTELLIGENCE REPORT ***", pw / 2, y + 6.5, { align: "center" });

  // Add Headers & Footers across all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawHeader(doc, i, totalPages, reportId);
    drawFooter(doc, i, totalPages, reportId);
  }

  // Trigger Download
  const filename = `KSP_Executive_Dossier_${criminal.criminal_id}_${criminal.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(filename);
}
