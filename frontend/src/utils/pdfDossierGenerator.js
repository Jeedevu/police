/**
 * Karnataka State Police — Executive Intelligence Dossier PDF Generator
 * Professional Government-Grade Multi-Page Classified Report Engine
 * Supports Multilingual PDF generation (Kannada, Hindi, Tamil, Telugu, Malayalam, English).
 */
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import i18n from "../i18n";

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

// Multilingual Dictionary for PDF Header / Footer / Field Labels
const PDF_TRANSLATIONS = {
  kn: {
    dept: "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್",
    sub: "ಅಪರಾಧ ತನಿಖಾ ಮತ್ತು ಬಯೋಮೆಟ್ರಿಕ್ ದಾಖಲೆ",
    classified: "ರಹಸ್ಯ // ಆಂತರಿಕ ಪೊಲೀಸ್ ಬಳಕೆ ಮಾತ್ರ",
    subject_name: "ಅಪರಾಧಿಯ ಹೆಸರು",
    alias: "ಅಡ್ಡಹೆಸರು",
    id: "ಅಪರಾಧ ಪರಿಚಯ ಐಡಿ",
    status: "ಸ್ಥಿತಿ",
    threat: "ಅಪಾಯದ ಮಟ್ಟ",
    district: "ಜಿಲ್ಲಾ ಘಟಕ",
    station: "ಪೊಲೀಸ್ ಠಾಣೆ",
    control_id: "ದಾಖಲೆ ಸಂಖ್ಯೆ",
    timestamp: "ತಯಾರಿಸಿದ ಸಮಯ",
    officer: "ತನಿಖಾಧಿಕಾರಿ",
    exec_summary: "ಕಾರ್ಯಾಚರಣೆಯ ಸಾರಾಂಶ ಮತ್ತು ಅಪಾಯದ ಮೌಲ್ಯಮಾಪನ",
    profile_title: "ಅಪರಾಧಿಯ ವೈಯಕ್ತಿಕ ವಿವರಗಳು",
    timeline_title: "ಅಪರಾಧ ಘಟನಾವಳಿಗಳ ಕಾಲರೇಖೆ",
    fir_title: "ದಾಖಲಾದ FIR ಪ್ರಕರಣಗಳು",
    associates_title: "ಸಂಬಂಧಿತ ಅಪರಾಧಿ ಸಹಚರರು",
    evidence_title: "ಸಾಕ್ಷ್ಯ ಸಂಗ್ರಹಾಲಯ ದಾಖಲೆಗಳು",
    seal_title: "ಅಂತಿಮ ದೃಢೀಕರಣ ಮತ್ತು ಅಧಿಕೃತ ಮುದ್ರೆ",
    page: "ಪುಟ",
    of: "ನಿಂದ"
  },
  hi: {
    dept: "कर्नाटक राज्य पुलिस",
    sub: "अपराध जांच एवं बायोमेट्रिक डोजियर",
    classified: "गोपनीय // केवल पुलिस उपयोग हेतु",
    subject_name: "अपराधी का नाम",
    alias: "उपनाम",
    id: "अपराधी आईडी",
    status: "स्थिति",
    threat: "खतरे का स्तर",
    district: "जिला इकाई",
    station: "पुलिस स्टेशन",
    control_id: "दस्तावेज़ संख्या",
    timestamp: "जनरेट किया गया समय",
    officer: "जांच अधिकारी",
    exec_summary: "कार्यकारी सारांश एवं जोखिम मूल्यांकन",
    profile_title: "अपराधी का व्यक्तिगत विवरण",
    timeline_title: "अपराध समयरेखा",
    fir_title: "दर्ज FIR मामले",
    associates_title: "संबंधित सहयोगी",
    evidence_title: "साक्ष्य तिजोरी",
    seal_title: "अंतिम प्रमाणीकरण और मुहर",
    page: "पृष्ठ",
    of: "का"
  },
  en: {
    dept: "KARNATAKA STATE POLICE",
    sub: "CRIME INTELLIGENCE & BIOMETRIC DOSSIER",
    classified: "CLASSIFIED // RESTRICTED ACCESS",
    subject_name: "Subject Target Name",
    alias: "Alias / Street Name",
    id: "Criminal Identification ID",
    status: "Wanted Status Level",
    threat: "Threat & Risk Score",
    district: "Jurisdiction Unit",
    station: "Police Station",
    control_id: "Document Control ID",
    timestamp: "Generated Timestamp",
    officer: "Investigating Officer",
    exec_summary: "Executive Summary & Risk Assessment",
    profile_title: "Criminal Profile & Personal Details",
    timeline_title: "Chronological Criminal Timeline",
    fir_title: "Registered FIR Case Dossiers",
    associates_title: "Known Criminal Associates Network",
    evidence_title: "Catalyst File Store Evidence Vault",
    seal_title: "Final Authorization & Verification Seal",
    page: "Page",
    of: "of"
  }
};

function getFontFamilyForLang(lang) {
  switch (lang) {
    case "kn": return "'Noto Sans Kannada', sans-serif";
    case "hi": return "'Noto Sans Devanagari', sans-serif";
    case "ta": return "'Noto Sans Tamil', sans-serif";
    case "te": return "'Noto Sans Telugu', sans-serif";
    case "ml": return "'Noto Sans Malayalam', sans-serif";
    default: return "'Inter', sans-serif";
  }
}

/**
 * Main Dossier Generator supporting English and Indic language canvas rendering
 */
export async function generateExecutiveIntelligenceDossier(data = {}) {
  const currentLang = i18n.language || "en";
  const labels = PDF_TRANSLATIONS[currentLang] || PDF_TRANSLATIONS.en;
  const fontFamily = getFontFamilyForLang(currentLang);

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
      { fir_number: "FIR-2023-4102", crime: "Extortion & Criminal Intimidation", police_station: "Kalasipalya PS", date: "2023-08-04", status: "Chargesheet Filed", officer: "Insp. R. Seshadri" }
    ],
    arrest_history: [
      { year: "2019", event: "Arrested in Commercial Street Gold Shop Robbery Case", badge: "ARRESTED" },
      { year: "2020", event: "Released on conditional bail by Session Court", badge: "BAIL" },
      { year: "2023", event: "Absconded during trial hearing; NBW issued", badge: "WARRANT" }
    ],
    associates: [
      { name: "Syed 'Blade' Tanveer", relation: "Primary Enforcer / Hitman", crimes: "Assault, Extortion" },
      { name: "Ramesh 'Don' Naik", relation: "Hawala Operator & Financier", crimes: "Money Laundering, Fraud" }
    ],
    evidence_files: [
      { type: "CCTV", title: "CCTV Footage — MG Road ATM Heist", date: "2026-07-15", size: "42.8 MB" },
      { type: "PDF", title: "Certified FIR Copy #8821", date: "2024-11-12", size: "3.1 MB" }
    ]
  };

  const reportId = `KSP-INT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-X9`;
  const generatedTime = new Date().toLocaleString() + " IST";

  // If language is Indic (Kannada, Hindi, etc.), render HTML canvas element to guarantee 100% accurate script rendering
  if (currentLang !== "en") {
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "-9999px";
    tempContainer.style.width = "800px";
    tempContainer.style.fontFamily = fontFamily;
    tempContainer.style.backgroundColor = "#FFFFFF";
    tempContainer.style.color = "#0F172A";
    tempContainer.style.padding = "40px";

    tempContainer.innerHTML = `
      <div style="border: 4px solid #2563EB; padding: 24px; border-radius: 16px; background: #0B1626; color: white;">
        <div style="text-align: center; border-b: 2px solid #2563EB; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="font-size: 26px; font-weight: 800; margin: 0; color: #FFFFFF;">${labels.dept}</h1>
          <h2 style="font-size: 16px; color: #38BDF8; margin-top: 6px;">${labels.sub}</h2>
          <span style="background: #E11D48; color: white; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; display: inline-block; margin-top: 10px;">
            ${labels.classified}
          </span>
        </div>

        <div style="background: #162235; border: 1px solid #1E293B; padding: 18px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="color: #38BDF8; font-size: 14px; margin-top: 0; text-transform: uppercase;">1. ${labels.exec_summary}</h3>
          <p style="font-size: 13px; line-height: 1.6; color: #E2E8F0;">
            ${criminal.name} (${criminal.alias}) — ${criminal.district} (${criminal.police_station}).
            ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ಅಪರಾಧ ನಿಯಂತ್ರಣ ಮತ್ತು ತನಿಖಾ ಸಾರಾಂಶ.
          </p>
        </div>

        <div style="background: #162235; border: 1px solid #1E293B; padding: 18px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="color: #38BDF8; font-size: 14px; margin-top: 0; text-transform: uppercase;">2. ${labels.profile_title}</h3>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse; color: #F8FAFC;">
            <tr><td style="padding: 6px; font-weight: bold; color: #94A3B8;">${labels.subject_name}:</td><td style="padding: 6px;">${criminal.name}</td></tr>
            <tr><td style="padding: 6px; font-weight: bold; color: #94A3B8;">${labels.alias}:</td><td style="padding: 6px;">${criminal.alias}</td></tr>
            <tr><td style="padding: 6px; font-weight: bold; color: #94A3B8;">${labels.id}:</td><td style="padding: 6px;">${criminal.criminal_id}</td></tr>
            <tr><td style="padding: 6px; font-weight: bold; color: #94A3B8;">${labels.district}:</td><td style="padding: 6px;">${criminal.district}</td></tr>
            <tr><td style="padding: 6px; font-weight: bold; color: #94A3B8;">${labels.station}:</td><td style="padding: 6px;">${criminal.police_station}</td></tr>
            <tr><td style="padding: 6px; font-weight: bold; color: #94A3B8;">${labels.threat}:</td><td style="padding: 6px; color: #EF4444; font-weight: bold;">${criminal.threat_level} (${criminal.risk_score}/100)</td></tr>
          </table>
        </div>

        <div style="background: #162235; border: 1px solid #1E293B; padding: 18px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="color: #38BDF8; font-size: 14px; margin-top: 0; text-transform: uppercase;">3. ${labels.fir_title}</h3>
          <table style="width: 100%; font-size: 11px; border-collapse: collapse; text-align: left; color: #F8FAFC;">
            <tr style="border-b: 1px solid #334155; color: #38BDF8;">
              <th style="padding: 6px;">FIR NO</th>
              <th style="padding: 6px;">CRIME HEAD</th>
              <th style="padding: 6px;">STATION</th>
              <th style="padding: 6px;">DATE</th>
            </tr>
            ${criminal.firs.map(f => `
              <tr style="border-b: 1px solid #1E293B;">
                <td style="padding: 6px; font-weight: bold;">${f.fir_number}</td>
                <td style="padding: 6px;">${f.crime}</td>
                <td style="padding: 6px;">${f.police_station}</td>
                <td style="padding: 6px;">${f.date}</td>
              </tr>
            `).join("")}
          </table>
        </div>

        <div style="margin-top: 30px; border-t: 1px solid #334155; padding-top: 16px; font-size: 10px; color: #94A3B8; text-align: center;">
          ${labels.classified} • ${labels.dept} • REF: ${reportId}
        </div>
      </div>
    `;

    document.body.appendChild(tempContainer);
    const canvas = await html2canvas(tempContainer, { scale: 2 });
    document.body.removeChild(tempContainer);

    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    doc.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    doc.save(`KSP_Executive_Dossier_${criminal.criminal_id}_${currentLang}.pdf`);
    return;
  }

  // Standard English PDF Generation using native jsPDF primitives
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Cover Background
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pw, 130, "F");

  doc.setFillColor(...POLICE_BLUE);
  doc.rect(0, 130, pw, 4, "F");

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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(labels.dept, pw / 2, 80, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(148, 163, 184);
  doc.text(labels.sub, pw / 2, 90, { align: "center" });

  doc.setFillColor(...RED_ALERT);
  doc.roundedRect(pw / 2 - 35, 102, 70, 9, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(labels.classified, pw / 2, 107.5, { align: "center" });

  // Metadata Card Page 1
  let cy = 150;
  doc.setFillColor(...SLATE_BG);
  doc.setDrawColor(...CARD_BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(20, cy, pw - 40, 105, 2, 2, "FD");

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

  metaItem(labels.subject_name, criminal.name);
  metaItem(labels.alias, criminal.alias);
  metaItem(labels.id, criminal.criminal_id);
  metaItem(labels.status, criminal.wanted_status);
  metaItem(labels.threat, `${criminal.threat_level} (${criminal.risk_score} / 100)`);
  metaItem(labels.district, `${criminal.district} (${criminal.police_station})`);
  metaItem(labels.control_id, reportId);
  metaItem(labels.timestamp, generatedTime);
  metaItem(labels.officer, "Insp. Jeevan Kumar (Badge KSP-8821)");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("CONFIDENTIAL • POLICE USE ONLY • UNAUTHORIZED DISTRIBUTION IS PUNISHABLE BY LAW", pw / 2, ph - 15, { align: "center" });

  // Trigger Download
  const filename = `KSP_Executive_Dossier_${criminal.criminal_id}_EN.pdf`;
  doc.save(filename);
}
