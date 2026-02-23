// src/App.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ClipboardList, Plus, LogOut, Search, Link as LinkIcon, Trash2, UserPlus, CheckCircle2, AlertTriangle, Filter, FileDown, Edit, TableProperties, Loader2, ChevronDown, ChevronRight, FolderOpen, Layers, Pencil, X, AlertCircle, ShieldCheck } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

async function isEmailAuthorized(email) {
  const emailVal = String(email || "").trim().toLowerCase();
  if (!emailVal) return false;
  try {
    const { data, error } = await supabase.rpc("auth_is_authorized_email", { p_email: emailVal });
    if (error) throw error;
    return !!data;
  } catch {
    return false;
  }
}


const SESSION_KEY = "bstu_sess_v12";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function sanitize(str) { return String(str ?? "").replace(/[<>]/g, (c) => c === "<" ? "&lt;" : "&gt;"); }
function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user?.email || !parsed?.token || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > SESSION_TTL_MS) { sessionStorage.removeItem(SESSION_KEY); return null; }
    return parsed;
  } catch { return null; }
}
function writeSession(user, token) { const s = { user, token, ts: Date.now() }; sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); return s; }
function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

const THEME = {
  red: "#D62828", orange: "#F77F00", yellow: "#FCBF49", white: "#FFFFFF", ink: "#1A1A1A", bg: "#FFFFFF",
  gradMain: "linear-gradient(90deg, #D62828, #F77F00, #FCBF49)",
  gradSoft: "linear-gradient(135deg, rgba(214,40,40,0.10), rgba(247,127,0,0.10), rgba(252,191,73,0.14))",
};
const LOGO_SRC = "/batstateu-logo.png";
const SECURITY_QUESTIONS = [
  "What was the name of your first pet?", "What is your mother's maiden name?", "What city were you born in?",
  "What was the name of your elementary school?", "What is your favorite childhood movie?",
  "What was your childhood nickname?", "What is the name of the street you grew up on?",
];

const STRATEGIC_CONTEXT = {
  "Academic Leadership": {
    "Faculty Development promoted and accelerated": [
      "Improve faculty command of the emerging aspects of academic leadership, styles and skills, including understanding of contemporary issues in higher education",
      "Enhance professional relationships with colleagues within and outside the University",
      "Advance faculty engagement in multidisciplinary and interdisciplinary collaborations and discourse",
      "Expand capability-building and other development programs for engineering faculty in other Philippine Higher Education Institutions (HEIs)",
    ],
    "Program excellence ensured": [
      "Embark on national and international recognition of all programs",
      "Develop programs leading to improvements in teaching, student engagement, and overall educational quality and provide leadership in curriculum innovations in engineering education",
      "Design multidisciplinary capstone courses that develop topnotch engineering attributes",
      "Offer emerging programs in engineering and technology that are responsive to the demands of the industry",
    ],
    "Interest in STEM promoted and boosted": [
      "Work with DepEd on enhancing STEM curriculum for senior high school and teachers' competencies",
      "Generate and disseminate information on trends, developments, opportunities, and challenges on STEM strand in senior high school education in the Philippines and other parts of the world",
    ],
    "Smart University designed and fully developed": ["Guarantee that all laboratories and R&D facilities are upgraded or modernized"],
  },
  "Research and Innovation": {
    "University Research and Innovation Ecosystem Advanced": [
      "Promote cross-disciplinary and interdisciplinary research collaborations",
      "Strengthen capability building of researchers in different fields",
    ],
    "The Science, Technology, Engineering and Environment Research Hub: Innovation Facilities and Programs Strengthened and Promoted": ["Establish the STEER Hub's Corps of Experts"],
    "The Building Research and Innovation Development Goals for Engineering Schools (BRIDGES) Program: Engineering Research and Innovation Applied": ["Spearhead collaboration among HEIs on the conduct of engineering research and innovation on SDGs and other domains"],
  },
  "Social Responsibility": {
    "Families and Communities Empowered through Inclusive Community Engagements": ["Inculcate the culture of volunteerism among the university community and other stakeholders"],
  },
  "Internationalization": {
    "Global Academic Cooperation Advanced": [
      "Intensify international linkages and memberships",
      "Spearhead international collaborations on the advancement of engineering and technology education",
      "Organize and participate in international scholarly events",
    ],
    "Boundaries Transcended through Academic Mobility": ["Strengthen inbound and outbound Academic Mobility", "Increase the number of international students and faculty"],
    "Wider Transnational Education Highways Engineered": ["Offer programs under transnational higher education arrangement with foreign universities"],
    "World Engaged through Research Collaborations and Community Partnerships": [
      "Develop research programs with international partners towards attaining SDGs",
      "Undertake community management with international partners",
    ],
  },
};

const DEVELOPMENT_AREAS = Object.keys(STRATEGIC_CONTEXT);
function getOutcomes(devArea) { if (!devArea || !STRATEGIC_CONTEXT[devArea]) return []; return Object.keys(STRATEGIC_CONTEXT[devArea]); }
function getStrategies(devArea, outcome) { if (!devArea || !outcome) return []; return STRATEGIC_CONTEXT[devArea]?.[outcome] || []; }

function StrategicContextFields({ developmentArea, outcome, strategy, onDevelopmentAreaChange, onOutcomeChange, onStrategyChange }) {
  const outcomes = getOutcomes(developmentArea);
  const strategies = getStrategies(developmentArea, outcome);
  function handleDevAreaChange(val) { onDevelopmentAreaChange(val); onOutcomeChange(""); onStrategyChange(""); }
  function handleOutcomeChange(val) { onOutcomeChange(val); onStrategyChange(""); }
  const selectBaseStyle = { border: "1px solid rgba(0,0,0,0.12)", background: "white", borderRadius: 16, padding: "10px 32px 10px 12px", fontSize: 13, color: THEME.ink, width: "100%", outline: "none", cursor: "pointer", appearance: "none", WebkitAppearance: "none", MozAppearance: "none" };
  const disabledSelectStyle = { ...selectBaseStyle, background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.35)", cursor: "not-allowed" };
  const wrapStyle = { position: "relative", width: "100%" };
  const chevronStyle = (disabled) => ({ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 12, color: disabled ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.5)", lineHeight: 1 });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
      <div className="space-y-1.5">
        <div className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.65)" }}>Development Area</div>
        <div style={wrapStyle}>
          <select value={developmentArea} onChange={(e) => handleDevAreaChange(e.target.value)} style={selectBaseStyle}>
            <option value="">Select development area…</option>
            {DEVELOPMENT_AREAS.map((da) => <option key={da} value={da}>{da}</option>)}
          </select>
          <span style={chevronStyle(false)}>▾</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.65)" }}>Outcome{!developmentArea && <span className="ml-1 text-xs font-normal" style={{ color: "rgba(0,0,0,0.35)" }}>— select a Development Area first</span>}</div>
        <div style={wrapStyle}>
          <select value={outcome} onChange={(e) => handleOutcomeChange(e.target.value)} disabled={!developmentArea} style={!developmentArea ? disabledSelectStyle : selectBaseStyle}>
            <option value="">Select outcome…</option>
            {outcomes.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <span style={chevronStyle(!developmentArea)}>▾</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.65)" }}>Strategy{!outcome && <span className="ml-1 text-xs font-normal" style={{ color: "rgba(0,0,0,0.35)" }}>— select an Outcome first</span>}</div>
        <div style={wrapStyle}>
          <select value={strategy} onChange={(e) => onStrategyChange(e.target.value)} disabled={!outcome} style={!outcome ? disabledSelectStyle : selectBaseStyle}>
            <option value="">Select strategy…</option>
            {strategies.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={chevronStyle(!outcome)}>▾</span>
        </div>
        {strategy && (
          <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(214,40,40,0.05)", color: "rgba(0,0,0,0.65)", border: "1px solid rgba(214,40,40,0.12)", lineHeight: 1.5 }}>
            <span className="font-semibold" style={{ color: THEME.red }}>Selected: </span>{strategy}
          </div>
        )}
      </div>
    </div>
  );
}

function fromDb(row) {
  return {
    id: row.id, ownerEmail: row.owner_email, title: row.title,
    performanceIndicator: row.performance_indicator || "", personnelOfficeConcerned: row.personnel_office_concerned || "",
    developmentArea: row.development_area || "", outcome: row.outcome || "", strategy: row.strategy || "",
    q1: row.q1 || "", q2: row.q2 || "", q3: row.q3 || "", q4: row.q4 || "",
    actualQ1: row.actual_q1 || "", actualQ2: row.actual_q2 || "", actualQ3: row.actual_q3 || "", actualQ4: row.actual_q4 || "",
    totalEstimatedCost: row.total_estimated_cost || 0, fundSource: row.fund_source || "",
    risks: row.risks || "", probability: row.probability || "", severity: row.severity || "",
    riskExposure: row.risk_exposure || "Low", mitigatingActivities: row.mitigating_activities || "",
    completed: row.completed || false, completedAt: row.completed_at ? new Date(row.completed_at).getTime() : null,
    evidenceLinks: row.evidence_links || [], createdAt: new Date(row.created_at).getTime(), updatedAt: new Date(row.updated_at).getTime(),
  };
}
function toDb(p) {
  return {
    owner_email: p.ownerEmail, title: p.title, performance_indicator: p.performanceIndicator,
    personnel_office_concerned: p.personnelOfficeConcerned, development_area: p.developmentArea || "",
    outcome: p.outcome || "", strategy: p.strategy || "",
    q1: p.q1, q2: p.q2, q3: p.q3, q4: p.q4,
    actual_q1: p.actualQ1 || "", actual_q2: p.actualQ2 || "", actual_q3: p.actualQ3 || "", actual_q4: p.actualQ4 || "",
    total_estimated_cost: parseFloat(String(p.totalEstimatedCost).replace(/,/g, "")) || 0,
    fund_source: p.fundSource, risks: p.risks, probability: p.probability, severity: p.severity,
    risk_exposure: p.riskExposure, mitigating_activities: p.mitigatingActivities,
    completed: p.completed || false, completed_at: p.completedAt ? new Date(p.completedAt).toISOString() : null,
    evidence_links: p.evidenceLinks || [],
  };
}

function isValidUrlLike(s) { try { const u = new URL(s); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; } }
function parseNumberSafe(v) { const n = Number(String(v ?? "").replace(/,/g, "").trim()); return Number.isFinite(n) ? n : 0; }
function formatCurrencyPHP(value) { const n = Number(value); if (!Number.isFinite(n)) return "₱0.00"; return n.toLocaleString("en-PH", { style: "currency", currency: "PHP" }); }
function parseNumLoose(v) { if (v === null || v === undefined) return 0; const s = String(v).trim(); if (!s) return 0; const n = Number(s.replace(/,/g, "")); return Number.isFinite(n) ? n : 0; }
function sumQuarterlyTargets(p) { return parseNumLoose(p.q1) + parseNumLoose(p.q2) + parseNumLoose(p.q3) + parseNumLoose(p.q4); }
function formatDateTime(ts) { if (!ts) return ""; return new Date(ts).toLocaleString("en-PH"); }

const ALL_QUARTER_COLS = [{ tk: "q1", ak: "actualQ1", label: "Q1" }, { tk: "q2", ak: "actualQ2", label: "Q2" }, { tk: "q3", ak: "actualQ3", label: "Q3" }, { tk: "q4", ak: "actualQ4", label: "Q4" }];
function getVisibleQuarters(quarterFilter) { if (quarterFilter === "all") return ALL_QUARTER_COLS; return ALL_QUARTER_COLS.filter((q) => q.tk === quarterFilter); }

function drawPdfHeader(doc, pageWidth) {
  const MARGIN_TOP = 18, logoSize = 56, gap = 14, centerX = pageWidth / 2;
  const line1H = 18, line2H = 13, line3H = 11, textBlockH = line1H + line2H + line3H;
  const groupH = Math.max(logoSize, textBlockH), groupTopY = MARGIN_TOP;
  doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  const w1 = doc.getTextWidth("BATANGAS STATE UNIVERSITY");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  const w2 = doc.getTextWidth("THE NATIONAL ENGINEERING UNIVERSITY");
  doc.setFont("helvetica", "italic"); doc.setFontSize(8);
  const w3 = doc.getTextWidth("Leading Innovations, Transforming Lives, Building the Nation");
  const textBlockW = Math.max(w1, w2, w3);
  const groupW = logoSize + gap + textBlockW, groupStartX = centerX - groupW / 2;
  const logoX = groupStartX, logoY = groupTopY + (groupH - logoSize) / 2;
  const textStartX = groupStartX + logoSize + gap, textBlockTopY = groupTopY + (groupH - textBlockH) / 2;
  const textCenterX = textStartX + textBlockW / 2;
  try { const logoImg = new Image(); logoImg.src = LOGO_SRC; doc.addImage(logoImg, "PNG", logoX, logoY, logoSize, logoSize); } catch (e) {}
  const y1 = textBlockTopY + line1H - 3;
  doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(0, 0, 0);
  doc.text("BATANGAS STATE UNIVERSITY", textCenterX, y1, { align: "center" });
  const y2 = y1 + line2H;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(214, 40, 40);
  doc.text("THE NATIONAL ENGINEERING UNIVERSITY", textCenterX, y2, { align: "center" });
  const y3 = y2 + line3H;
  doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(214, 40, 40);
  doc.text("Leading Innovations, Transforming Lives, Building the Nation", textCenterX, y3, { align: "center" });
  const dividerY = groupTopY + groupH + 10;
  doc.setTextColor(0, 0, 0); doc.setLineWidth(0.5);
  doc.line(30, dividerY, pageWidth - 30, dividerY);
  return dividerY;
}

function groupByStrategicContext(items) {
  const map = new Map();
  items.forEach((p) => {
    const key = (p.developmentArea && p.outcome && p.strategy) ? `${p.developmentArea}|||${p.outcome}|||${p.strategy}` : "__ungrouped__";
    if (!map.has(key)) map.set(key, { developmentArea: p.developmentArea || "", outcome: p.outcome || "", strategy: p.strategy || "", items: [] });
    map.get(key).items.push(p);
  });
  const entries = Array.from(map.entries());
  entries.sort(([ka], [kb]) => { if (ka === "__ungrouped__") return 1; if (kb === "__ungrouped__") return -1; return ka.localeCompare(kb); });
  return entries;
}

function exportPapsToPDF({ user, items, title = "PAPs Report", quarterFilter = "all" }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "legal" });
  const now = new Date(), pageWidth = doc.internal.pageSize.getWidth(), centerX = pageWidth / 2;
  const MARGIN_L = 30, MARGIN_R = 30, USABLE = 948;
  const dividerY = drawPdfHeader(doc, pageWidth);
  let y = dividerY + 14;
  const titleLines = title.split("\n");
  titleLines.forEach((line, i) => {
    if (i === 0) { doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(0, 0, 0); }
    else { doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(60, 60, 60); }
    doc.text(line, centerX, y, { align: "center" }); y += 13;
  });
  const filterLabel = quarterFilter === "all" ? "All Quarters" : quarterFilter.toUpperCase();
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(120);
  doc.text(`Filter: ${filterLabel}`, centerX, y + 4, { align: "center" }); doc.setTextColor(0); y += 16;
  const visibleQs = getVisibleQuarters(quarterFilter), isFiltered = quarterFilter !== "all";
  const showTotal = !isFiltered, showCost = !isFiltered;
  let colWidths;
  if (!isFiltered) {
    const qNum = 36, qCols = 4 * qNum, totW = 36, costW = 50, fsW = 40, riskW = 50, probW = 56, sevW = 50, reW = 40, mitW = 56, statW = 44;
    const fixedRTotal = costW + fsW + riskW + probW + sevW + reW + mitW + statW;
    const leftOver = USABLE - qCols - totW - fixedRTotal;
    colWidths = [Math.round(leftOver * 0.40), Math.round(leftOver * 0.35), Math.round(leftOver * 0.25), ...Array(4).fill(qNum), totW, costW, fsW, riskW, probW, sevW, reW, mitW, statW];
    colWidths[0] += USABLE - colWidths.reduce((a, b) => a + b, 0);
  } else {
    const qNum = 44, fsW = 44, riskW = 56, probW = 58, sevW = 52, reW = 40, mitW = 58, statW = 48;
    const fixedRTotal = fsW + riskW + probW + sevW + reW + mitW + statW;
    const leftOver = USABLE - qNum - fixedRTotal;
    colWidths = [Math.round(leftOver * 0.38), Math.round(leftOver * 0.36), Math.round(leftOver * 0.26), qNum, fsW, riskW, probW, sevW, reW, mitW, statW];
    colWidths[0] += USABLE - colWidths.reduce((a, b) => a + b, 0);
  }
  const columnStyles = {};
  colWidths.forEach((w, idx) => { columnStyles[idx] = { cellWidth: w, overflow: "linebreak" }; });
  const fixedLeftHeaders = ["Programs, Activities, and Projects", "Performance Indicator", "Personnel / Office Concerned"];
  const quarterHeaders = visibleQs.map(({ label }) => `${label}\nTarget`);
  const totalHeaders = showTotal ? ["Total\nTarget"] : [];
  const costHeader = showCost ? ["Total Est.\nCost"] : [];
  const fixedRightHeaders = ["Fund\nSource", "Risks", "Probability", "Severity", "Risk\nExposure", "Mitigating\nActivities", "Status"];
  const head = [[...fixedLeftHeaders, ...quarterHeaders, ...totalHeaders, ...costHeader, ...fixedRightHeaders]];
  const pageH = doc.internal.pageSize.getHeight();
  const footerFn = (data) => { doc.setFontSize(8); doc.setTextColor(120); doc.text(`Page ${data.pageNumber} of ${doc.getNumberOfPages()}`, pageWidth - 50, pageH - 15, { align: "right" }); doc.setTextColor(0); };
  const groups = groupByStrategicContext(items || []);
  let firstGroup = true;
  groups.forEach(([key, group]) => {
    const groupItems = group.items, isUngrouped = key === "__ungrouped__";
    const headerLineH = 13, headerPadV = 8;
    const headerH = isUngrouped ? headerLineH + headerPadV * 2 : headerLineH * 3 + headerPadV * 2;
    if (!firstGroup && y + headerH + 30 > pageH - 60) { doc.addPage(); y = 40; }
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.4);
    doc.line(MARGIN_L, y, MARGIN_L + USABLE, y); doc.setDrawColor(0); doc.setLineWidth(0.5);
    y += headerPadV;
    if (!isUngrouped) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(0, 0, 0);
      doc.text(`Development Area: ${group.developmentArea}`, MARGIN_L, y); y += headerLineH;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(30, 30, 30);
      doc.text(`Outcome: ${group.outcome}`, MARGIN_L, y); y += headerLineH;
      doc.text(`Strategy: ${group.strategy}`, MARGIN_L, y); y += headerLineH;
    } else {
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
      doc.text("No strategic context assigned", MARGIN_L, y); y += headerLineH;
    }
    y += headerPadV;
    const body = groupItems.map((p) => {
      const quarterCells = visibleQs.map(({ tk }) => { const t = parseNumLoose(p[tk]); return t || "—"; });
      const totalTarget = sumQuarterlyTargets(p);
      const totalCells = showTotal ? [totalTarget || "—"] : [];
      const costCell = showCost ? [formatCurrencyPHP(p.totalEstimatedCost || 0).replace("₱", "Php ")] : [];
      return [p.title || "—", p.performanceIndicator || "—", p.personnelOfficeConcerned || "—", ...quarterCells, ...totalCells, ...costCell, p.fundSource || "—", p.risks || "—", p.probability || "—", p.severity || "—", p.riskExposure || "—", p.mitigatingActivities || "—", p.completed ? "Accomplished" : "Ongoing"];
    });
    autoTable(doc, { startY: y, head, body, styles: { font: "helvetica", fontSize: 7, cellPadding: 2.5, valign: "top", overflow: "linebreak" }, headStyles: { fontStyle: "bold", fillColor: [255, 182, 193], textColor: [0, 0, 0], halign: "center", valign: "middle" }, margin: { left: MARGIN_L, right: MARGIN_R }, tableWidth: USABLE, columnStyles, didDrawPage: footerFn });
    y = doc.lastAutoTable.finalY + 18; firstGroup = false;
  });
  doc.save(`PAPs_Report_${(user?.displayName || "user").replace(/[^a-z0-9]+/gi, "_")}_${now.toISOString().slice(0, 10)}.pdf`);
}

function exportListToPDF({ user, items, quarterFilter }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "legal" });
  const now = new Date(), pageWidth = doc.internal.pageSize.getWidth(), centerX = pageWidth / 2;
  const MARGIN_L = 30, MARGIN_R = 30, USABLE = 948;
  const dividerY = drawPdfHeader(doc, pageWidth);
  let y = dividerY + 14;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(0, 0, 0);
  doc.text("FY 2026 Annual Operation Plan", centerX, y, { align: "center" }); y += 13;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(60, 60, 60);
  doc.text("College of Engineering — Alangilan Campus", centerX, y, { align: "center" }); y += 13;
  const filterLabel = quarterFilter === "all" ? "All Quarters" : quarterFilter.toUpperCase();
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(120);
  doc.text(`Filter: ${filterLabel}`, centerX, y + 4, { align: "center" }); doc.setTextColor(0); y += 16;
  const visibleQs = getVisibleQuarters(quarterFilter), qCount = visibleQs.length;
  const noW = 18, fsW = 42, riskW = 54, probW = 56, sevW = 50, reW = 38, mitW = 56, statW = 46, costW = 46;
  const fixedR = costW + fsW + riskW + probW + sevW + reW + mitW + statW, qColW = 52, qCols = qCount * qColW;
  const leftOver = USABLE - noW - qCols - fixedR;
  const colWidths = [noW, Math.round(leftOver * 0.40), Math.round(leftOver * 0.35), Math.round(leftOver * 0.25), ...Array(qCount).fill(qColW), costW, fsW, riskW, probW, sevW, reW, mitW, statW];
  colWidths[1] += USABLE - colWidths.reduce((a, b) => a + b, 0);
  const columnStyles = {};
  colWidths.forEach((w, idx) => { columnStyles[idx] = { cellWidth: w, overflow: "linebreak" }; });
  const fixedLeftHeaders = ["#", "Programs, Activities & Projects", "Performance Indicator", "Personnel / Office"];
  const quarterHeaders = visibleQs.map(({ label }) => `${label}\nTarget`);
  const fixedRightHeaders = ["Total Est.\nCost", "Fund\nSource", "Risks", "Probability", "Severity", "Risk\nExposure", "Mitigating\nActivities", "Status"];
  const head = [[...fixedLeftHeaders, ...quarterHeaders, ...fixedRightHeaders]];
  const pageH = doc.internal.pageSize.getHeight();
  const footerFn = (data) => { doc.setFontSize(8); doc.setTextColor(120); doc.text(`Page ${data.pageNumber} of ${doc.getNumberOfPages()}`, pageWidth - 50, pageH - 15, { align: "right" }); doc.setTextColor(0); };
  const groups = groupByStrategicContext(items || []);
  let firstGroup = true;
  groups.forEach(([key, group]) => {
    const groupItems = group.items, isUngrouped = key === "__ungrouped__";
    const headerLineH = 13, headerPadV = 8;
    if (!firstGroup && y + headerLineH * 3 + headerPadV * 2 + 30 > pageH - 60) { doc.addPage(); y = 40; }
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.4);
    doc.line(MARGIN_L, y, MARGIN_L + USABLE, y); doc.setDrawColor(0); doc.setLineWidth(0.5);
    y += headerPadV;
    if (!isUngrouped) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(0, 0, 0);
      doc.text(`Development Area: ${group.developmentArea}`, MARGIN_L, y); y += headerLineH;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(30, 30, 30);
      doc.text(`Outcome: ${group.outcome}`, MARGIN_L, y); y += headerLineH;
      doc.text(`Strategy: ${group.strategy}`, MARGIN_L, y); y += headerLineH;
    } else {
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
      doc.text("No strategic context assigned", MARGIN_L, y); y += headerLineH;
    }
    y += headerPadV;
    const body = groupItems.map((p, i) => {
      const quarterCells = visibleQs.map(({ tk, ak }) => { const t = parseNumLoose(p[tk]), a = parseNumLoose(p[ak]); if (t === 0 && a === 0) return "—"; return `${a > 0 ? a : "0"} / ${t > 0 ? t : "0"}`; });
      return [i + 1, p.title || "—", p.performanceIndicator || "—", p.personnelOfficeConcerned || "—", ...quarterCells, formatCurrencyPHP(p.totalEstimatedCost || 0).replace("₱", "Php "), p.fundSource || "—", p.risks || "—", p.probability || "—", p.severity || "—", p.riskExposure || "—", p.mitigatingActivities || "—", p.completed ? "Accomplished" : "Ongoing"];
    });
    autoTable(doc, { startY: y, head, body, styles: { font: "helvetica", fontSize: 7, cellPadding: 2.5, valign: "top", overflow: "linebreak" }, headStyles: { fontStyle: "bold", fillColor: [255, 182, 193], textColor: [0, 0, 0], halign: "center", valign: "middle" }, columnStyles: { ...columnStyles, ...Object.fromEntries(visibleQs.map((_, qi) => [4 + qi, { ...columnStyles[4 + qi], halign: "center" }])) }, margin: { left: MARGIN_L, right: MARGIN_R }, tableWidth: USABLE, didDrawPage: footerFn });
    y = doc.lastAutoTable.finalY + 18; firstGroup = false;
  });
  doc.save(`PAPs_List_${(user?.displayName || "user").replace(/[^a-z0-9]+/gi, "_")}_${now.toISOString().slice(0, 10)}.pdf`);
}

function BrandTopBar({ transparent = false }) {
  return (
    <div className="w-full" style={{ position: transparent ? "absolute" : "relative", top: transparent ? 0 : "auto", left: transparent ? 0 : "auto", zIndex: transparent ? 10 : "auto", backgroundImage: transparent ? undefined : "url('/header.jpg')", backgroundSize: "cover", backgroundPosition: "center top", backgroundRepeat: "no-repeat", overflow: "hidden" }}>
      {!transparent && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.55)", pointerEvents: "none" }} />}
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8" style={{ position: "relative", zIndex: 1 }}>
        <div className="flex items-center justify-center gap-5 text-center">
          <div className="rounded-2xl p-2 shadow-md backdrop-blur flex-shrink-0" style={{ width: 80, height: 80, background: transparent ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.85)", border: transparent ? "1.5px solid rgba(255,255,255,0.35)" : "2px solid rgba(214,40,40,0.18)", boxShadow: transparent ? "0 2px 12px rgba(0,0,0,0.30)" : "0 4px 16px rgba(0,0,0,0.14)" }}>
            <img src={LOGO_SRC} alt="Batangas State University Logo" onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.04em", color: transparent ? "#fff" : THEME.ink, textShadow: transparent ? "0 2px 8px rgba(0,0,0,0.75)" : "0 1px 0 rgba(255,255,255,0.9)", lineHeight: 1.1 }}>BATANGAS STATE UNIVERSITY</div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", marginTop: 4, color: transparent ? "rgba(255,255,255,0.95)" : THEME.red, textShadow: transparent ? "0 1px 6px rgba(0,0,0,0.70)" : "0 1px 0 rgba(255,255,255,0.8)", textTransform: "uppercase" }}>The National Engineering University</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, fontStyle: "italic", marginTop: 2, color: transparent ? "rgba(255,255,255,0.88)" : THEME.red, textShadow: transparent ? "0 1px 5px rgba(0,0,0,0.65)" : "none", opacity: 0.9 }}>Leading Innovations, Transforming Lives, Building the Nation</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ children, className = "", style = {} }) {
  return <div className={`rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] ${className}`} style={{ border: "1px solid rgba(0,0,0,0.06)", background: THEME.white, ...style }}>{children}</div>;
}
function Pill({ children, tone = "neutral" }) {
  const styles = { neutral: { background: "rgba(0,0,0,0.05)", color: THEME.ink }, info: { background: "rgba(247,127,0,0.14)", color: THEME.ink }, ok: { background: "rgba(252,191,73,0.22)", color: THEME.ink }, warn: { background: "rgba(214,40,40,0.12)", color: THEME.red } };
  return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={styles[tone] || styles.neutral}>{children}</span>;
}
function PrimaryButton({ children, onClick, disabled, className = "", type = "button" }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${className}`} style={{ background: THEME.gradMain }}>{children}</button>;
}
function GhostButton({ children, onClick, className = "", type = "button" }) {
  return <button type={type} onClick={onClick} className={`rounded-2xl px-3 py-2 text-sm font-semibold transition hover:bg-black/5 active:scale-[0.99] ${className}`} style={{ color: THEME.ink }}>{children}</button>;
}
function Input({ label, value, onChange, placeholder, type = "text", icon: Icon, error, hint }) {
  return (
    <div className="space-y-1.5">
      {label ? <div className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.65)" }}>{label}</div> : null}
      <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5" style={{ border: `1px solid ${error ? "rgba(214,40,40,0.45)" : "rgba(0,0,0,0.12)"}`, background: "white" }}>
        {Icon ? <Icon className="h-4 w-4" style={{ color: "rgba(0,0,0,0.45)" }} /> : null}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none" />
      </div>
      {error ? <div className="flex items-center gap-1 text-xs font-medium" style={{ color: THEME.red }}><AlertTriangle className="h-3.5 w-3.5" />{error}</div>
        : hint ? <div className="text-xs" style={{ color: "rgba(0,0,0,0.55)" }}>{hint}</div> : null}
    </div>
  );
}
function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div className="space-y-1.5">
      {label ? <div className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.65)" }}>{label}</div> : null}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full rounded-2xl px-3 py-2.5 text-sm outline-none" style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white" }} />
    </div>
  );
}
function Spinner({ size = 18 }) { return <Loader2 size={size} className="animate-spin" style={{ color: THEME.red }} />; }
function ErrorBanner({ msg, onDismiss }) {
  if (!msg) return null;
  return (
    <div className="rounded-2xl px-4 py-3 text-sm flex items-center justify-between gap-3" style={{ background: "rgba(214,40,40,0.10)", color: THEME.red }}>
      <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 flex-shrink-0" />{msg}</div>
      {onDismiss && <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 14, color: THEME.red }}>×</button>}
    </div>
  );
}

function ProgressRing({ pct, size = 54, stroke = 5, color, bg = "rgba(0,0,0,0.08)" }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 900, color, lineHeight: 1 }}>{pct}%</span>
      </div>
    </div>
  );
}

// ─── CORE CHANGE: usePaps hook ───────────────────────────────────────────────
// Strategy:
//   • Admin  → reads/writes rows owned by their own email (unchanged).
//   • Non-admin (allowlisted) → fetches the list of Admin emails via the RPC,
//     then reads ALL rows owned by any of those admins.  Writes are done using
//     the first Admin email as `owner_email` so the data stays in the shared
//     pool and is visible to every user.
// ─────────────────────────────────────────────────────────────────────────────
function usePaps(user, token) {
  const userEmail = (user?.email || "").trim().toLowerCase();
  const isAdmin = (user?.role || "") === "Admin";

  const [paps, setPaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ownerEmails = the set of email(s) whose rows we read.
  // sharedOwnerEmail = the single email we use when *writing* new rows so they
  //                    always land in the shared Admin pool.
  const [ownerEmails, setOwnerEmails] = useState([]);
  const [sharedOwnerEmail, setSharedOwnerEmail] = useState("");

  useEffect(() => {
    let alive = true;
    async function resolveOwners() {
      if (!userEmail) {
        if (alive) { setOwnerEmails([]); setSharedOwnerEmail(""); }
        return;
      }

      if (isAdmin) {
        // Admin owns their own pool; they write under their own email.
        if (alive) { setOwnerEmails([userEmail]); setSharedOwnerEmail(userEmail); }
        return;
      }

      // Non-admin: find which Admin email(s) hold the shared data.
      try {
        const { data, error: err } = await supabase.rpc("admin_emails_list", {
          p_requester_email: userEmail,
          p_token: token,
        });
        if (err) throw err;
        const emails = (data || [])
          .map((r) => (r?.email || "").trim().toLowerCase())
          .filter(Boolean);

        if (alive && emails.length > 0) {
          // Read from all admin emails; write under the first one.
          setOwnerEmails(emails);
          setSharedOwnerEmail(emails[0]);
        } else {
          // Fallback: no admins found — fall back to user's own rows so the
          // app is still functional (e.g., during initial setup).
          if (alive) { setOwnerEmails([userEmail]); setSharedOwnerEmail(userEmail); }
        }
      } catch {
        // RPC not yet deployed or network error — safe fallback.
        if (alive) { setOwnerEmails([userEmail]); setSharedOwnerEmail(userEmail); }
      }
    }

    resolveOwners();
    return () => { alive = false; };
  }, [userEmail, token, isAdmin]);

  const fetchPaps = useCallback(async () => {
    if (!userEmail) return;
    if (!ownerEmails || ownerEmails.length === 0) return;

    setLoading(true); setError(null);

    let q = supabase.from("paps").select("*").order("created_at", { ascending: true });
    if (ownerEmails.length === 1) q = q.eq("owner_email", ownerEmails[0]);
    else q = q.in("owner_email", ownerEmails);

    const { data, error: err } = await q;
    if (err) { setError(err.message); setLoading(false); return; }
    setPaps((data || []).map(fromDb)); setLoading(false);
  }, [userEmail, ownerEmails]);

  useEffect(() => { fetchPaps(); }, [fetchPaps]);

  // Realtime subscription
  useEffect(() => {
    if (!userEmail) return;
    if (!ownerEmails || ownerEmails.length === 0) return;

    const filter = ownerEmails.length === 1 ? `owner_email=eq.${ownerEmails[0]}` : undefined;
    let chan = supabase.channel("paps-changes");
    const opts = filter
      ? { event: "*", schema: "public", table: "paps", filter }
      : { event: "*", schema: "public", table: "paps" };
    chan = chan.on("postgres_changes", opts, () => { fetchPaps(); }).subscribe();

    return () => { supabase.removeChannel(chan); };
  }, [userEmail, ownerEmails, fetchPaps]);

  // add: always writes under sharedOwnerEmail so the row is in the shared pool
  const add = useCallback(async (papData) => {
    if (!sharedOwnerEmail) throw new Error("Shared owner email not resolved yet.");
    const payload = toDb({ ...papData, ownerEmail: sharedOwnerEmail });
    const { error: err } = await supabase.from("paps").insert(payload);
    if (err) throw new Error(err.message);
    await fetchPaps();
  }, [fetchPaps, sharedOwnerEmail]);

  const update = useCallback(async (id, patch) => {
    const dbPatch = {};
    const keyMap = {
      ownerEmail: "owner_email", title: "title", performanceIndicator: "performance_indicator",
      personnelOfficeConcerned: "personnel_office_concerned", developmentArea: "development_area",
      outcome: "outcome", strategy: "strategy", q1: "q1", q2: "q2", q3: "q3", q4: "q4",
      actualQ1: "actual_q1", actualQ2: "actual_q2", actualQ3: "actual_q3", actualQ4: "actual_q4",
      totalEstimatedCost: "total_estimated_cost", fundSource: "fund_source", risks: "risks",
      probability: "probability", severity: "severity", riskExposure: "risk_exposure",
      mitigatingActivities: "mitigating_activities", completed: "completed", completedAt: "completed_at",
    };
    for (const [k, v] of Object.entries(patch || {})) {
      const dbKey = keyMap[k];
      if (!dbKey) continue;
      dbPatch[dbKey] = (v === undefined) ? null : v;
    }
    const { error: err } = await supabase.from("paps").update(dbPatch).eq("id", id);
    if (err) throw new Error(err.message);
    setPaps((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const remove = useCallback(async (id) => {
    const { error: err } = await supabase.from("paps").delete().eq("id", id);
    if (err) throw new Error(err.message);
    setPaps((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { paps, loading, error, refetch: fetchPaps, add, update, remove, ownerEmails, sharedOwnerEmail };
}
// ─────────────────────────────────────────────────────────────────────────────


export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mode, setMode] = useState("login");
  useEffect(() => {
    async function restoreSession() {
      const stored = readSession();
      if (!stored) { setAuthLoading(false); return; }
      try {
        const { data, error } = await supabase.rpc("auth_validate_session", { p_email: stored.user.email, p_token: stored.token });
        const row = data?.[0];
        if (error || !row?.valid) { clearSession(); setAuthLoading(false); return; }
        setSession(stored);
      } catch { clearSession(); }
      setAuthLoading(false);
    }
    restoreSession();
  }, []);
  function handleLogin(user, token) { const s = writeSession(user, token); setSession(s); }
  async function handleLogout() {
    const stored = readSession();
    if (stored?.token) { try { await supabase.rpc("auth_logout", { p_email: stored.user.email, p_token: stored.token }); } catch {} }
    clearSession(); setSession(null);
  }
  if (authLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: THEME.bg }}><Spinner size={32} /></div>;
  return (
    <div className="min-h-screen" style={{ background: THEME.bg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {session && <BrandTopBar transparent={false} />}
      <AnimatePresence mode="wait">
        {!session ? (
          <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ flex: 1 }}>
            {mode === "login" ? <LoginPage onLogin={handleLogin} onSwitch={() => setMode("register")} /> : <RegisterPage onSwitch={() => setMode("login")} />}
          </motion.div>
        ) : (
          <motion.div key="shell" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ flex: 1, overflow: "hidden" }}>
            <Dashboard user={session.user} token={session.token} onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>
      {!session && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 5, textAlign: "center", padding: "12px", fontSize: 12, color: "rgba(255,255,255,0.75)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
          © {new Date().getFullYear()} Batangas State University • Program, Activities and Projects Tracker
        </div>
      )}
    </div>
  );
}

function LoginPage({ onLogin, onSwitch }) {
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [error, setError] = useState(""), [loading, setLoading] = useState(false);
  const [fpStep, setFpStep] = useState(null), [fpEmail, setFpEmail] = useState(""), [fpQuestion, setFpQuestion] = useState(""), [fpAnswer, setFpAnswer] = useState(""), [fpNewPass, setFpNewPass] = useState(""), [fpConfirm, setFpConfirm] = useState(""), [fpError, setFpError] = useState(""), [fpLoading, setFpLoading] = useState(false), [fpVerified, setFpVerified] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const allowed = await isEmailAuthorized(email);
      if (!allowed) throw new Error("EMAIL_NOT_AUTHORIZED");
      const { data, error: err } = await supabase.rpc("auth_login", { p_email: email.trim().toLowerCase(), p_password: password });
      if (err) throw err;
      const row = data?.[0];
      if (!row?.session_token) throw new Error("INVALID_CREDENTIALS");
      onLogin({ id: row.id, displayName: row.display_name, email: row.email, role: row.role }, row.session_token);
    } catch (e) {
      const msg = e?.message || "";
      if (msg.includes("EMAIL_NOT_AUTHORIZED")) setError("This email is not authorized to access the system. Please contact the administrator.");
      else if (msg.includes("ACCOUNT_LOCKED")) setError("Account locked for 15 minutes after too many failed attempts.");
      else setError("Invalid email or password.");
    }
    setLoading(false);
  }
  async function handleFpEmailSubmit() {
    setFpError(""); setFpLoading(true);
    try {
      const { data: question, error: err } = await supabase.rpc("auth_get_security_question", { p_email: fpEmail.trim().toLowerCase() });
      if (err || !question) { setFpError("No account found with that email."); setFpLoading(false); return; }
      setFpQuestion(question); setFpStep("question");
    } catch { setFpError("Could not fetch account details."); }
    setFpLoading(false);
  }
  async function handleFpAnswerSubmit() {
    setFpError(""); setFpLoading(true);
    try {
      const { data: ok, error: err } = await supabase.rpc("auth_verify_security_answer", { p_email: fpEmail.trim().toLowerCase(), p_answer: fpAnswer });
      if (err || !ok) { setFpError("Incorrect answer. Please try again."); setFpLoading(false); return; }
      setFpVerified(true); setFpStep("reset");
    } catch { setFpError("Verification failed. Please try again."); }
    setFpLoading(false);
  }
  async function handleFpResetSubmit() {
    setFpError("");
    if (!fpVerified) { setFpError("Security answer not yet verified."); return; }
    if (fpNewPass.length < 6) { setFpError("Password must be at least 6 characters."); return; }
    if (fpNewPass !== fpConfirm) { setFpError("Passwords do not match."); return; }
    setFpLoading(true);
    try {
      const { error: err } = await supabase.rpc("auth_reset_password", { p_email: fpEmail.trim().toLowerCase(), p_new_password: fpNewPass });
      if (err) throw err;
      setFpStep("done");
    } catch { setFpError("Failed to reset password. Please try again."); }
    setFpLoading(false);
  }
  function resetFp() { setFpStep(null); setFpEmail(""); setFpQuestion(""); setFpAnswer(""); setFpNewPass(""); setFpConfirm(""); setFpError(""); setFpVerified(false); }

  const cardContent = fpStep ? (
    <Card className="p-7 w-full max-w-md" style={{ position: "relative", zIndex: 1, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(14px)", marginTop: "88px" }}>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={resetFp} style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 12, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: THEME.ink, cursor: "pointer" }}>← Back</button>
        <div>
          <div className="text-base font-extrabold" style={{ color: THEME.ink }}>Forgot Password</div>
          <div className="text-xs" style={{ color: "rgba(0,0,0,0.55)" }}>
            {fpStep === "email" && "Step 1 of 3 — Verify your email"}
            {fpStep === "question" && "Step 2 of 3 — Answer your security question"}
            {fpStep === "reset" && "Step 3 of 3 — Set a new password"}
            {fpStep === "done" && "Password reset successful!"}
          </div>
        </div>
      </div>
      {fpStep !== "done" && (
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {["email", "question", "reset"].map((s, i) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 999, background: ["email", "question", "reset"].indexOf(fpStep) >= i ? THEME.gradMain : "rgba(0,0,0,0.10)", transition: "background 0.3s" }} />
          ))}
        </div>
      )}
      {fpStep === "email" && (
        <div className="space-y-4">
          <Input label="Registered Email" value={fpEmail} onChange={setFpEmail} placeholder="Enter your email address" type="email" />
          {fpError && <ErrorBanner msg={fpError} />}
          <PrimaryButton className="w-full inline-flex items-center justify-center gap-2" onClick={handleFpEmailSubmit} disabled={fpLoading}>{fpLoading ? <Spinner size={14} /> : null} Continue</PrimaryButton>
        </div>
      )}
      {fpStep === "question" && fpQuestion && (
        <div className="space-y-4">
          <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="text-xs font-semibold mb-1" style={{ color: "rgba(0,0,0,0.5)" }}>Security Question</div>
            <div className="text-sm font-semibold" style={{ color: THEME.ink }}>{fpQuestion}</div>
          </div>
          <Input label="Your Answer" value={fpAnswer} onChange={setFpAnswer} placeholder="Type your answer" />
          {fpError && <ErrorBanner msg={fpError} />}
          <PrimaryButton className="w-full inline-flex items-center justify-center gap-2" onClick={handleFpAnswerSubmit} disabled={fpLoading}>{fpLoading ? <Spinner size={14} /> : null} Verify Answer</PrimaryButton>
        </div>
      )}
      {fpStep === "reset" && (
        <div className="space-y-4">
          <Input label="New Password" value={fpNewPass} onChange={setFpNewPass} placeholder="Min. 6 characters" type="password" />
          <Input label="Confirm New Password" value={fpConfirm} onChange={setFpConfirm} placeholder="Re-enter new password" type="password" />
          {fpError && <ErrorBanner msg={fpError} />}
          <PrimaryButton className="w-full inline-flex items-center justify-center gap-2" onClick={handleFpResetSubmit} disabled={fpLoading}>{fpLoading ? <Spinner size={14} /> : null} Reset Password</PrimaryButton>
        </div>
      )}
      {fpStep === "done" && (
        <div className="space-y-4 text-center">
          <div style={{ fontSize: 48 }}>✅</div>
          <div className="text-sm font-semibold" style={{ color: THEME.ink }}>Your password has been reset successfully.</div>
          <div className="text-xs" style={{ color: "rgba(0,0,0,0.55)" }}>You can now sign in with your new password.</div>
          <PrimaryButton className="w-full" onClick={resetFp}>Back to Login</PrimaryButton>
        </div>
      )}
    </Card>
  ) : (
    <Card className="p-7 w-full max-w-md" style={{ position: "relative", zIndex: 1, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(14px)", marginTop: "88px" }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="h-12 w-12 rounded-2xl p-1.5 flex-shrink-0" style={{ background: THEME.gradMain }}>
          <img src={LOGO_SRC} alt="BatStateU Logo" onError={(e) => { e.currentTarget.style.display = "none"; }} className="h-full w-full object-contain" />
        </div>
        <div>
          <div className="text-base font-extrabold" style={{ color: THEME.ink }}>PAPs Tracker</div>
          <div className="text-xs" style={{ color: "rgba(0,0,0,0.55)" }}>Batangas State University</div>
        </div>
      </div>
      <div className="text-lg font-extrabold" style={{ color: THEME.ink }}>Account Login</div>
      <div className="text-sm" style={{ color: "rgba(0,0,0,0.65)" }}>Sign in to access your dashboard.</div>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Input label="Email" value={email} onChange={setEmail} placeholder="Your email" type="email" />
        <Input label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
        {error && <ErrorBanner msg={error} />}
        <div className="text-right">
          <button type="button" onClick={() => { setFpStep("email"); setFpEmail(email); setFpError(""); }} className="text-xs font-semibold underline" style={{ color: THEME.red, background: "none", border: "none", cursor: "pointer" }}>Forgot password?</button>
        </div>
        <PrimaryButton type="submit" className="w-full inline-flex items-center justify-center gap-2" disabled={loading}>{loading ? <Spinner size={14} /> : null} Sign In</PrimaryButton>
      </form>
      <div className="mt-4 text-center text-sm" style={{ color: "rgba(0,0,0,0.7)" }}>
        Don't have an account?{" "}<button onClick={onSwitch} className="font-semibold underline" style={{ color: THEME.ink }}>Register here</button>
      </div>
    </Card>
  );

  return (
    <div style={{ position: "fixed", inset: 0, backgroundImage: "url('/bsu.jpg')", backgroundSize: "cover", backgroundPosition: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}><BrandTopBar transparent={true} /></div>
      {cardContent}
    </div>
  );
}

function RegisterPage({ onSwitch }) {
  const [name, setName] = useState(""), [email, setEmail] = useState(""), [password, setPassword] = useState(""), [securityQuestion, setSecurityQuestion] = useState(""), [securityAnswer, setSecurityAnswer] = useState(""), [error, setError] = useState(""), [msg, setMsg] = useState(""), [loading, setLoading] = useState(false);
  async function handleRegister(e) {
    e.preventDefault(); setError(""); setMsg("");
    if (!name.trim()) return setError("Full name is required.");
    const emailVal = email.trim().toLowerCase();
    const allowed = await isEmailAuthorized(emailVal);
    if (!allowed) return setError("This email is not authorized to register. Please contact the administrator.");
    if (!emailVal.includes("@") || !emailVal.includes(".")) return setError("Please enter a valid email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (!securityQuestion) return setError("Please select a security question.");
    if (!securityAnswer.trim()) return setError("Security answer is required.");
    setLoading(true);
    try {
      const { error: err } = await supabase.rpc("auth_register", { p_display_name: name.trim(), p_email: emailVal, p_password: password, p_role: "Instructor", p_security_answer: securityAnswer.trim(), p_security_q: securityQuestion });
      if (err) {
        if (err.message?.includes("EMAIL_TAKEN")) setError("Email is already registered.");
        else if (err.message?.includes("PASSWORD_TOO_SHORT")) setError("Password must be at least 6 characters.");
        else setError(err.message);
        setLoading(false); return;
      }
      setMsg("Registration successful! You can now login.");
      setName(""); setEmail(""); setPassword(""); setSecurityQuestion(""); setSecurityAnswer("");
    } catch (e) { setError(e.message); }
    setLoading(false);
  }
  return (
    <div style={{ position: "fixed", inset: 0, backgroundImage: "url('/bsu.jpg')", backgroundSize: "cover", backgroundPosition: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", overflow: "auto" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}><BrandTopBar transparent={true} /></div>
      <Card className="p-7 w-full max-w-lg" style={{ position: "relative", zIndex: 1, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(14px)", marginTop: "100px", marginBottom: "24px" }}>
        <div className="text-lg font-extrabold" style={{ color: THEME.ink }}>Register Account</div>
        <div className="text-sm" style={{ color: "rgba(0,0,0,0.65)" }}>Create an account to start tracking your PAPs.</div>
        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <Input label="Full name" value={name} onChange={setName} placeholder="Your name" />
          <Input label="Email" value={email} onChange={setEmail} placeholder="Your email" type="email" />
          <Input label="Password" value={password} onChange={setPassword} placeholder="Min. 6 characters" type="password" />
          <div className="space-y-1.5">
            <div className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.65)" }}>Security Question <span style={{ color: THEME.red }}>*</span></div>
            <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5" style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white" }}>
              <select value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)} className="w-full bg-transparent text-sm outline-none" style={{ color: securityQuestion ? THEME.ink : "rgba(0,0,0,0.35)" }}>
                <option value="">Select a security question…</option>
                {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div className="text-xs" style={{ color: "rgba(0,0,0,0.45)" }}>Used to verify your identity if you forget your password.</div>
          </div>
          <Input label="Security Answer *" value={securityAnswer} onChange={setSecurityAnswer} placeholder="Your answer (case-insensitive)" />
          {error && <ErrorBanner msg={error} />}
          {msg && <div className="rounded-2xl px-3 py-2 text-sm" style={{ background: "rgba(252,191,73,0.25)", color: THEME.ink }}>{msg}</div>}
          <PrimaryButton type="submit" className="w-full inline-flex items-center justify-center gap-2" disabled={loading}>{loading ? <Spinner size={14} /> : <UserPlus className="h-4 w-4" />} Register</PrimaryButton>
        </form>
        <div className="mt-4 text-center text-sm" style={{ color: "rgba(0,0,0,0.7)" }}>
          Already have an account?{" "}<button onClick={onSwitch} className="font-semibold underline" style={{ color: THEME.ink }}>Back to login</button>
        </div>
      </Card>
    </div>
  );
}

function Dashboard({ user, token, onLogout }) {
  const [active, setActive] = useState("dashboard"), [sidebarOpen, setSidebarOpen] = useState(true);
  const { paps, loading, error, refetch, add, update, remove } = usePaps(user, token);
  return (
    <div style={{ display: "flex", height: "calc(100vh - 112px)", overflow: "hidden", width: "100vw" }}>
      <div style={{ width: sidebarOpen ? 256 : 0, minWidth: sidebarOpen ? 256 : 0, transition: "width 0.25s ease, min-width 0.25s ease", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ width: 256, height: "100%", overflowY: "auto", padding: "16px 12px 24px" }}>
          <Sidebar active={active} onChange={setActive} user={user} onLogout={onLogout} />
        </div>
      </div>
      <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minWidth: 0, padding: "20px 20px 48px" }}>
        <div>
          <button onClick={() => setSidebarOpen((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, padding: "5px 14px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.10)", background: "rgba(255,255,255,0.95)", fontSize: 12, fontWeight: 600, color: THEME.ink, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>{sidebarOpen ? "◀" : "▶"}</span>
            {sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          </button>
          {active === "dashboard" && <DashboardHome user={user} paps={paps} loading={loading} error={error} update={update} />}
          {active === "paps" && <PapsPage user={user} paps={paps} loading={loading} error={error} add={add} update={update} remove={remove} />}
          {active === "list" && <ListPage user={user} paps={paps} loading={loading} error={error} add={add} update={update} remove={remove} />}
          {active === "authorized" && user.role === "Admin" && <AuthorizedEmailsPage user={user} token={token} />}
        </div>
      </main>
    </div>
  );
}

function Sidebar({ active, onChange, user, onLogout }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "paps", label: "Program, Activities & Projects", icon: ClipboardList },
    { id: "list", label: "List of PAPs", icon: TableProperties },
    // "Authorized Emails" tab is Admin-only
    ...(user.role === "Admin" ? [{ id: "authorized", label: "Authorized Emails", icon: ShieldCheck }] : []),
  ];
  return (
    <div style={{ background: THEME.gradSoft, borderRadius: 24, padding: 16, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ background: "rgba(255,255,255,0.85)", borderRadius: 16, padding: "10px 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: THEME.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.displayName || "Instructor"}</div>
        <div style={{ fontSize: 11, color: "rgba(0,0,0,0.6)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.role || "Instructor"} • {user.email}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((it) => {
          const Icon = it.icon, isActive = active === it.id;
          return (
            <button key={it.id} onClick={() => onChange(it.id)} style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 14, padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, background: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.55)", color: THEME.ink, border: "none", cursor: "pointer", transition: "background 0.15s", width: "100%" }}>
              <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{it.label}</span>
              {isActive && <span style={{ width: 7, height: 7, borderRadius: "50%", background: THEME.orange, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
      <button onClick={onLogout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, padding: "10px 12px", fontSize: 12, fontWeight: 600, background: "rgba(214,40,40,0.12)", color: THEME.red, border: "none", cursor: "pointer", marginTop: 4 }}>
        <LogOut style={{ width: 14, height: 14 }} /> Logout
      </button>
    </div>
  );
}

function AuthorizedEmailsPage({ user, token }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const load = useCallback(async () => {
    setError(""); setMsg(""); setLoading(true);
    try {
      const { data, error: err } = await supabase.rpc("allowlist_list", { p_admin_email: user.email, p_token: token });
      if (err) throw err;
      setEmails(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Failed to load allowlist. Make sure the allowlist RPCs are deployed and your account is Admin.");
    }
    setLoading(false);
  }, [user.email, token]);

  useEffect(() => { load(); }, [load]);

  async function addEmail() {
    setError(""); setMsg("");
    const emailVal = newEmail.trim().toLowerCase();
    if (!emailVal || !emailVal.includes("@") || !emailVal.includes(".")) { setError("Enter a valid email."); return; }
    setSaving(true);
    try {
      const { error: err } = await supabase.rpc("allowlist_add", { p_admin_email: user.email, p_token: token, p_email: emailVal });
      if (err) throw err;
      setNewEmail("");
      setMsg("Authorized email added.");
      await load();
    } catch (e) {
      setError("Failed to add email. (Check Admin rights and that the email isn't already added.)");
    }
    setSaving(false);
  }

  async function removeEmail(email) {
    setError(""); setMsg("");
    setRemoving(email);
    try {
      const { error: err } = await supabase.rpc("allowlist_remove", { p_admin_email: user.email, p_token: token, p_email: email });
      if (err) throw err;
      setMsg("Authorized email removed.");
      await load();
    } catch (e) {
      setError("Failed to remove email.");
    }
    setRemoving(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3" style={{ marginBottom: 16 }}>
        <div>
          <div className="text-xl font-extrabold" style={{ color: THEME.ink }}>Authorized Emails</div>
          <div className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
            Admin-managed allowlist — only emails here can register/login.
          </div>
        </div>
        <button onClick={load} style={{ borderRadius: 14, padding: "9px 12px", fontSize: 12, fontWeight: 700, border: "1px solid rgba(0,0,0,0.10)", background: "rgba(255,255,255,0.95)", cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      <Card className="p-5" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)" }}>
        <div className="text-sm font-bold" style={{ color: THEME.ink, marginBottom: 10 }}>Add email</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
          <Input label="Email address" value={newEmail} onChange={setNewEmail} placeholder="e.g. user@batstate-u.edu.ph" type="email" />
          <PrimaryButton onClick={addEmail} disabled={saving} className="inline-flex items-center justify-center gap-2" style={{ height: 42 }}>
            {saving ? <Spinner size={14} /> : <ShieldCheck style={{ width: 16, height: 16 }} />}
            Add
          </PrimaryButton>
        </div>
        {error && <div style={{ marginTop: 12 }}><ErrorBanner msg={error} /></div>}
        {msg && <div className="rounded-2xl px-3 py-2 text-sm" style={{ marginTop: 12, background: "rgba(252,191,73,0.25)", color: THEME.ink }}>{msg}</div>}
      </Card>

      <div style={{ height: 14 }} />

      <Card className="p-5" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold" style={{ color: THEME.ink }}>Allowlist</div>
          <div className="text-xs" style={{ color: "rgba(0,0,0,0.55)" }}>{loading ? "Loading…" : `${emails.length} email(s)`}</div>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(0,0,0,0.6)" }}><Spinner size={14} /> Loading allowlist…</div>
          ) : emails.length === 0 ? (
            <div className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>No authorized emails found.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {emails.map((row) => (
                <div key={row.email || row} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                     style={{ border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)" }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="text-sm font-semibold" style={{ color: THEME.ink, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.email || row}
                    </div>
                    {row.added_at && (
                      <div className="text-xs" style={{ color: "rgba(0,0,0,0.55)" }}>
                        Added {formatDateTime(new Date(row.added_at).getTime())}{row.added_by ? ` • by ${row.added_by}` : ""}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeEmail(row.email || row)}
                    disabled={removing === (row.email || row)}
                    title="Remove"
                    style={{ borderRadius: 14, padding: "8px 10px", border: "none", background: "rgba(214,40,40,0.12)", color: THEME.red, cursor: "pointer", fontWeight: 800 }}
                  >
                    {removing === (row.email || row) ? <Spinner size={14} /> : <Trash2 style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="mt-4 text-xs" style={{ color: "rgba(0,0,0,0.55)" }}>
        Tip: Add your own Admin email first in the database so you don't lock yourself out.
      </div>
    </div>
  );
}

// ─── CHANGE: DashboardHome now shows ALL paps (not filtered by ownerEmail) ───
// Non-admin users see the full shared pool. The ownerEmail filter is removed
// so every logged-in user gets the same view of the data.
function DashboardHome({ user, paps, loading, error, update }) {
  const [quarterFilter, setQuarterFilter] = useState("all"), [statusFilter, setStatusFilter] = useState("all"), [search, setSearch] = useState("");
  const [completingId, setCompletingId] = useState(null), [evidenceInput, setEvidenceInput] = useState(""), [evidenceError, setEvidenceError] = useState(""), [actionError, setActionError] = useState("");
  const QUARTER_COLS = [{ qk: "q1", ak: "actualQ1", label: "Q1" }, { qk: "q2", ak: "actualQ2", label: "Q2" }, { qk: "q3", ak: "actualQ3", label: "Q3" }, { qk: "q4", ak: "actualQ4", label: "Q4" }];
  const visibleCols = quarterFilter === "all" ? QUARTER_COLS : QUARTER_COLS.filter((c) => c.qk === quarterFilter);
  const filteredPaps = useMemo(() => {
    let list = paps; // all paps from the shared pool
    if (quarterFilter !== "all") list = list.filter((p) => parseNumLoose(p[quarterFilter]) > 0);
    if (statusFilter === "ongoing") list = list.filter((p) => !p.completed);
    if (statusFilter === "accomplished") list = list.filter((p) => p.completed);
    if (search.trim()) { const q = search.trim().toLowerCase(); list = list.filter((p) => [p.title, p.personnelOfficeConcerned, p.performanceIndicator, p.developmentArea, p.outcome, p.strategy].some((x) => (x || "").toLowerCase().includes(q))); }
    return [...list].sort((a, b) => { if (a.completed !== b.completed) return a.completed ? 1 : -1; return (a.updatedAt || a.createdAt || 0) - (b.updatedAt || b.createdAt || 0); });
  }, [paps, quarterFilter, statusFilter, search]);
  const stats = useMemo(() => ({ accomplished: filteredPaps.filter((p) => p.completed), ongoing: filteredPaps.filter((p) => !p.completed) }), [filteredPaps]);
  const grouped = useMemo(() => groupByStrategicContext(filteredPaps), [filteredPaps]);
  const [openGroups, setOpenGroups] = useState({});
  useEffect(() => {
    setOpenGroups((prev) => {
      if (Object.keys(prev).length) return prev;
      const next = {}; grouped.forEach(([k]) => { next[k] = false; }); return next;
    });
  }, [grouped]);
  const areaColors = {
    "Academic Leadership":     { bg: "rgba(214,40,40,0.07)",  border: "rgba(214,40,40,0.22)",  accent: THEME.red,    badge: "#d62828", ring: THEME.red },
    "Research and Innovation": { bg: "rgba(247,127,0,0.07)",  border: "rgba(247,127,0,0.22)",  accent: THEME.orange, badge: "#f77f00", ring: THEME.orange },
    "Social Responsibility":   { bg: "rgba(22,163,74,0.07)",  border: "rgba(22,163,74,0.22)",  accent: "#16a34a",    badge: "#16a34a", ring: "#16a34a" },
    "Internationalization":    { bg: "rgba(37,99,235,0.07)",  border: "rgba(37,99,235,0.22)",  accent: "#2563eb",    badge: "#2563eb", ring: "#2563eb" },
  };
  const toggleGroup = (k) => setOpenGroups((prev) => ({ ...prev, [k]: !(prev?.[k] ?? false) }));
  const setAllGroupsOpen = (open) => setOpenGroups(() => { const next = {}; grouped.forEach(([k]) => { next[k] = open; }); return next; });
  function parseLinks(text) { return text.split(/\n|,|\s+/).map((s) => s.trim()).filter(Boolean); }
  async function handleConfirmComplete(papId) {
    const links = parseLinks(evidenceInput);
    if (links.length === 0) { setEvidenceError("Please provide at least one evidence link."); return; }
    const invalid = links.filter((l) => !isValidUrlLike(l));
    if (invalid.length) { setEvidenceError("Some links are invalid. Use http/https links only."); return; }
    try { await update(papId, { completed: true, completedAt: Date.now(), evidenceLinks: links }); setCompletingId(null); setEvidenceInput(""); setEvidenceError(""); }
    catch (e) { setActionError(e.message); }
  }
  async function handleMarkOngoing(papId) { try { await update(papId, { completed: false, completedAt: null, evidenceLinks: [] }); } catch (e) { setActionError(e.message); } }
  async function handleActualChange(papId, key, val) { try { await update(papId, { [key]: val }); } catch (e) { setActionError(e.message); } }
  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size={28} /></div>;
  return (
    <div className="space-y-5">
      {actionError && <ErrorBanner msg={actionError} onDismiss={() => setActionError("")} />}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="text-2xl font-extrabold" style={{ color: THEME.ink }}>Dashboard</div>
          <div className="text-sm" style={{ color: "rgba(0,0,0,0.65)" }}>Welcome back, {user.displayName}! </div>
        </div>
        <Card className="p-3" style={{ flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.45)", minWidth: 90 }}>Filter by Status:</span>
              <div style={{ display: "flex", gap: 5 }}>
                {[{ id: "all", label: "All", activeBg: "rgba(0,0,0,0.09)", activeColor: THEME.ink, activeBorder: "rgba(0,0,0,0.18)" }, { id: "ongoing", label: "Ongoing", activeBg: "rgba(247,127,0,0.14)", activeColor: THEME.orange, activeBorder: "rgba(247,127,0,0.38)" }, { id: "accomplished", label: "Accomplished", activeBg: "rgba(22,163,74,0.12)", activeColor: "#16a34a", activeBorder: "rgba(22,163,74,0.32)" }].map((s) => (
                  <button key={s.id} onClick={() => setStatusFilter(s.id)} style={{ borderRadius: 999, padding: "4px 14px", fontSize: 11, fontWeight: statusFilter === s.id ? 700 : 600, background: statusFilter === s.id ? s.activeBg : "rgba(0,0,0,0.04)", color: statusFilter === s.id ? s.activeColor : "rgba(0,0,0,0.40)", border: statusFilter === s.id ? `1px solid ${s.activeBorder}` : "1px solid transparent", cursor: "pointer" }}>{s.label}</button>
                ))}
              </div>
            </div>
            <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.45)", minWidth: 90 }}>Filter by Quarter:</span>
              <div style={{ display: "flex", gap: 5 }}>
                {[{ id: "all", label: "All Quarters" }, { id: "q1", label: "Q1" }, { id: "q2", label: "Q2" }, { id: "q3", label: "Q3" }, { id: "q4", label: "Q4" }].map((q) => (
                  <button key={q.id} onClick={() => setQuarterFilter(q.id)} style={{ borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 600, background: quarterFilter === q.id ? THEME.gradMain : "rgba(0,0,0,0.04)", color: quarterFilter === q.id ? "#fff" : "rgba(0,0,0,0.40)", border: "none", cursor: "pointer" }}>{q.label}</button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[{ label: "Total Projects", val: filteredPaps.length, icon: ClipboardList, bg: "rgba(214,40,40,0.15)", c: THEME.red }, { label: "Ongoing", val: stats.ongoing.length, icon: LayoutDashboard, bg: "rgba(247,127,0,0.15)", c: THEME.orange }, { label: "Accomplished", val: stats.accomplished.length, icon: CheckCircle2, bg: "rgba(252,191,73,0.25)", c: THEME.yellow }].map((s) => (
          <Card key={s.label} className="p-5" style={{ background: THEME.gradSoft }}>
            <div className="flex items-center justify-between">
              <div><div className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.6)" }}>{s.label}</div><div className="mt-1 text-3xl font-extrabold" style={{ color: THEME.ink }}>{s.val}</div></div>
              <div className="rounded-2xl p-3" style={{ background: s.bg }}><s.icon className="h-6 w-6" style={{ color: s.c }} /></div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-4"><Input value={search} onChange={setSearch} placeholder="Search projects by title, office, or performance indicator…" icon={Search} /></Card>
      {quarterFilter !== "all" && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 16, padding: "6px 14px", background: "rgba(214,40,40,0.08)", color: THEME.red, fontSize: 12, fontWeight: 600 }}>
          <Filter style={{ width: 14, height: 14 }} /> Showing {quarterFilter.toUpperCase()} projects
          <button onClick={() => setQuarterFilter("all")} style={{ marginLeft: 4, borderRadius: 999, padding: "2px 8px", background: "rgba(214,40,40,0.15)", color: THEME.red, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Clear</button>
        </div>
      )}
      <div className="space-y-4">
        {filteredPaps.length === 0 ? (
          <Card className="p-10"><div className="text-center text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>{search.trim() ? "No projects match your search." : quarterFilter !== "all" ? `No projects with ${quarterFilter.toUpperCase()} targets found.` : "No projects yet. Head to 'Program, Activities & Projects' to create one!"}</div></Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2" style={{ padding: "4px 2px" }}>
              <div className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.55)" }}>Grouped by Strategic Context • {grouped.length} group{grouped.length !== 1 ? "s" : ""}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setAllGroupsOpen(true)} style={{ borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: THEME.ink, border: "none", cursor: "pointer" }}>Expand all</button>
                <button type="button" onClick={() => setAllGroupsOpen(false)} style={{ borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: THEME.ink, border: "none", cursor: "pointer" }}>Collapse all</button>
              </div>
            </div>
            {grouped.map(([key, group]) => {
              const isUngrouped = key === "__ungrouped__";
              const colors = areaColors[group.developmentArea] || { bg: "rgba(0,0,0,0.04)", border: "rgba(0,0,0,0.13)", accent: THEME.ink, badge: THEME.ink };
              const isOpen = openGroups?.[key] ?? true;
              return (
                <div key={key} style={{ borderRadius: 20, border: `1.5px solid ${colors.border}`, overflow: "hidden" }}>
                  <button type="button" onClick={() => toggleGroup(key)} style={{ width: "100%", textAlign: "left", background: colors.bg, border: "none", padding: "14px 18px", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ flexShrink: 0, color: "rgba(0,0,0,0.45)", transition: "transform 0.2s", transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}><ChevronDown className="h-4 w-4" /></div>
                      {!isOpen && !isUngrouped && (() => {
                        const groupTotalTarget = group.items.reduce((s, p) => s + sumQuarterlyTargets(p), 0);
                        const groupTotalActual = group.items.reduce((s, p) => s + parseNumLoose(p.actualQ1) + parseNumLoose(p.actualQ2) + parseNumLoose(p.actualQ3) + parseNumLoose(p.actualQ4), 0);
                        const groupPct = groupTotalTarget > 0 ? Math.min(100, Math.round((groupTotalActual / groupTotalTarget) * 100)) : 0;
                        return <ProgressRing pct={groupPct} size={54} stroke={5} color={groupPct >= 100 ? "#16a34a" : colors.ring} bg="rgba(0,0,0,0.08)" />;
                      })()}
                      {!isUngrouped ? (
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", borderRadius: 999, padding: "2px 10px", background: colors.badge, color: "#fff", display: "inline-block", marginBottom: 5 }}>{group.developmentArea}</span>
                          <div style={{ fontSize: 12, color: "rgba(0,0,0,0.65)", marginBottom: 3, lineHeight: 1.4 }}><span style={{ fontWeight: 600, color: "rgba(0,0,0,0.40)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.04em" }}>Outcome: </span><span style={{ fontWeight: 700, color: "rgba(0,0,0,0.80)" }}>{group.outcome}</span></div>
                          <div style={{ fontSize: 12.5, lineHeight: 1.45 }}><span style={{ fontWeight: 600, color: "rgba(0,0,0,0.40)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.04em" }}>Strategy: </span><span style={{ fontWeight: 600, fontStyle: "italic", color: colors.accent }}>{group.strategy}</span></div>
                        </div>
                      ) : (
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 800, color: "rgba(0,0,0,0.55)" }}>⚠ Ungrouped PAPs — No strategic context assigned</div>
                      )}
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
                        {!isOpen && !isUngrouped && (() => {
                          const gT = group.items.reduce((s, p) => s + sumQuarterlyTargets(p), 0);
                          const gA = group.items.reduce((s, p) => s + parseNumLoose(p.actualQ1) + parseNumLoose(p.actualQ2) + parseNumLoose(p.actualQ3) + parseNumLoose(p.actualQ4), 0);
                          const gPct = gT > 0 ? Math.min(100, Math.round((gA / gT) * 100)) : 0;
                          return gT > 0 ? <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 10px", background: gPct >= 100 ? "rgba(22,163,74,0.12)" : "rgba(0,0,0,0.06)", color: gPct >= 100 ? "#16a34a" : "rgba(0,0,0,0.55)" }}>{gA}/{gT}</span> : null;
                        })()}
                        <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 10px", background: "rgba(247,127,0,0.15)", color: THEME.orange }}>{group.items.filter(p => !p.completed).length} ongoing</span>
                        <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 10px", background: "rgba(22,163,74,0.12)", color: "#16a34a" }}>{group.items.filter(p => p.completed).length} done</span>
                        <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 10px", background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)" }}>{group.items.length} total</span>
                      </div>
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
                        <div className="space-y-4 p-4">
                          {group.items.map((p) => {
                            const totalTarget = sumQuarterlyTargets(p), totalActual = parseNumLoose(p.actualQ1) + parseNumLoose(p.actualQ2) + parseNumLoose(p.actualQ3) + parseNumLoose(p.actualQ4);
                            const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalActual / totalTarget) * 100)) : 0, overallMet = totalActual >= totalTarget && totalTarget > 0;
                            return (
                              <Card key={p.id} className="p-5 lg:p-6" style={{ background: THEME.gradSoft }}>
                                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <span className="text-base font-extrabold" style={{ color: THEME.ink }}>{p.title}</span>
                                      <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 10px", background: p.completed ? "rgba(252,191,73,0.22)" : "rgba(0,0,0,0.06)", color: p.completed ? "#92400e" : THEME.ink }}>{p.completed ? "Accomplished" : "Ongoing"}</span>
                                    </div>
                                    <div className="text-xs" style={{ color: "rgba(0,0,0,0.55)" }}>{p.personnelOfficeConcerned || "—"} • Updated {formatDateTime(p.updatedAt || p.createdAt)}</div>
                                    {p.performanceIndicator && (
                                      <div style={{ marginTop: 8, borderRadius: 10, padding: "7px 10px", background: "#fff", border: "1px solid rgba(0,0,0,0.06)" }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Performance Indicator</div>
                                        <div style={{ fontSize: 12, color: "rgba(0,0,0,0.72)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{p.performanceIndicator}</div>
                                      </div>
                                    )}
                                  </div>
                                  {quarterFilter === "all" && totalTarget > 0 && (
                                    <div style={{ flexShrink: 0, textAlign: "center", background: overallMet ? "rgba(22,163,74,0.10)" : THEME.gradSoft, borderRadius: 16, padding: "8px 16px", border: overallMet ? "1px solid rgba(22,163,74,0.25)" : "1px solid rgba(0,0,0,0.06)" }}>
                                      <div style={{ fontSize: 22, fontWeight: 900, color: overallMet ? "#16a34a" : THEME.ink, lineHeight: 1 }}>{overallPct}%</div>
                                      <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(0,0,0,0.5)", marginTop: 2 }}>Overall</div>
                                    </div>
                                  )}
                                </div>
                                {quarterFilter === "all" && totalTarget > 0 && (
                                  <div className="mb-4">
                                    <div className="h-2 w-full rounded-full" style={{ background: "rgba(0,0,0,0.07)" }}><div className="h-2 rounded-full transition-all" style={{ width: `${overallPct}%`, background: overallMet ? "#16a34a" : THEME.gradMain }} /></div>
                                    <div className="flex justify-between mt-1 text-xs" style={{ color: "rgba(0,0,0,0.5)" }}>
                                      <span>Actual: <strong>{totalActual}</strong></span>
                                      <span>Target: <strong>{totalTarget}</strong></span>
                                      <span style={{ fontWeight: 700, color: overallMet ? "#16a34a" : THEME.red }}>{overallMet ? "✓ Target met" : `Remaining: ${totalTarget - totalActual}`}</span>
                                    </div>
                                  </div>
                                )}
                                <div style={{ display: "grid", gridTemplateColumns: `repeat(${visibleCols.length}, 1fr)`, gap: 10 }}>
                                  {visibleCols.map(({ qk, ak, label }) => {
                                    const target = parseNumLoose(p[qk]), actual = parseNumLoose(p[ak]);
                                    const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
                                    const isMet = actual >= target && target > 0, remaining = Math.max(0, target - actual);
                                    return (
                                      <div key={qk} style={{ borderRadius: 16, padding: "12px 14px", background: isMet ? "rgba(22,163,74,0.06)" : "#fff", border: isMet ? "1px solid rgba(22,163,74,0.20)" : "1px solid rgba(0,0,0,0.10)" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                          <span style={{ fontSize: 13, fontWeight: 800, color: THEME.ink }}>{label}</span>
                                          {target > 0 && <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 8px", background: isMet ? "rgba(22,163,74,0.15)" : "rgba(0,0,0,0.07)", color: isMet ? "#16a34a" : "rgba(0,0,0,0.55)" }}>{pct}%</span>}
                                        </div>
                                        {target > 0 && <div style={{ height: 6, borderRadius: 999, background: "rgba(0,0,0,0.08)", marginBottom: 8 }}><div style={{ height: 6, borderRadius: 999, width: `${pct}%`, background: isMet ? "#16a34a" : THEME.gradMain, transition: "width 0.4s ease" }} /></div>}
                                        <div style={{ display: "flex", gap: 8, marginBottom: 10, fontSize: 11 }}>
                                          <div style={{ flex: 1 }}><div style={{ color: "rgba(0,0,0,0.45)", fontWeight: 600, marginBottom: 1 }}>Target</div><div style={{ fontWeight: 800, color: THEME.ink }}>{target > 0 ? target : "—"}</div></div>
                                          <div style={{ flex: 1 }}><div style={{ color: "rgba(0,0,0,0.45)", fontWeight: 600, marginBottom: 1 }}>Actual</div><div style={{ fontWeight: 800, color: actual > 0 ? (isMet ? "#16a34a" : THEME.orange) : "rgba(0,0,0,0.3)" }}>{actual > 0 ? actual : "—"}</div></div>
                                          <div style={{ flex: 1 }}><div style={{ color: "rgba(0,0,0,0.45)", fontWeight: 600, marginBottom: 1 }}>Rem.</div><div style={{ fontWeight: 800, color: remaining > 0 ? THEME.red : "#16a34a" }}>{target > 0 ? (remaining > 0 ? remaining : "✓") : "—"}</div></div>
                                        </div>
                                        {!p.completed && (
                                          <div>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.45)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Update {label} actual</div>
                                            <input type="number" min="0" value={p[ak] ?? ""} onChange={(e) => handleActualChange(p.id, ak, e.target.value)} placeholder="0"
                                              style={{ width: "100%", borderRadius: 12, padding: "6px 10px", fontSize: 13, fontWeight: 700, border: "1px solid rgba(0,0,0,0.13)", background: "white", color: THEME.ink, outline: "none", boxSizing: "border-box" }}
                                              onFocus={(e) => (e.target.style.borderColor = THEME.orange)} onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.13)")} />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                                  {!p.completed ? (
                                    <>
                                      <button onClick={() => { setCompletingId(p.id); setEvidenceInput(""); setEvidenceError(""); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 12, padding: "7px 16px", fontSize: 12, fontWeight: 700, background: THEME.gradMain, color: "#fff", border: "none", cursor: "pointer" }}>
                                        <CheckCircle2 style={{ width: 14, height: 14 }} /> Mark Completed
                                      </button>
                                      {completingId === p.id && (
                                        <div style={{ flex: 1, minWidth: 260, borderRadius: 14, padding: "12px 14px", background: "rgba(214,40,40,0.04)", border: "1px solid rgba(214,40,40,0.15)" }}>
                                          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.red, marginBottom: 6 }}>Evidence link(s) required</div>
                                          <textarea value={evidenceInput} onChange={(e) => { setEvidenceInput(e.target.value); setEvidenceError(""); }} placeholder={"Paste one or more https:// links.\nSeparate by new lines, spaces, or commas."} rows={3}
                                            style={{ width: "100%", borderRadius: 10, padding: "7px 10px", fontSize: 12, border: evidenceError ? "1px solid rgba(214,40,40,0.5)" : "1px solid rgba(0,0,0,0.13)", background: "white", color: THEME.ink, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                                          {evidenceError && <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11, fontWeight: 600, color: THEME.red }}><AlertTriangle style={{ width: 12, height: 12 }} />{evidenceError}</div>}
                                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                            <button onClick={() => handleConfirmComplete(p.id)} style={{ flex: 1, borderRadius: 10, padding: "7px 12px", fontSize: 12, fontWeight: 700, background: THEME.gradMain, color: "#fff", border: "none", cursor: "pointer" }}>Confirm Completion</button>
                                            <button onClick={() => { setCompletingId(null); setEvidenceInput(""); setEvidenceError(""); }} style={{ borderRadius: 10, padding: "7px 12px", fontSize: 12, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: THEME.ink, border: "none", cursor: "pointer" }}>Cancel</button>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => handleMarkOngoing(p.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 12, padding: "7px 16px", fontSize: 12, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: THEME.ink, border: "none", cursor: "pointer" }}>
                                        <ClipboardList style={{ width: 14, height: 14 }} /> Mark Ongoing
                                      </button>
                                      {p.evidenceLinks?.length > 0 && (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                                          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.45)" }}>Evidence:</span>
                                          {p.evidenceLinks.map((link, idx) => (
                                            <a key={idx} href={link} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600, background: "rgba(0,0,0,0.05)", color: THEME.ink, textDecoration: "none" }}>
                                              <LinkIcon style={{ width: 11, height: 11 }} /> Link {idx + 1}
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

const PAPS_QUARTER_COLS = [{ tk: "q1", ak: "actualQ1", label: "Q1" }, { tk: "q2", ak: "actualQ2", label: "Q2" }, { tk: "q3", ak: "actualQ3", label: "Q3" }, { tk: "q4", ak: "actualQ4", label: "Q4" }];

function InlineAddPapForm({ user, add, prefill, onSuccess }) {
  const [title, setTitle] = useState(""), [performanceIndicator, setPerformanceIndicator] = useState(""), [personnelOfficeConcerned, setPersonnelOfficeConcerned] = useState("");
  const [q1, setQ1] = useState(""), [q2, setQ2] = useState(""), [q3, setQ3] = useState(""), [q4, setQ4] = useState("");
  const [totalEstimatedCost, setTotalEstimatedCost] = useState(""), [fundSource, setFundSource] = useState(""), [risks, setRisks] = useState(""), [probability, setProbability] = useState(""), [severity, setSeverity] = useState(""), [riskExposure, setRiskExposure] = useState("Low"), [mitigatingActivities, setMitigatingActivities] = useState("");
  const [formError, setFormError] = useState(""), [formLoading, setFormLoading] = useState(false);
  const targetSum = useMemo(() => parseNumLoose(q1) + parseNumLoose(q2) + parseNumLoose(q3) + parseNumLoose(q4), [q1, q2, q3, q4]);
  async function handleSubmit() {
    setFormError("");
    if (!title.trim()) return setFormError("Title is required.");
    if (!personnelOfficeConcerned.trim()) return setFormError("Personnel/Office concerned is required.");
    if (!performanceIndicator.trim()) return setFormError("Performance indicator is required.");
    setFormLoading(true);
    try {
      // ownerEmail is intentionally omitted here — usePaps.add() will inject sharedOwnerEmail
      await add({ ownerEmail: user.email, title: title.trim(), performanceIndicator: performanceIndicator.trim(), personnelOfficeConcerned: personnelOfficeConcerned.trim(), developmentArea: prefill.developmentArea || "", outcome: prefill.outcome || "", strategy: prefill.strategy || "", q1: q1.trim(), q2: q2.trim(), q3: q3.trim(), q4: q4.trim(), actualQ1: "", actualQ2: "", actualQ3: "", actualQ4: "", totalEstimatedCost: parseNumberSafe(totalEstimatedCost), fundSource: fundSource.trim(), risks: risks.trim(), probability, severity, riskExposure, mitigatingActivities: mitigatingActivities.trim(), completed: false, completedAt: null, evidenceLinks: [] });
      setTitle(""); setPerformanceIndicator(""); setPersonnelOfficeConcerned(""); setQ1(""); setQ2(""); setQ3(""); setQ4(""); setTotalEstimatedCost(""); setFundSource(""); setRisks(""); setProbability(""); setSeverity(""); setRiskExposure("Low"); setMitigatingActivities("");
      if (onSuccess) onSuccess();
    } catch (e) { setFormError(e.message); }
    setFormLoading(false);
  }
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ borderRadius: 20, padding: 20, background: "rgba(214,40,40,0.03)", border: "1.5px dashed rgba(214,40,40,0.22)", marginTop: 4 }}>
      <div className="text-sm font-bold mb-4" style={{ color: THEME.red }}>New Program, Activity or Project</div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Title (required)" value={title} onChange={setTitle} />
        <Input label="Personnel/Office Concerned (required)" value={personnelOfficeConcerned} onChange={setPersonnelOfficeConcerned} />
        <div className="md:col-span-2 grid gap-4 md:grid-cols-[200px_1fr]">
          <div style={{ borderRadius: 16, padding: "12px 14px", background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="text-xs font-semibold mb-1" style={{ color: "rgba(0,0,0,0.55)" }}>Quarterly Targets Sum</div>
            <div className="text-3xl font-extrabold" style={{ color: THEME.ink, lineHeight: 1 }}>{targetSum}</div>
            <div className="text-xs mt-1" style={{ color: "rgba(0,0,0,0.4)" }}>Auto-calculated from Q1–Q4</div>
          </div>
          <Textarea label="Performance Indicator (required)" value={performanceIndicator} onChange={setPerformanceIndicator} placeholder="Describe how success will be measured" rows={2} />
        </div>
        <Input label="Q1 Target" value={q1} onChange={setQ1} placeholder="Target number" />
        <Input label="Q2 Target" value={q2} onChange={setQ2} placeholder="Target number" />
        <Input label="Q3 Target" value={q3} onChange={setQ3} placeholder="Target number" />
        <Input label="Q4 Target" value={q4} onChange={setQ4} placeholder="Target number" />
        <Input label="Total Estimated Cost (PHP)" value={totalEstimatedCost} onChange={setTotalEstimatedCost} hint="Numbers only. Commas allowed." />
        <Input label="Fund Source" value={fundSource} onChange={setFundSource} />
        <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
          <Textarea label="Risks" value={risks} onChange={setRisks} placeholder="List possible risks" rows={3} />
          <Textarea label="Mitigating Activities" value={mitigatingActivities} onChange={setMitigatingActivities} placeholder="How will you reduce/avoid the risk?" rows={3} />
        </div>
        <div className="md:col-span-2">
          <div className="text-sm font-semibold mb-3" style={{ color: "rgba(0,0,0,0.75)" }}>Risk Assessment</div>
          <div className="grid gap-4 md:grid-cols-3">
            {[{ label: "Probability", val: probability, set: setProbability, opts: ["Rare (1)", "Unlikely (2)", "Possible (3)", "Probable (4)", "Almost Certain (5)"] }, { label: "Severity", val: severity, set: setSeverity, opts: ["Insignificant (1)", "Minor (2)", "Major (3)", "Critical (4)", "Catastrophic (5)"] }].map((s) => (
              <div key={s.label} className="space-y-1.5">
                <div className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.65)" }}>{s.label}</div>
                <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5" style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white" }}>
                  <select value={s.val} onChange={(e) => s.set(e.target.value)} className="w-full bg-transparent text-sm font-semibold outline-none" style={{ color: THEME.ink }}>
                    <option value="">Select {s.label.toLowerCase()}</option>
                    {s.opts.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            ))}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.65)" }}>Risk Exposure</div>
              <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5" style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white" }}>
                <select value={riskExposure} onChange={(e) => setRiskExposure(e.target.value)} className="w-full bg-transparent text-sm font-semibold outline-none" style={{ color: THEME.ink }}>
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        {formError && <div className="md:col-span-2"><ErrorBanner msg={formError} /></div>}
        <div className="md:col-span-2 flex gap-3 justify-end">
          {onSuccess && <GhostButton onClick={onSuccess}>Cancel</GhostButton>}
          <PrimaryButton onClick={handleSubmit} disabled={formLoading} className="inline-flex items-center gap-2">{formLoading ? <Spinner size={14} /> : <Plus className="h-4 w-4" />} Add PAP</PrimaryButton>
        </div>
      </div>
    </motion.div>
  );
}

function StrategicGroupSection({ groupKey, group, user, add, update, remove, quarterFilter, onEdit, onEditGroup, onDeleteGroup }) {
  const [collapsed, setCollapsed] = useState(false), [showAddForm, setShowAddForm] = useState(false);
  const [completePap, setCompletePap] = useState(null), [evidenceInput, setEvidenceInput] = useState(""), [evidenceError, setEvidenceError] = useState(""), [actionError, setActionError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null), [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);
  const { paps, developmentArea, outcome, strategy } = group;
  const isUngrouped = groupKey === "__ungrouped__";
  const PAPS_QC = quarterFilter === "all" ? PAPS_QUARTER_COLS : PAPS_QUARTER_COLS.filter((q) => q.tk === quarterFilter);
  const accomplishedCount = paps.filter((p) => p.completed).length, ongoingCount = paps.filter((p) => !p.completed).length;
  function parseLinks(text) { return text.split(/\n|,|\s+/).map((s) => s.trim()).filter(Boolean); }
  async function confirmComplete() {
    const links = parseLinks(evidenceInput);
    if (links.length === 0) return setEvidenceError("Please provide at least one evidence link.");
    const invalid = links.filter((l) => !isValidUrlLike(l));
    if (invalid.length) return setEvidenceError("Some links are invalid. Use http/https links only.");
    try { await update(completePap.id, { completed: true, completedAt: Date.now(), evidenceLinks: links }); setCompletePap(null); setEvidenceInput(""); setEvidenceError(""); }
    catch (e) { setActionError(e.message); }
  }
  async function handleDeletePap(id) { setDeleteLoading(id); try { await remove(id); } catch (e) { setActionError(e.message); } setDeleteLoading(null); }
  const areaColors = {
    "Academic Leadership":       { bg: "rgba(214,40,40,0.08)",  border: "rgba(214,40,40,0.22)",  accent: THEME.red,    light: "rgba(214,40,40,0.06)"  },
    "Research and Innovation":   { bg: "rgba(247,127,0,0.08)",  border: "rgba(247,127,0,0.22)",  accent: THEME.orange, light: "rgba(247,127,0,0.05)"  },
    "Social Responsibility":     { bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.22)",  accent: "#16a34a",    light: "rgba(22,163,74,0.05)"  },
    "Internationalization":      { bg: "rgba(37,99,235,0.08)",  border: "rgba(37,99,235,0.22)",  accent: "#2563eb",    light: "rgba(37,99,235,0.05)"  },
  };
  const colors = areaColors[developmentArea] || { bg: "rgba(0,0,0,0.05)", border: "rgba(0,0,0,0.14)", accent: THEME.ink, light: "rgba(0,0,0,0.03)" };
  return (
    <div style={{ borderRadius: 20, border: `1.5px solid ${colors.border}`, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ background: colors.bg, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12, userSelect: "none" }}>
        <button onClick={() => setCollapsed((v) => !v)} style={{ marginTop: 2, flexShrink: 0, color: colors.accent, background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
        </button>
        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setCollapsed((v) => !v)}>
          {!isUngrouped ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", borderRadius: 999, padding: "2px 10px", background: colors.accent, color: "#fff" }}>{developmentArea}</span>
              </div>
              {outcome && <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.75)", marginBottom: 2 }}><span style={{ color: "rgba(0,0,0,0.4)", fontWeight: 600 }}>Outcome: </span>{outcome}</div>}
              {strategy && <div style={{ fontSize: 11, color: "rgba(0,0,0,0.6)", lineHeight: 1.5 }}><span style={{ fontWeight: 600 }}>Strategy: </span><span style={{ fontWeight: 700, fontStyle: "italic", color: colors.accent }}>{strategy}</span></div>}
            </>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.55)" }}>⚠ Ungrouped PAPs — No strategic context assigned</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 10px", background: "rgba(247,127,0,0.15)", color: THEME.orange }}>{ongoingCount} ongoing</span>
          <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 10px", background: "rgba(22,163,74,0.12)", color: "#16a34a" }}>{accomplishedCount} done</span>
          <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "3px 10px", background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)" }}>{paps.length} total</span>
          {!isUngrouped && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onEditGroup({ developmentArea, outcome, strategy, groupKey }); }} title="Edit this strategic context group" style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 10, padding: "5px 12px", fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.75)", color: colors.accent, border: `1px solid ${colors.border}`, cursor: "pointer", transition: "background 0.15s" }}>
                <Pencil size={12} /> Edit Group
              </button>
              {!confirmDeleteGroup ? (
                <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteGroup(true); }} title="Delete this group" style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 10, padding: "5px 12px", fontSize: 11, fontWeight: 700, background: "rgba(214,40,40,0.10)", color: THEME.red, border: "1px solid rgba(214,40,40,0.22)", cursor: "pointer" }}>
                  <Trash2 size={12} /> Delete Group
                </button>
              ) : (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 12, padding: "5px 10px", background: "rgba(214,40,40,0.10)", border: "1px solid rgba(214,40,40,0.30)" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: THEME.red }}>{paps.length > 0 ? `Delete group + ${paps.length} PAP${paps.length !== 1 ? "s" : ""}?` : "Delete empty group?"}</span>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteGroup(groupKey, paps); setConfirmDeleteGroup(false); }} style={{ borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 800, background: THEME.red, color: "#fff", border: "none", cursor: "pointer" }}>Yes, delete</button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteGroup(false); }} style={{ borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 700, background: "rgba(0,0,0,0.08)", color: THEME.ink, border: "none", cursor: "pointer" }}>Cancel</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 18px 18px", background: "#fff" }}>
              {actionError && <div className="mt-4"><ErrorBanner msg={actionError} onDismiss={() => setActionError("")} /></div>}
              {paps.length === 0 && !showAddForm ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "rgba(0,0,0,0.4)", fontSize: 13 }}>No PAPs in this group yet. Click "Add PAP" to create one.</div>
              ) : (
                <div className="space-y-4 mt-4">
                  {paps.map((p) => {
                    const statusPill = p.completed ? { tone: "ok", label: "Accomplished" } : { tone: "neutral", label: "Ongoing" };
                    const riskTone = p.riskExposure === "High" ? "warn" : p.riskExposure === "Medium" ? "info" : "ok";
                    const totalTarget = sumQuarterlyTargets(p);
                    return (
                      <div key={p.id} style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)", padding: "18px 20px", background: colors.light }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: THEME.ink, lineHeight: 1.35 }}>{p.title}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                              <Pill tone={statusPill.tone}>{statusPill.label}</Pill>
                              {quarterFilter === "all" ? <Pill tone="info">Total Target: {totalTarget}</Pill> : <Pill tone="info">{quarterFilter.toUpperCase()} Target: {parseNumLoose(p[quarterFilter]) || "—"}</Pill>}
                              <Pill tone={riskTone}>Risk: {p.riskExposure || "—"}</Pill>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
                            {!p.completed ? (
                              <>
                                <PrimaryButton onClick={() => { setCompletePap(p); setEvidenceInput(""); setEvidenceError(""); }} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Mark Completed</PrimaryButton>
                                <GhostButton onClick={() => onEdit(p)} className="inline-flex items-center gap-2"><Edit className="h-4 w-4" /> Edit</GhostButton>
                              </>
                            ) : (
                              <GhostButton onClick={() => update(p.id, { completed: false, completedAt: null, evidenceLinks: [] })} className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Mark Ongoing</GhostButton>
                            )}
                            <button onClick={() => handleDeletePap(p.id)} disabled={deleteLoading === p.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 14, padding: "8px 14px", fontSize: 13, fontWeight: 600, background: "rgba(214,40,40,0.10)", color: THEME.red, border: "none", cursor: "pointer" }}>
                              {deleteLoading === p.id ? <Spinner size={14} /> : <Trash2 className="h-4 w-4" />} Delete
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 text-sm" style={{ color: "rgba(0,0,0,0.72)" }}><span className="font-semibold">Office:</span> {p.personnelOfficeConcerned || "—"}</div>
                        <div className="mt-2 rounded-xl p-3" style={{ background: "rgba(0,0,0,0.03)" }}>
                          <div className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.6)" }}>Performance Indicator</div>
                          <div className="mt-1 text-sm" style={{ color: "rgba(0,0,0,0.78)", whiteSpace: "pre-wrap" }}>{p.performanceIndicator || "—"}</div>
                        </div>
                        <div className="mt-3" style={{ display: "grid", gridTemplateColumns: `repeat(${PAPS_QC.length}, 1fr)`, gap: 10 }}>
                          {PAPS_QC.map((q) => {
                            const target = parseNumLoose(p[q.tk]);
                            return (
                              <div key={q.tk} style={{ borderRadius: 12, padding: "10px 14px", background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.07)" }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: THEME.ink, marginBottom: 4 }}>{q.label}</div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                  <span style={{ color: "rgba(0,0,0,0.5)", fontWeight: 600 }}>Target</span>
                                  <span style={{ fontWeight: 800, color: THEME.ink }}>{target > 0 ? target : "—"}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                          <div style={{ borderRadius: 10, padding: "8px 12px", background: "rgba(0,0,0,0.03)" }}><div className="text-xs font-semibold">Total Estimated Cost</div><div className="text-sm" style={{ color: "rgba(0,0,0,0.75)" }}>{formatCurrencyPHP(p.totalEstimatedCost || 0)}</div></div>
                          <div style={{ borderRadius: 10, padding: "8px 12px", background: "rgba(0,0,0,0.03)" }}><div className="text-xs font-semibold">Fund Source</div><div className="text-sm" style={{ color: "rgba(0,0,0,0.75)" }}>{p.fundSource || "—"}</div></div>
                          <div style={{ borderRadius: 10, padding: "8px 12px", background: "rgba(0,0,0,0.03)" }}><div className="text-xs font-semibold">Risk Assessment</div><div className="text-sm" style={{ color: "rgba(0,0,0,0.75)" }}>{p.probability || "—"} / {p.severity || "—"}</div></div>
                        </div>
                        <div className="mt-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div style={{ borderRadius: 10, padding: "8px 12px", background: "rgba(0,0,0,0.03)" }}><div className="text-xs font-semibold">Risks</div><div className="text-sm" style={{ color: "rgba(0,0,0,0.75)", whiteSpace: "pre-wrap" }}>{p.risks || "—"}</div></div>
                          <div style={{ borderRadius: 10, padding: "8px 12px", background: "rgba(0,0,0,0.03)" }}><div className="text-xs font-semibold">Mitigating Activities</div><div className="text-sm" style={{ color: "rgba(0,0,0,0.75)", whiteSpace: "pre-wrap" }}>{p.mitigatingActivities || "—"}</div></div>
                        </div>
                        {p.completed && p.evidenceLinks?.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.6)" }}>Evidence links</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {p.evidenceLinks.map((link, idx) => (
                                <a key={idx} href={link} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600, background: "rgba(0,0,0,0.05)", color: THEME.ink, textDecoration: "none" }}>
                                  <LinkIcon style={{ width: 11, height: 11 }} /> Evidence {idx + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <AnimatePresence>{showAddForm && <InlineAddPapForm user={user} add={add} prefill={{ developmentArea, outcome, strategy }} onSuccess={() => setShowAddForm(false)} />}</AnimatePresence>
              {!showAddForm && (
                <button onClick={() => setShowAddForm(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14, borderRadius: 14, padding: "9px 18px", fontSize: 13, fontWeight: 700, background: colors.bg, color: colors.accent, border: `1.5px dashed ${colors.border}`, cursor: "pointer", transition: "all 0.15s" }}>
                  <Plus size={16} /> Add PAP to this group
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {completePap && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0" onClick={() => setCompletePap(null)} style={{ background: "rgba(0,0,0,0.35)" }} />
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.2 }} className="relative w-full max-w-xl">
              <Card className="p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-extrabold" style={{ color: THEME.ink }}>Complete item (Evidence required)</div>
                    <div className="mt-1 text-sm" style={{ color: "rgba(0,0,0,0.65)" }}>Item: <span className="font-semibold" style={{ color: THEME.ink }}>{completePap.title}</span></div>
                  </div>
                  <button onClick={() => setCompletePap(null)} style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 14, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: THEME.ink, cursor: "pointer" }}>Close</button>
                </div>
                <div className="mt-5">
                  <Textarea label="Evidence link(s) (required)" value={evidenceInput} onChange={(v) => { setEvidenceInput(v); setEvidenceError(""); }} placeholder={`Paste one or more links.\nExample:\nhttps://drive.google.com/...`} rows={4} />
                  {evidenceError ? <div className="mt-2 flex items-center gap-1 text-xs font-medium" style={{ color: THEME.red }}><AlertTriangle className="h-3.5 w-3.5" />{evidenceError}</div>
                    : <div className="mt-2 text-xs" style={{ color: "rgba(0,0,0,0.55)" }}>Tip: Separate links by new lines, spaces, or commas.</div>}
                </div>
                <div className="mt-6 flex gap-2 justify-end">
                  <GhostButton onClick={() => setCompletePap(null)}>Cancel</GhostButton>
                  <PrimaryButton onClick={confirmComplete} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Confirm Completion</PrimaryButton>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CHANGE: PapsPage — removed ownerEmail filter, uses full shared paps pool ─
function PapsPage({ user, paps, loading, error: loadError, add, update, remove }) {
  const [query, setQuery] = useState(""), [filter, setFilter] = useState("all"), [quarterFilter, setQuarterFilter] = useState("all");
  const [editPap, setEditPap] = useState(null), [editFormError, setEditFormError] = useState(""), [actionError, setActionError] = useState("");
  const [showNewGroupForm, setShowNewGroupForm] = useState(false), [newGroupDA, setNewGroupDA] = useState(""), [newGroupOutcome, setNewGroupOutcome] = useState(""), [newGroupStrategy, setNewGroupStrategy] = useState(""), [newGroupExistsError, setNewGroupExistsError] = useState(false);
  const [editGroupTarget, setEditGroupTarget] = useState(null), [editGroupDA, setEditGroupDA] = useState(""), [editGroupOutcome, setEditGroupOutcome] = useState(""), [editGroupStrategy, setEditGroupStrategy] = useState(""), [editGroupExistsError, setEditGroupExistsError] = useState(false);
  const [manualGroups, setManualGroups] = useState([]);

  const filteredPaps = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = paps; // full shared pool — no ownerEmail filter
    if (q) list = list.filter((p) => [p.title, p.performanceIndicator, p.personnelOfficeConcerned, p.fundSource, p.risks, p.developmentArea, p.outcome, p.strategy, String(p.riskExposure ?? "")].some((x) => (x || "").toLowerCase().includes(q)));
    if (quarterFilter !== "all") list = list.filter((p) => parseNumLoose(p[quarterFilter]) > 0);
    if (filter === "ongoing") list = list.filter((p) => !p.completed);
    if (filter === "accomplished") list = list.filter((p) => p.completed);
    return list;
  }, [paps, query, filter, quarterFilter]);

  const manualTimestamps = useMemo(() => { const m = new Map(); manualGroups.forEach((mg) => m.set(`${mg.developmentArea}|||${mg.outcome}|||${mg.strategy}`, mg.addedAt || 0)); return m; }, [manualGroups]);

  const groups = useMemo(() => {
    const map = new Map();
    [...manualGroups].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)).forEach((mg) => {
      const key = `${mg.developmentArea}|||${mg.outcome}|||${mg.strategy}`;
      if (!map.has(key)) map.set(key, { developmentArea: mg.developmentArea, outcome: mg.outcome, strategy: mg.strategy, paps: [], addedAt: mg.addedAt || 0 });
    });
    filteredPaps.forEach((p) => {
      const key = p.developmentArea && p.outcome && p.strategy ? `${p.developmentArea}|||${p.outcome}|||${p.strategy}` : "__ungrouped__";
      if (!map.has(key)) map.set(key, { developmentArea: p.developmentArea || "", outcome: p.outcome || "", strategy: p.strategy || "", paps: [], addedAt: 0 });
      map.get(key).paps.push(p);
    });
    const entries = Array.from(map.entries());
    entries.sort(([ka], [kb]) => {
      if (ka === "__ungrouped__") return 1; if (kb === "__ungrouped__") return -1;
      const aTs = manualTimestamps.get(ka) || 0, bTs = manualTimestamps.get(kb) || 0;
      if (aTs > 0 && bTs > 0) return bTs - aTs; if (aTs > 0) return -1; if (bTs > 0) return 1;
      return ka.localeCompare(kb);
    });
    return entries;
  }, [filteredPaps, manualGroups, manualTimestamps]);

  function allGroupKeys() { return new Set(groups.map(([k]) => k)); }

  function handleAddNewGroup() {
    if (!newGroupDA || !newGroupOutcome || !newGroupStrategy) return;
    const key = `${newGroupDA}|||${newGroupOutcome}|||${newGroupStrategy}`;
    if (allGroupKeys().has(key)) { setNewGroupExistsError(true); return; }
    setManualGroups((prev) => [{ developmentArea: newGroupDA, outcome: newGroupOutcome, strategy: newGroupStrategy, addedAt: Date.now() }, ...prev]);
    setNewGroupDA(""); setNewGroupOutcome(""); setNewGroupStrategy(""); setNewGroupExistsError(false); setShowNewGroupForm(false);
  }

  function handleOpenEditGroup({ developmentArea, outcome, strategy, groupKey }) {
    setEditGroupTarget({ developmentArea, outcome, strategy, groupKey });
    setEditGroupDA(developmentArea); setEditGroupOutcome(outcome); setEditGroupStrategy(strategy); setEditGroupExistsError(false);
  }

  async function handleSaveEditGroup() {
    if (!editGroupDA || !editGroupOutcome || !editGroupStrategy) return;
    const newKey = `${editGroupDA}|||${editGroupOutcome}|||${editGroupStrategy}`, oldKey = editGroupTarget.groupKey;
    if (newKey === oldKey) { setEditGroupTarget(null); return; }
    if (allGroupKeys().has(newKey)) { setEditGroupExistsError(true); return; }
    const papsToPatch = paps.filter((p) => { const k = p.developmentArea && p.outcome && p.strategy ? `${p.developmentArea}|||${p.outcome}|||${p.strategy}` : "__ungrouped__"; return k === oldKey; });
    try { await Promise.all(papsToPatch.map((p) => update(p.id, { developmentArea: editGroupDA, outcome: editGroupOutcome, strategy: editGroupStrategy }))); }
    catch (e) { setActionError(e.message); return; }
    setManualGroups((prev) => {
      const without = prev.filter((mg) => `${mg.developmentArea}|||${mg.outcome}|||${mg.strategy}` !== oldKey);
      if (papsToPatch.length === 0) return [{ developmentArea: editGroupDA, outcome: editGroupOutcome, strategy: editGroupStrategy, addedAt: Date.now() }, ...without];
      return without;
    });
    setEditGroupTarget(null); setEditGroupExistsError(false);
  }

  async function handleDeleteGroup(groupKey, groupPaps) {
    try { await Promise.all(groupPaps.map((p) => remove(p.id))); }
    catch (e) { setActionError(e.message); return; }
    setManualGroups((prev) => prev.filter((mg) => `${mg.developmentArea}|||${mg.outcome}|||${mg.strategy}` !== groupKey));
  }

  async function handleEdit() {
    setEditFormError("");
    if (!editPap.title.trim()) return setEditFormError("Title is required.");
    if (!editPap.personnelOfficeConcerned.trim()) return setEditFormError("Personnel/Office concerned is required.");
    if (!editPap.performanceIndicator.trim()) return setEditFormError("Performance indicator is required.");
    try {
      await update(editPap.id, { title: editPap.title.trim(), performanceIndicator: editPap.performanceIndicator.trim(), personnelOfficeConcerned: editPap.personnelOfficeConcerned.trim(), developmentArea: editPap.developmentArea || "", outcome: editPap.outcome || "", strategy: editPap.strategy || "", q1: editPap.q1, q2: editPap.q2, q3: editPap.q3, q4: editPap.q4, actualQ1: editPap.actualQ1 ?? "", actualQ2: editPap.actualQ2 ?? "", actualQ3: editPap.actualQ3 ?? "", actualQ4: editPap.actualQ4 ?? "", totalEstimatedCost: parseNumberSafe(editPap.totalEstimatedCost), fundSource: editPap.fundSource, risks: editPap.risks, probability: editPap.probability, severity: editPap.severity, riskExposure: editPap.riskExposure, mitigatingActivities: editPap.mitigatingActivities });
      setEditPap(null); setEditFormError("");
    } catch (e) { setEditFormError(e.message); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size={28} /></div>;
  return (
    <div className="space-y-5">
      {actionError && <ErrorBanner msg={actionError} onDismiss={() => setActionError("")} />}
      <div>
        <div className="text-2xl font-extrabold" style={{ color: THEME.ink }}>Programs, Activities & Projects</div>
        <div className="text-sm" style={{ color: "rgba(0,0,0,0.55)" }}>PAPs are organized by Strategic Context (Development Area → Outcome → Strategy).</div>
      </div>
      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-sm"><Input label="Search" value={query} onChange={setQuery} placeholder="Search title, office, development area..." icon={Search} /></div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.45)" }}>Quarter:</span>
              {[{ id: "all", label: "All" }, { id: "q1", label: "Q1" }, { id: "q2", label: "Q2" }, { id: "q3", label: "Q3" }, { id: "q4", label: "Q4" }].map((q) => (
                <button key={q.id} onClick={() => setQuarterFilter(q.id)} style={{ borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 600, background: quarterFilter === q.id ? THEME.gradMain : "rgba(0,0,0,0.04)", color: quarterFilter === q.id ? "#fff" : THEME.ink, border: "none", cursor: "pointer" }}>{q.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.45)" }}>Status:</span>
              {[{ id: "all", label: "All" }, { id: "ongoing", label: "Ongoing" }, { id: "accomplished", label: "Accomplished" }].map((f) => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{ borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 600, background: filter === f.id ? "rgba(247,127,0,0.18)" : "rgba(0,0,0,0.03)", color: THEME.ink, border: "none", cursor: "pointer" }}>{f.label}</button>
              ))}
            </div>
            <button onClick={() => exportPapsToPDF({ user, items: filteredPaps, title: "FY 2026 Annual Operation Plan\nCollege of Engineering - Alangilan Campus", quarterFilter })} style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 16px", fontSize: 12, fontWeight: 600, background: "rgba(214,40,40,0.10)", color: THEME.red, border: "none", cursor: "pointer" }}>
              <FileDown size={15} /> Export PDF {quarterFilter !== "all" && <span style={{ marginLeft: 2, borderRadius: 999, padding: "1px 6px", background: THEME.red, color: "#fff", fontSize: 10, fontWeight: 800 }}>{quarterFilter.toUpperCase()}</span>}
            </button>
          </div>
        </div>
        {(quarterFilter !== "all" || filter !== "all") && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.45)" }}>Active filters:</span>
            {quarterFilter !== "all" && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600, background: "rgba(214,40,40,0.10)", color: THEME.red }}><Filter size={10} />{quarterFilter.toUpperCase()}<button onClick={() => setQuarterFilter("all")} style={{ marginLeft: 2, fontWeight: 800, background: "none", border: "none", cursor: "pointer", color: THEME.red, fontSize: 11 }}>×</button></span>}
            {filter !== "all" && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600, background: "rgba(247,127,0,0.14)", color: THEME.ink }}>{filter.charAt(0).toUpperCase() + filter.slice(1)}<button onClick={() => setFilter("all")} style={{ marginLeft: 2, fontWeight: 800, background: "none", border: "none", cursor: "pointer", color: THEME.ink, fontSize: 11 }}>×</button></span>}
            <span className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>{filteredPaps.length} PAP{filteredPaps.length !== 1 ? "s" : ""} across {groups.length} group{groups.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </Card>
      <Card className="p-5" style={{ background: THEME.gradSoft }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showNewGroupForm ? 16 : 0 }}>
          <div>
            <div className="text-base font-extrabold" style={{ color: THEME.ink }}>Create a New Strategic Context Group</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.55)" }}>Select Development Area → Outcome → Strategy.</div>
          </div>
          <button onClick={() => { setShowNewGroupForm((v) => !v); setNewGroupExistsError(false); }} style={{ display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 14, padding: "8px 16px", fontSize: 13, fontWeight: 700, background: showNewGroupForm ? "rgba(0,0,0,0.08)" : THEME.gradMain, color: showNewGroupForm ? THEME.ink : "#fff", border: "none", cursor: "pointer" }}>
            {showNewGroupForm ? <><X size={14} /> Cancel</> : <><Layers size={15} /> New Group</>}
          </button>
        </div>
        <AnimatePresence>
          {showNewGroupForm && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <StrategicContextFields developmentArea={newGroupDA} outcome={newGroupOutcome} strategy={newGroupStrategy}
                onDevelopmentAreaChange={(v) => { setNewGroupDA(v); setNewGroupExistsError(false); }}
                onOutcomeChange={(v) => { setNewGroupOutcome(v); setNewGroupExistsError(false); }}
                onStrategyChange={(v) => { setNewGroupStrategy(v); setNewGroupExistsError(false); }} />
              {newGroupExistsError && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 14, display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 14, padding: "12px 16px", background: "rgba(247,127,0,0.10)", border: "1.5px solid rgba(247,127,0,0.35)" }}>
                  <AlertCircle size={17} style={{ color: THEME.orange, flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: THEME.orange }}>This strategic context group already exists.</div>
                    <div style={{ fontSize: 12, color: "rgba(0,0,0,0.6)", marginTop: 2 }}>A group for <strong>{newGroupDA}</strong> → <strong>{newGroupOutcome}</strong> → <strong>{newGroupStrategy}</strong> is already present. You can add PAPs directly to that group.</div>
                  </div>
                </motion.div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
                <GhostButton onClick={() => { setShowNewGroupForm(false); setNewGroupDA(""); setNewGroupOutcome(""); setNewGroupStrategy(""); setNewGroupExistsError(false); }}>Cancel</GhostButton>
                <PrimaryButton onClick={handleAddNewGroup} disabled={!newGroupDA || !newGroupOutcome || !newGroupStrategy} className="inline-flex items-center gap-2"><FolderOpen size={15} /> Create Group</PrimaryButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
      {groups.length === 0 ? (
        <Card className="p-10">
          <div className="text-center" style={{ color: "rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>📋</div>
            <div className="text-sm font-semibold">No PAPs yet.</div>
            <div className="text-xs mt-1">Create a new Strategic Context Group above to get started.</div>
          </div>
        </Card>
      ) : (
        <div>
          {groups.map(([key, group]) => (
            <StrategicGroupSection key={key} groupKey={key} group={group} user={user} add={add} update={update} remove={remove} quarterFilter={quarterFilter}
              onEdit={(pap) => { setEditPap({ ...pap }); setEditFormError(""); }}
              onEditGroup={handleOpenEditGroup} onDeleteGroup={handleDeleteGroup} />
          ))}
        </div>
      )}
      <AnimatePresence>
        {editGroupTarget && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0" onClick={() => { setEditGroupTarget(null); setEditGroupExistsError(false); }} style={{ background: "rgba(0,0,0,0.38)" }} />
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.2 }} className="relative w-full max-w-3xl">
              <Card className="p-7">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-lg font-extrabold" style={{ color: THEME.ink }}>Edit Strategic Context Group</div>
                    <div className="text-sm mt-1" style={{ color: "rgba(0,0,0,0.6)" }}>Changing the context will update all PAPs in this group.</div>
                  </div>
                  <button onClick={() => { setEditGroupTarget(null); setEditGroupExistsError(false); }} style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 14, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: THEME.ink, cursor: "pointer" }}>Close</button>
                </div>
                <div style={{ borderRadius: 14, padding: "10px 14px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.45)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current values</div>
                  <div style={{ fontSize: 12, color: "rgba(0,0,0,0.65)", lineHeight: 1.8 }}>
                    <span style={{ fontWeight: 600 }}>Development Area:</span> {editGroupTarget.developmentArea}<br />
                    <span style={{ fontWeight: 600 }}>Outcome:</span> {editGroupTarget.outcome}<br />
                    <span style={{ fontWeight: 600 }}>Strategy:</span> {editGroupTarget.strategy}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.ink, marginBottom: 12 }}>New values:</div>
                <StrategicContextFields developmentArea={editGroupDA} outcome={editGroupOutcome} strategy={editGroupStrategy}
                  onDevelopmentAreaChange={(v) => { setEditGroupDA(v); setEditGroupOutcome(""); setEditGroupStrategy(""); setEditGroupExistsError(false); }}
                  onOutcomeChange={(v) => { setEditGroupOutcome(v); setEditGroupStrategy(""); setEditGroupExistsError(false); }}
                  onStrategyChange={(v) => { setEditGroupStrategy(v); setEditGroupExistsError(false); }} />
                {editGroupExistsError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 14, display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 14, padding: "12px 16px", background: "rgba(247,127,0,0.10)", border: "1.5px solid rgba(247,127,0,0.35)" }}>
                    <AlertCircle size={17} style={{ color: THEME.orange, flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: THEME.orange }}>This strategic context group already exists.</div>
                      <div style={{ fontSize: 12, color: "rgba(0,0,0,0.6)", marginTop: 2 }}>Choose a different combination or merge PAPs manually.</div>
                    </div>
                  </motion.div>
                )}
                <div className="mt-6 flex gap-2 justify-end">
                  <GhostButton onClick={() => { setEditGroupTarget(null); setEditGroupExistsError(false); }}>Cancel</GhostButton>
                  <PrimaryButton onClick={handleSaveEditGroup} disabled={!editGroupDA || !editGroupOutcome || !editGroupStrategy} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Save Changes</PrimaryButton>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editPap && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0" onClick={() => setEditPap(null)} style={{ background: "rgba(0,0,0,0.35)" }} />
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.2 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <Card className="p-7" style={{ background: THEME.white }}>
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <div className="text-lg font-extrabold" style={{ color: THEME.ink }}>Edit Program, Activity or Project</div>
                    <div className="mt-1 text-sm" style={{ color: "rgba(0,0,0,0.65)" }}>Update the fields below and click Save Changes.</div>
                  </div>
                  <button onClick={() => setEditPap(null)} style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 14, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: THEME.ink, cursor: "pointer" }}>Close</button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Title (required)" value={editPap.title} onChange={(v) => setEditPap({ ...editPap, title: v })} />
                  <Input label="Personnel/Office concerned (required)" value={editPap.personnelOfficeConcerned} onChange={(v) => setEditPap({ ...editPap, personnelOfficeConcerned: v })} />
                  <div className="md:col-span-2">
                    <div className="rounded-2xl p-4" style={{ background: "rgba(214,40,40,0.03)", border: "1px solid rgba(214,40,40,0.10)" }}>
                      <div className="text-sm font-bold mb-1" style={{ color: THEME.ink }}>Strategic Context</div>
                      <div className="text-xs mb-4" style={{ color: "rgba(0,0,0,0.5)" }}>Changing this will move the PAP to the corresponding group.</div>
                      <StrategicContextFields developmentArea={editPap.developmentArea || ""} outcome={editPap.outcome || ""} strategy={editPap.strategy || ""}
                        onDevelopmentAreaChange={(v) => setEditPap({ ...editPap, developmentArea: v, outcome: "", strategy: "" })}
                        onOutcomeChange={(v) => setEditPap({ ...editPap, outcome: v, strategy: "" })}
                        onStrategyChange={(v) => setEditPap({ ...editPap, strategy: v })} />
                    </div>
                  </div>
                  <div className="md:col-span-2 grid gap-4 md:grid-cols-[240px_1fr]">
                    <div className="rounded-3xl px-4 py-2" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div className="text-sm font-semibold" style={{ color: "rgba(0,0,0,0.65)" }}>Quarterly Targets Sum</div>
                      <div className="mt-1 text-3xl font-extrabold leading-none" style={{ color: THEME.ink }}>{parseNumLoose(editPap.q1) + parseNumLoose(editPap.q2) + parseNumLoose(editPap.q3) + parseNumLoose(editPap.q4)}</div>
                      <div className="mt-1 text-[11px]" style={{ color: "rgba(0,0,0,0.55)" }}>Auto-calculated from Quarters 1 to 4.</div>
                    </div>
                    <Textarea label="Performance Indicator (required)" value={editPap.performanceIndicator} onChange={(v) => setEditPap({ ...editPap, performanceIndicator: v })} rows={2} />
                  </div>
                  {["q1", "q2", "q3", "q4"].map((k) => (<Input key={k} label={`${k.toUpperCase()} Target`} value={editPap[k]} onChange={(v) => setEditPap({ ...editPap, [k]: v })} />))}
                  <Input label="Total Estimated Cost (PHP)" value={editPap.totalEstimatedCost} onChange={(v) => setEditPap({ ...editPap, totalEstimatedCost: v })} />
                  <Input label="Fund Source" value={editPap.fundSource} onChange={(v) => setEditPap({ ...editPap, fundSource: v })} />
                  <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                    <Textarea label="Risks" value={editPap.risks} onChange={(v) => setEditPap({ ...editPap, risks: v })} rows={4} />
                    <Textarea label="Mitigating Activities" value={editPap.mitigatingActivities} onChange={(v) => setEditPap({ ...editPap, mitigatingActivities: v })} rows={4} />
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm font-semibold mb-3" style={{ color: "rgba(0,0,0,0.75)" }}>Risk Assessment</div>
                    <div className="grid gap-4 md:grid-cols-3">
                      {[{ label: "Probability", key: "probability", opts: ["Rare (1)", "Unlikely (2)", "Possible (3)", "Probable (4)", "Almost Certain (5)"] }, { label: "Severity", key: "severity", opts: ["Insignificant (1)", "Minor (2)", "Major (3)", "Critical (4)", "Catastrophic (5)"] }].map((s) => (
                        <div key={s.label} className="space-y-1.5">
                          <div className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.65)" }}>{s.label}</div>
                          <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5" style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white" }}>
                            <select value={editPap[s.key] || ""} onChange={(e) => setEditPap({ ...editPap, [s.key]: e.target.value })} className="w-full bg-transparent text-sm font-semibold outline-none" style={{ color: THEME.ink }}>
                              <option value="">Select {s.label.toLowerCase()}</option>
                              {s.opts.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.65)" }}>Risk Exposure</div>
                        <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5" style={{ border: "1px solid rgba(0,0,0,0.12)", background: "white" }}>
                          <select value={editPap.riskExposure} onChange={(e) => setEditPap({ ...editPap, riskExposure: e.target.value })} className="w-full bg-transparent text-sm font-semibold outline-none" style={{ color: THEME.ink }}>
                            <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  {editFormError && <div className="md:col-span-2"><ErrorBanner msg={editFormError} /></div>}
                </div>
                <div className="mt-6 flex gap-2 justify-end">
                  <GhostButton onClick={() => setEditPap(null)}>Cancel</GhostButton>
                  <PrimaryButton onClick={handleEdit} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Save Changes</PrimaryButton>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CHANGE: ListPage — removed ownerEmail filter, uses full shared paps pool ─
function ListPage({ user, paps, loading, error, add, update, remove }) {
  const [quarterFilter, setQuarterFilter] = useState("all"), [statusFilter, setStatusFilter] = useState("all"), [search, setSearch] = useState("");
  const [editKey, setEditKey] = useState(null), [draft, setDraft] = useState(""), [saveError, setSaveError] = useState(null), [savingKey, setSavingKey] = useState(null);
  const [textEditKey, setTextEditKey] = useState(null), [textDraft, setTextDraft] = useState(""), [textSaveError, setTextSaveError] = useState(null), [textSavingKey, setTextSavingKey] = useState(null);
  const [completingPap, setCompletingPap] = useState(null), [evidenceInput, setEvidenceInput] = useState(""), [evidenceError, setEvidenceError] = useState("");
  const [actionError, setActionError] = useState(""), [deleteLoading, setDeleteLoading] = useState(null);
  const [manualGroups, setManualGroups] = useState([]), [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupDA, setNewGroupDA] = useState(""), [newGroupOutcome, setNewGroupOutcome] = useState(""), [newGroupStrategy, setNewGroupStrategy] = useState(""), [newGroupExistsError, setNewGroupExistsError] = useState(false);
  const [addingInGroup, setAddingInGroup] = useState(null), [collapsedGroups, setCollapsedGroups] = useState({});

  const beginNumEdit = useCallback((papId, field, currentValue) => { const key = `${papId}:${field}`; setEditKey(key); setDraft(String(currentValue ?? "")); setSaveError(null); }, []);
  const cancelNumEdit = useCallback(() => { setEditKey(null); setDraft(""); setSaveError(null); setSavingKey(null); }, []);
  const commitNumEdit = useCallback(async () => {
    if (!editKey) return;
    const [papId, field] = editKey.split(":");
    const raw = String(draft ?? "").trim(), num = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(num) || num < 0) { setSaveError("Enter a valid non-negative number."); return; }
    try { setSavingKey(editKey); setSaveError(null); await update(papId, { [field]: num }); setEditKey(null); setDraft(""); setSavingKey(null); }
    catch (e) { setSaveError(e?.message || "Failed to save."); setSavingKey(null); }
  }, [editKey, draft, update]);

  const beginTextEdit = useCallback((papId, field, currentValue) => { const key = `${papId}:${field}`; setTextEditKey(key); setTextDraft(String(currentValue ?? "")); setTextSaveError(null); }, []);
  const cancelTextEdit = useCallback(() => { setTextEditKey(null); setTextDraft(""); setTextSaveError(null); setTextSavingKey(null); }, []);
  const commitTextEdit = useCallback(async () => {
    if (!textEditKey) return;
    const [papId, field] = textEditKey.split(":");
    const val = textDraft.trim();
    if (!val) { setTextSaveError("Cannot be empty."); return; }
    try { setTextSavingKey(textEditKey); setTextSaveError(null); await update(papId, { [field]: val }); setTextEditKey(null); setTextDraft(""); setTextSavingKey(null); }
    catch (e) { setTextSaveError(e?.message || "Failed to save."); setTextSavingKey(null); }
  }, [textEditKey, textDraft, update]);

  function parseLinks(text) { return text.split(/\n|,|\s+/).map((s) => s.trim()).filter(Boolean); }

  async function handleConfirmComplete() {
    const links = parseLinks(evidenceInput);
    if (links.length === 0) { setEvidenceError("Please provide at least one evidence link."); return; }
    const invalid = links.filter((l) => !isValidUrlLike(l));
    if (invalid.length) { setEvidenceError("Some links are invalid. Use http/https links only."); return; }
    try { await update(completingPap.id, { completed: true, completedAt: Date.now(), evidenceLinks: links }); setCompletingPap(null); setEvidenceInput(""); setEvidenceError(""); }
    catch (e) { setActionError(e.message); }
  }
  async function handleMarkOngoing(pap) { try { await update(pap.id, { completed: false, completedAt: null, evidenceLinks: [] }); } catch (e) { setActionError(e.message); } }
  async function handleDeletePap(id) { setDeleteLoading(id); try { await remove(id); } catch (e) { setActionError(e.message); } setDeleteLoading(null); }

  const filtered = useMemo(() => {
    let list = [...paps]; // full shared pool — no ownerEmail filter
    if (search.trim()) { const q = search.trim().toLowerCase(); list = list.filter((p) => [p.title, p.performanceIndicator, p.personnelOfficeConcerned, p.fundSource, p.developmentArea, p.outcome, p.strategy].some((x) => (x || "").toLowerCase().includes(q))); }
    if (quarterFilter !== "all") list = list.filter((p) => parseNumLoose(p[quarterFilter]) > 0);
    if (statusFilter === "ongoing") list = list.filter((p) => !p.completed);
    if (statusFilter === "accomplished") list = list.filter((p) => p.completed);
    return list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }, [paps, quarterFilter, statusFilter, search]);

  const manualTimestamps = useMemo(() => { const m = new Map(); manualGroups.forEach((mg) => m.set(`${mg.developmentArea}|||${mg.outcome}|||${mg.strategy}`, mg.addedAt || 0)); return m; }, [manualGroups]);

  const groups = useMemo(() => {
    const map = new Map();
    [...manualGroups].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)).forEach((mg) => {
      const key = `${mg.developmentArea}|||${mg.outcome}|||${mg.strategy}`;
      if (!map.has(key)) map.set(key, { developmentArea: mg.developmentArea, outcome: mg.outcome, strategy: mg.strategy, items: [], addedAt: mg.addedAt || 0 });
    });
    filtered.forEach((p) => {
      const key = p.developmentArea && p.outcome && p.strategy ? `${p.developmentArea}|||${p.outcome}|||${p.strategy}` : "__ungrouped__";
      if (!map.has(key)) map.set(key, { developmentArea: p.developmentArea || "", outcome: p.outcome || "", strategy: p.strategy || "", items: [], addedAt: 0 });
      map.get(key).items.push(p);
    });
    const entries = Array.from(map.entries());
    entries.sort(([ka], [kb]) => {
      if (ka === "__ungrouped__") return 1; if (kb === "__ungrouped__") return -1;
      const aTs = manualTimestamps.get(ka) || 0, bTs = manualTimestamps.get(kb) || 0;
      if (aTs > 0 && bTs > 0) return bTs - aTs; if (aTs > 0) return -1; if (bTs > 0) return 1;
      return ka.localeCompare(kb);
    });
    return entries;
  }, [filtered, manualGroups, manualTimestamps]);

  function allGroupKeys() { return new Set(groups.map(([k]) => k)); }
  function handleAddNewGroup() {
    if (!newGroupDA || !newGroupOutcome || !newGroupStrategy) return;
    const key = `${newGroupDA}|||${newGroupOutcome}|||${newGroupStrategy}`;
    if (allGroupKeys().has(key)) { setNewGroupExistsError(true); return; }
    setManualGroups((prev) => [{ developmentArea: newGroupDA, outcome: newGroupOutcome, strategy: newGroupStrategy, addedAt: Date.now() }, ...prev]);
    setNewGroupDA(""); setNewGroupOutcome(""); setNewGroupStrategy(""); setNewGroupExistsError(false); setShowNewGroupForm(false);
  }

  const visibleQs = getVisibleQuarters(quarterFilter), showTotal = quarterFilter === "all";
  const riskColor = (r) => r === "High" ? THEME.red : r === "Medium" ? THEME.orange : "#16a34a";
  const areaColors = {
    "Academic Leadership":     { bg: "rgba(214,40,40,0.07)",  border: "rgba(214,40,40,0.22)",  accent: THEME.red,    badge: "#d62828" },
    "Research and Innovation": { bg: "rgba(247,127,0,0.07)",  border: "rgba(247,127,0,0.22)",  accent: THEME.orange, badge: "#f77f00" },
    "Social Responsibility":   { bg: "rgba(22,163,74,0.07)",  border: "rgba(22,163,74,0.22)",  accent: "#16a34a",    badge: "#16a34a" },
    "Internationalization":    { bg: "rgba(37,99,235,0.07)",  border: "rgba(37,99,235,0.22)",  accent: "#2563eb",    badge: "#2563eb" },
  };

  function EditableNumberCell({ pap, field, value, tone = "neutral" }) {
    const key = `${pap.id}:${field}`, isEditing = editKey === key, isSaving = savingKey === key;
    const bg = tone === "target" ? "rgba(214,40,40,0.04)" : tone === "actual" ? "rgba(247,127,0,0.04)" : "transparent";
    if (isEditing) {
      return (
        <td style={{ padding: "4px", textAlign: "center", background: bg, minWidth: 44 }}>
          <input autoFocus type="number" inputMode="numeric" min={0} step={1} value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitNumEdit(); if (e.key === "Escape") cancelNumEdit(); }} onBlur={() => commitNumEdit()}
            style={{ width: 60, borderRadius: 8, padding: "5px 6px", border: `1px solid ${saveError ? "rgba(214,40,40,0.45)" : "rgba(0,0,0,0.18)"}`, outline: "none", fontSize: 11, fontWeight: 700, textAlign: "center", background: "white" }} />
          {isSaving && <div style={{ marginTop: 2 }}><Spinner size={10} /></div>}
          {saveError && <div style={{ fontSize: 9, color: THEME.red, marginTop: 2 }}>{saveError}</div>}
        </td>
      );
    }
    const num = Number(value), display = num > 0 ? num : "—";
    const displayColor = tone === "target" ? THEME.ink : tone === "actual" ? (num > 0 ? THEME.orange : "rgba(0,0,0,0.3)") : THEME.ink;
    return (
      <td onDoubleClick={() => beginNumEdit(pap.id, field, value)} title="Double-click to edit" style={{ padding: "8px 4px", textAlign: "center", background: bg, minWidth: 44, cursor: "cell", userSelect: "none" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: displayColor }}>{display}</span>
      </td>
    );
  }

  function EditableTextCell({ pap, field, value, multiline = false, minWidth = 120 }) {
    const key = `${pap.id}:${field}`, isEditing = textEditKey === key, isSaving = textSavingKey === key;
    if (isEditing) {
      return (
        <td style={{ padding: "4px", minWidth, verticalAlign: "top" }}>
          {multiline ? (
            <textarea autoFocus value={textDraft} rows={3} onChange={(e) => setTextDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") cancelTextEdit(); if (e.key === "Enter" && e.ctrlKey) commitTextEdit(); }} onBlur={() => commitTextEdit()}
              style={{ width: "100%", borderRadius: 8, padding: "5px 7px", border: `1px solid ${textSaveError ? "rgba(214,40,40,0.45)" : "rgba(0,0,0,0.18)"}`, outline: "none", fontSize: 11, resize: "vertical", boxSizing: "border-box" }} />
          ) : (
            <input autoFocus type="text" value={textDraft} onChange={(e) => setTextDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitTextEdit(); if (e.key === "Escape") cancelTextEdit(); }} onBlur={() => commitTextEdit()}
              style={{ width: "100%", borderRadius: 8, padding: "5px 7px", border: `1px solid ${textSaveError ? "rgba(214,40,40,0.45)" : "rgba(0,0,0,0.18)"}`, outline: "none", fontSize: 11, boxSizing: "border-box" }} />
          )}
          {isSaving && <div style={{ marginTop: 2 }}><Spinner size={10} /></div>}
          {textSaveError && <div style={{ fontSize: 9, color: THEME.red, marginTop: 2 }}>{textSaveError}</div>}
          {multiline && <div style={{ fontSize: 9, color: "rgba(0,0,0,0.4)", marginTop: 2 }}>Ctrl+Enter to save • Esc to cancel</div>}
        </td>
      );
    }
    return (
      <td onDoubleClick={() => beginTextEdit(pap.id, field, value)} title="Double-click to edit" style={{ padding: "8px 6px", minWidth, maxWidth: minWidth + 80, cursor: "cell", userSelect: "none", verticalAlign: "top" }}>
        <div style={{ fontSize: 11, color: "rgba(0,0,0,0.72)", wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{value || "—"}</div>
      </td>
    );
  }

  function StatusCell({ pap }) {
    const [hovered, setHovered] = useState(false);
    if (pap.completed) {
      return (
        <td style={{ padding: "8px 6px", textAlign: "center", minWidth: 110 }}>
          <button onClick={() => handleMarkOngoing(pap)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} title="Click to mark as Ongoing"
            style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "4px 10px", background: hovered ? "rgba(247,127,0,0.14)" : "rgba(252,191,73,0.22)", color: hovered ? THEME.orange : "#92400e", border: hovered ? "1px solid rgba(247,127,0,0.35)" : "1px solid transparent", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}>
            {hovered ? "↩ Mark Ongoing" : "✓ Accomplished"}
          </button>
        </td>
      );
    }
    return (
      <td style={{ padding: "8px 6px", textAlign: "center", minWidth: 110 }}>
        <button onClick={() => { setCompletingPap(pap); setEvidenceInput(""); setEvidenceError(""); }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} title="Click to mark as Accomplished"
          style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "4px 10px", background: hovered ? THEME.gradMain : "rgba(0,0,0,0.06)", color: hovered ? "#fff" : THEME.ink, border: "none", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}>
          {hovered ? "✓ Mark Done" : "Ongoing"}
        </button>
      </td>
    );
  }

  function InlineAddRow({ groupKey, group }) {
    const [title, setTitle] = useState(""), [pi, setPi] = useState(""), [office, setOffice] = useState("");
    const [q1, setQ1] = useState(""), [q2, setQ2] = useState(""), [q3, setQ3] = useState(""), [q4, setQ4] = useState("");
    const [cost, setCost] = useState(""), [fundSource, setFundSource] = useState(""), [risks, setRisks] = useState(""), [probability, setProbability] = useState(""), [severity, setSeverity] = useState(""), [riskExposure, setRiskExposure] = useState("Low"), [mitigating, setMitigating] = useState("");
    const [formErr, setFormErr] = useState(""), [saving, setSaving] = useState(false);
    const inputStyle = { width: "100%", borderRadius: 8, padding: "5px 7px", border: "1px solid rgba(0,0,0,0.14)", outline: "none", fontSize: 11, boxSizing: "border-box" };
    const numInputStyle = { ...inputStyle, textAlign: "center", width: 60 };
    async function handleSave() {
      setFormErr("");
      if (!title.trim()) return setFormErr("Title required.");
      if (!office.trim()) return setFormErr("Office required.");
      if (!pi.trim()) return setFormErr("Performance indicator required.");
      setSaving(true);
      try {
        await add({ ownerEmail: user.email, title: title.trim(), performanceIndicator: pi.trim(), personnelOfficeConcerned: office.trim(), developmentArea: group.developmentArea || "", outcome: group.outcome || "", strategy: group.strategy || "", q1: q1.trim(), q2: q2.trim(), q3: q3.trim(), q4: q4.trim(), actualQ1: "", actualQ2: "", actualQ3: "", actualQ4: "", totalEstimatedCost: parseNumberSafe(cost), fundSource: fundSource.trim(), risks: risks.trim(), probability, severity, riskExposure, mitigatingActivities: mitigating.trim(), completed: false, completedAt: null, evidenceLinks: [] });
        setAddingInGroup(null);
      } catch (e) { setFormErr(e.message); }
      setSaving(false);
    }
    const qSubCols = visibleQs.length * 3, totalCols = showTotal ? 2 : 0, rightFixedCols = 8, deleteCols = 1;
    const totalColCount = 4 + qSubCols + totalCols + rightFixedCols + deleteCols;
    return (
      <tr style={{ background: "rgba(214,40,40,0.03)", borderTop: "2px dashed rgba(214,40,40,0.22)" }}>
        <td colSpan={totalColCount} style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: THEME.red, marginBottom: 10 }}>New PAP — {group.developmentArea || "Ungrouped"}</div>
          {formErr && <div style={{ marginBottom: 8, color: THEME.red, fontSize: 11, fontWeight: 600 }}>⚠ {formErr}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.5)", marginBottom: 3 }}>Title *</div><input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Program/Activity/Project name" /></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.5)", marginBottom: 3 }}>Personnel/Office *</div><input style={inputStyle} value={office} onChange={(e) => setOffice(e.target.value)} placeholder="Office concerned" /></div>
            <div className="col-span-2"><div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.5)", marginBottom: 3 }}>Performance Indicator *</div><input style={inputStyle} value={pi} onChange={(e) => setPi(e.target.value)} placeholder="How success is measured" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, auto) 1fr 1fr", gap: 8, alignItems: "end", marginBottom: 8 }}>
            {[{ label: "Q1 Target", val: q1, set: setQ1 }, { label: "Q2 Target", val: q2, set: setQ2 }, { label: "Q3 Target", val: q3, set: setQ3 }, { label: "Q4 Target", val: q4, set: setQ4 }].map((q) => (
              <div key={q.label}><div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.5)", marginBottom: 3 }}>{q.label}</div><input style={numInputStyle} type="number" min="0" value={q.val} onChange={(e) => q.set(e.target.value)} placeholder="0" /></div>
            ))}
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.5)", marginBottom: 3 }}>Cost (PHP)</div><input style={{ ...inputStyle, width: 100 }} value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" /></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.5)", marginBottom: 3 }}>Fund Source</div><input style={{ ...inputStyle, width: 110 }} value={fundSource} onChange={(e) => setFundSource(e.target.value)} /></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.5)", marginBottom: 3 }}>Probability</div>
              <select style={{ ...inputStyle, width: 130 }} value={probability} onChange={(e) => setProbability(e.target.value)}>
                <option value="">Select…</option>
                {["Rare (1)", "Unlikely (2)", "Possible (3)", "Probable (4)", "Almost Certain (5)"].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.5)", marginBottom: 3 }}>Severity</div>
              <select style={{ ...inputStyle, width: 140 }} value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="">Select…</option>
                {["Insignificant (1)", "Minor (2)", "Major (3)", "Critical (4)", "Catastrophic (5)"].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.5)", marginBottom: 3 }}>Risk Exposure</div>
              <select style={{ ...inputStyle, width: 90 }} value={riskExposure} onChange={(e) => setRiskExposure(e.target.value)}>
                <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.5)", marginBottom: 3 }}>Risks</div><textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={risks} onChange={(e) => setRisks(e.target.value)} placeholder="Possible risks" /></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.5)", marginBottom: 3 }}>Mitigating Activities</div><textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={mitigating} onChange={(e) => setMitigating(e.target.value)} placeholder="How to reduce/avoid risks" /></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 12, padding: "7px 18px", fontSize: 12, fontWeight: 700, background: THEME.gradMain, color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? <Spinner size={13} /> : <Plus size={13} />} Add PAP
            </button>
            <button onClick={() => setAddingInGroup(null)} style={{ borderRadius: 12, padding: "7px 14px", fontSize: 12, fontWeight: 600, background: "rgba(0,0,0,0.06)", color: THEME.ink, border: "none", cursor: "pointer" }}>Cancel</button>
          </div>
        </td>
      </tr>
    );
  }

  function TableHead() {
    const thBase = { padding: "8px 6px 4px", textAlign: "center", fontSize: 10, fontWeight: 700, background: "rgba(255,235,235,0.98)", borderBottom: "1px solid rgba(214,40,40,0.10)", whiteSpace: "nowrap" };
    const subThBase = { padding: "4px 6px 8px", textAlign: "center", fontSize: 9, fontWeight: 700, background: "rgba(255,235,235,0.98)", borderBottom: "2px solid rgba(214,40,40,0.18)", whiteSpace: "nowrap" };
    return (
      <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
        <tr>
          {["#", "Programs, Activities & Projects", "Performance Indicator", "Personnel / Office"].map((lbl, i) => <th key={i} style={{ ...thBase, color: THEME.ink }}>{lbl}</th>)}
          {visibleQs.map(({ label, tk }) => <th key={tk} colSpan={3} style={{ ...thBase, color: THEME.red, background: "rgba(214,40,40,0.10)", borderRight: "1px solid rgba(0,0,0,0.06)" }}>{label}</th>)}
          {showTotal && <th colSpan={2} style={{ ...thBase, color: THEME.ink, borderRight: "1px solid rgba(0,0,0,0.06)" }}>Total</th>}
          {["Cost", "Fund Source", "Risks", "Probability", "Severity", "Risk Exposure", "Mitigating", "Status", ""].map((lbl, i) => <th key={i} style={{ ...thBase, color: THEME.ink }}>{lbl}</th>)}
        </tr>
        <tr>
          {[0, 1, 2, 3].map((i) => <th key={i} style={{ ...subThBase, color: "rgba(0,0,0,0.5)" }}>{i === 1 ? <span style={{ fontSize: 8, fontWeight: 500, color: "rgba(0,0,0,0.35)" }}>dbl-click to edit</span> : ""}</th>)}
          {visibleQs.map(({ tk }) => ["Target", "Actual", "Rem."].map((sub) => <th key={`${tk}-${sub}`} style={{ ...subThBase, color: sub === "Target" ? "rgba(0,0,0,0.6)" : sub === "Actual" ? THEME.orange : THEME.red, background: "rgba(214,40,40,0.07)" }}>{sub}</th>))}
          {showTotal && ["Target", "Actual"].map((sub) => <th key={`total-${sub}`} style={{ ...subThBase, color: sub === "Target" ? THEME.orange : "#16a34a" }}>{sub}</th>)}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <th key={i} style={{ ...subThBase, color: "rgba(0,0,0,0.5)" }}>{""}</th>)}
        </tr>
      </thead>
    );
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size={28} /></div>;
  return (
    <div className="space-y-5">
      <div>
        <div className="text-2xl font-extrabold" style={{ color: THEME.ink }}>List of Programs, Activities and Projects</div>
        <div className="text-sm" style={{ color: "rgba(0,0,0,0.55)" }}>Tabular view. Double-click any cell to edit. Click status to toggle. Add groups and PAPs directly in the table.</div>
      </div>
      <Card className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-sm"><Input label="Search" value={search} onChange={setSearch} placeholder="Search title, office, development area..." icon={Search} /></div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs font-semibold mr-1" style={{ color: "rgba(0,0,0,0.55)" }}>Quarter:</span>
              {[{ id: "all", label: "All Quarters" }, { id: "q1", label: "Q1" }, { id: "q2", label: "Q2" }, { id: "q3", label: "Q3" }, { id: "q4", label: "Q4" }].map((q) => (
                <button key={q.id} onClick={() => setQuarterFilter(q.id)} style={{ borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 600, background: quarterFilter === q.id ? THEME.gradMain : "rgba(0,0,0,0.04)", color: quarterFilter === q.id ? "#fff" : THEME.ink, border: "none", cursor: "pointer" }}>{q.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs font-semibold mr-1" style={{ color: "rgba(0,0,0,0.55)" }}>Status:</span>
              {[{ id: "all", label: "All" }, { id: "ongoing", label: "Ongoing" }, { id: "accomplished", label: "Accomplished" }].map((s) => (
                <button key={s.id} onClick={() => setStatusFilter(s.id)} style={{ borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 600, background: statusFilter === s.id ? "rgba(247,127,0,0.18)" : "rgba(0,0,0,0.04)", color: THEME.ink, border: "none", cursor: "pointer" }}>{s.label}</button>
              ))}
            </div>
            <button onClick={() => exportListToPDF({ user, items: filtered, quarterFilter })} style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 16px", fontSize: 12, fontWeight: 600, background: "rgba(214,40,40,0.10)", color: THEME.red, border: "none", cursor: "pointer" }}>
              <FileDown size={15} /> Export PDF
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill tone="neutral">Total: {filtered.length}</Pill>
          <Pill tone="info">Ongoing: {filtered.filter((p) => !p.completed).length}</Pill>
          <Pill tone="ok">Accomplished: {filtered.filter((p) => p.completed).length}</Pill>
          <Pill tone="neutral">Groups: {groups.length}</Pill>
          {quarterFilter !== "all" && <Pill tone="warn">Filtered by: {quarterFilter.toUpperCase()}</Pill>}
        </div>
      </Card>
      <Card className="p-5" style={{ background: THEME.gradSoft }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showNewGroupForm ? 16 : 0 }}>
          <div>
            <div className="text-base font-extrabold" style={{ color: THEME.ink }}>Create a New Strategic Context Group</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.55)" }}>Select Development Area → Outcome → Strategy.</div>
          </div>
          <button onClick={() => { setShowNewGroupForm((v) => !v); setNewGroupExistsError(false); }} style={{ display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 14, padding: "8px 16px", fontSize: 13, fontWeight: 700, background: showNewGroupForm ? "rgba(0,0,0,0.08)" : THEME.gradMain, color: showNewGroupForm ? THEME.ink : "#fff", border: "none", cursor: "pointer" }}>
            {showNewGroupForm ? <><X size={14} /> Cancel</> : <><Layers size={15} /> New Group</>}
          </button>
        </div>
        <AnimatePresence>
          {showNewGroupForm && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <StrategicContextFields developmentArea={newGroupDA} outcome={newGroupOutcome} strategy={newGroupStrategy}
                onDevelopmentAreaChange={(v) => { setNewGroupDA(v); setNewGroupExistsError(false); }}
                onOutcomeChange={(v) => { setNewGroupOutcome(v); setNewGroupExistsError(false); }}
                onStrategyChange={(v) => { setNewGroupStrategy(v); setNewGroupExistsError(false); }} />
              {newGroupExistsError && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 14, display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 14, padding: "12px 16px", background: "rgba(247,127,0,0.10)", border: "1.5px solid rgba(247,127,0,0.35)" }}>
                  <AlertCircle size={17} style={{ color: THEME.orange, flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.orange }}>This strategic context group already exists.</div>
                </motion.div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
                <GhostButton onClick={() => { setShowNewGroupForm(false); setNewGroupDA(""); setNewGroupOutcome(""); setNewGroupStrategy(""); setNewGroupExistsError(false); }}>Cancel</GhostButton>
                <PrimaryButton onClick={handleAddNewGroup} disabled={!newGroupDA || !newGroupOutcome || !newGroupStrategy} className="inline-flex items-center gap-2"><FolderOpen size={15} /> Create Group</PrimaryButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
      {actionError && <ErrorBanner msg={actionError} onDismiss={() => setActionError("")} />}
      {filtered.length === 0 && groups.length === 0 ? (
        <Card className="p-10"><div className="text-center text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>No records found. Create a group above to get started.</div></Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([key, group]) => {
            const isUngrouped = key === "__ungrouped__";
            const colors = areaColors[group.developmentArea] || { bg: "rgba(0,0,0,0.04)", border: "rgba(0,0,0,0.13)", accent: THEME.ink, badge: THEME.ink };
            const groupPaps = group.items, isCollapsed = collapsedGroups[key] ?? false;
            return (
              <div key={key} style={{ borderRadius: 20, border: `1.5px solid ${colors.border}`, overflow: "hidden" }}>
                <div style={{ background: colors.bg, padding: "12px 18px", display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={() => setCollapsedGroups((prev) => ({ ...prev, [key]: !isCollapsed }))} style={{ background: "none", border: "none", cursor: "pointer", color: colors.accent || THEME.ink, padding: 0, marginTop: 2, flexShrink: 0 }}>
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {!isUngrouped ? (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0, flexWrap: "wrap", cursor: "pointer" }} onClick={() => setCollapsedGroups((prev) => ({ ...prev, [key]: !isCollapsed }))}>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", borderRadius: 999, padding: "3px 12px", background: colors.badge, color: "#fff", flexShrink: 0, marginTop: 1 }}>{group.developmentArea}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.78)", marginBottom: 2 }}><span style={{ color: "rgba(0,0,0,0.4)", fontWeight: 600 }}>Outcome: </span>{group.outcome}</div>
                        <div style={{ fontSize: 11, color: "rgba(0,0,0,0.6)", lineHeight: 1.5 }}><span style={{ fontWeight: 600 }}>Strategy: </span><span style={{ fontWeight: 700, fontStyle: "italic", color: colors.accent }}>{group.strategy}</span></div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.5)", flex: 1, cursor: "pointer" }} onClick={() => setCollapsedGroups((prev) => ({ ...prev, [key]: !isCollapsed }))}>⚠ Ungrouped PAPs — No strategic context assigned</div>
                  )}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 10px", background: "rgba(247,127,0,0.15)", color: THEME.orange }}>{groupPaps.filter(p => !p.completed).length} ongoing</span>
                    <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 10px", background: "rgba(22,163,74,0.12)", color: "#16a34a" }}>{groupPaps.filter(p => p.completed).length} done</span>
                    <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "3px 10px", background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.55)" }}>{groupPaps.length} total</span>
                    <button onClick={() => setAddingInGroup(addingInGroup === key ? null : key)} style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 10, padding: "5px 12px", fontSize: 11, fontWeight: 700, background: addingInGroup === key ? "rgba(0,0,0,0.08)" : THEME.gradMain, color: addingInGroup === key ? THEME.ink : "#fff", border: "none", cursor: "pointer", transition: "all 0.15s" }}>
                      {addingInGroup === key ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Add PAP</>}
                    </button>
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ borderCollapse: "collapse", tableLayout: "auto", width: "100%" }}>
                          <TableHead />
                          <tbody>
                            {groupPaps.length === 0 && addingInGroup !== key && (
                              <tr><td colSpan={99} style={{ padding: "20px", textAlign: "center", fontSize: 12, color: "rgba(0,0,0,0.4)" }}>No PAPs yet. Click "Add PAP" to create one.</td></tr>
                            )}
                            {groupPaps.map((p, idx) => {
                              const totalTarget = sumQuarterlyTargets(p), totalActual = parseNumLoose(p.actualQ1) + parseNumLoose(p.actualQ2) + parseNumLoose(p.actualQ3) + parseNumLoose(p.actualQ4);
                              return (
                                <tr key={p.id} style={{ background: idx % 2 === 0 ? "#fff" : "rgba(0,0,0,0.018)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                                  <td style={{ padding: "8px 6px", fontSize: 11, color: "rgba(0,0,0,0.4)", fontWeight: 600, whiteSpace: "nowrap" }}>{idx + 1}</td>
                                  <EditableTextCell pap={p} field="title" value={p.title} minWidth={160} />
                                  <EditableTextCell pap={p} field="performanceIndicator" value={p.performanceIndicator} multiline minWidth={150} />
                                  <EditableTextCell pap={p} field="personnelOfficeConcerned" value={p.personnelOfficeConcerned} minWidth={100} />
                                  {visibleQs.map(({ tk, ak }) => {
                                    const t = parseNumLoose(p[tk]), a = parseNumLoose(p[ak]), rem = Math.max(0, t - a);
                                    return (
                                      <React.Fragment key={tk}>
                                        <EditableNumberCell pap={p} field={tk} value={t} tone="target" />
                                        <EditableNumberCell pap={p} field={ak} value={a} tone="actual" />
                                        <td style={{ padding: "8px 4px", textAlign: "center", background: "rgba(214,40,40,0.04)", minWidth: 44 }}>
                                          {t > 0 ? <span style={{ fontSize: 11, fontWeight: 700, color: rem > 0 ? THEME.red : "#16a34a" }}>{rem > 0 ? rem : "✓"}</span> : <span style={{ color: "rgba(0,0,0,0.25)", fontSize: 11 }}>—</span>}
                                        </td>
                                      </React.Fragment>
                                    );
                                  })}
                                  {showTotal && (
                                    <>
                                      <td style={{ padding: "8px 6px", textAlign: "center", minWidth: 58 }}><span style={{ fontSize: 11, fontWeight: 700, color: THEME.orange }}>{totalTarget > 0 ? totalTarget : "—"}</span></td>
                                      <td style={{ padding: "8px 6px", textAlign: "center", minWidth: 58 }}><span style={{ fontSize: 11, fontWeight: 700, color: totalActual >= totalTarget && totalTarget > 0 ? "#16a34a" : totalActual > 0 ? THEME.orange : "rgba(0,0,0,0.3)" }}>{totalActual > 0 ? totalActual : "—"}</span></td>
                                    </>
                                  )}
                                  <td style={{ padding: "8px 6px", whiteSpace: "nowrap", minWidth: 100 }}><span style={{ fontSize: 11, fontWeight: 600, color: THEME.ink }}>{formatCurrencyPHP(p.totalEstimatedCost || 0)}</span></td>
                                  <EditableTextCell pap={p} field="fundSource" value={p.fundSource} minWidth={90} />
                                  <EditableTextCell pap={p} field="risks" value={p.risks} multiline minWidth={120} />
                                  <td onDoubleClick={() => beginTextEdit(p.id, "probability", p.probability || "")} title="Double-click to edit" style={{ padding: "8px 6px", minWidth: 95, cursor: "cell" }}>
                                    {textEditKey === `${p.id}:probability` ? (
                                      <select autoFocus value={textDraft} onChange={(e) => setTextDraft(e.target.value)} onBlur={() => commitTextEdit()} style={{ fontSize: 11, borderRadius: 8, padding: "4px 6px", border: "1px solid rgba(0,0,0,0.18)", outline: "none" }}>
                                        <option value="">—</option>
                                        {["Rare (1)", "Unlikely (2)", "Possible (3)", "Probable (4)", "Almost Certain (5)"].map((o) => <option key={o} value={o}>{o}</option>)}
                                      </select>
                                    ) : <div style={{ fontSize: 11, color: "rgba(0,0,0,0.72)" }}>{p.probability || "—"}</div>}
                                  </td>
                                  <td onDoubleClick={() => beginTextEdit(p.id, "severity", p.severity || "")} title="Double-click to edit" style={{ padding: "8px 6px", minWidth: 95, cursor: "cell" }}>
                                    {textEditKey === `${p.id}:severity` ? (
                                      <select autoFocus value={textDraft} onChange={(e) => setTextDraft(e.target.value)} onBlur={() => commitTextEdit()} style={{ fontSize: 11, borderRadius: 8, padding: "4px 6px", border: "1px solid rgba(0,0,0,0.18)", outline: "none" }}>
                                        <option value="">—</option>
                                        {["Insignificant (1)", "Minor (2)", "Major (3)", "Critical (4)", "Catastrophic (5)"].map((o) => <option key={o} value={o}>{o}</option>)}
                                      </select>
                                    ) : <div style={{ fontSize: 11, color: "rgba(0,0,0,0.72)" }}>{p.severity || "—"}</div>}
                                  </td>
                                  <td onDoubleClick={() => beginTextEdit(p.id, "riskExposure", p.riskExposure || "Low")} title="Double-click to edit" style={{ padding: "8px 6px", textAlign: "center", minWidth: 80, cursor: "cell" }}>
                                    {textEditKey === `${p.id}:riskExposure` ? (
                                      <select autoFocus value={textDraft} onChange={(e) => setTextDraft(e.target.value)} onBlur={() => commitTextEdit()} style={{ fontSize: 11, borderRadius: 8, padding: "4px 6px", border: "1px solid rgba(0,0,0,0.18)", outline: "none" }}>
                                        <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                                      </select>
                                    ) : <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 8px", background: `${riskColor(p.riskExposure)}18`, color: riskColor(p.riskExposure) }}>{p.riskExposure || "—"}</span>}
                                  </td>
                                  <EditableTextCell pap={p} field="mitigatingActivities" value={p.mitigatingActivities} multiline minWidth={130} />
                                  <StatusCell pap={p} />
                                  <td style={{ padding: "8px 6px", textAlign: "center", minWidth: 44 }}>
                                    <button onClick={() => handleDeletePap(p.id)} disabled={deleteLoading === p.id} title="Delete this PAP" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 8, padding: "5px 6px", background: "rgba(214,40,40,0.08)", color: THEME.red, border: "none", cursor: "pointer" }}>
                                      {deleteLoading === p.id ? <Spinner size={13} /> : <Trash2 size={13} />}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {addingInGroup === key && <InlineAddRow groupKey={key} group={group} />}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
      <AnimatePresence>
        {completingPap && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0" onClick={() => setCompletingPap(null)} style={{ background: "rgba(0,0,0,0.38)" }} />
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.2 }} className="relative w-full max-w-xl">
              <Card className="p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-extrabold" style={{ color: THEME.ink }}>Mark as Accomplished</div>
                    <div className="mt-1 text-sm" style={{ color: "rgba(0,0,0,0.65)" }}>PAP: <span className="font-semibold" style={{ color: THEME.ink }}>{completingPap.title}</span></div>
                  </div>
                  <button onClick={() => setCompletingPap(null)} style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 14, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: THEME.ink, cursor: "pointer" }}>Close</button>
                </div>
                <div className="mt-5">
                  <Textarea label="Evidence link(s) (required)" value={evidenceInput} onChange={(v) => { setEvidenceInput(v); setEvidenceError(""); }} placeholder={"Paste one or more links.\nExample:\nhttps://drive.google.com/..."} rows={4} />
                  {evidenceError ? <div className="mt-2 flex items-center gap-1 text-xs font-medium" style={{ color: THEME.red }}><AlertTriangle className="h-3.5 w-3.5" />{evidenceError}</div>
                    : <div className="mt-2 text-xs" style={{ color: "rgba(0,0,0,0.55)" }}>Tip: Separate links by new lines, spaces, or commas.</div>}
                </div>
                <div className="mt-6 flex gap-2 justify-end">
                  <GhostButton onClick={() => setCompletingPap(null)}>Cancel</GhostButton>
                  <PrimaryButton onClick={handleConfirmComplete} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Confirm Completion</PrimaryButton>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
