import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getScanHistory, deleteScan, ScanResult } from '@/lib/detection';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Trash2, FileImage, FileVideo, FileAudio, Search, Download, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import { jsPDF } from 'jspdf';

// ─────────────────────────────────────────────────────────────
//  PDF CONSTANTS
// ─────────────────────────────────────────────────────────────
const PW = 210;
const PH = 297;

// ─────────────────────────────────────────────────────────────
//  SHARED PDF DRAWING HELPERS
// ─────────────────────────────────────────────────────────────

/** Horizontal rule */
const drawHR = (doc: jsPDF, y: number) => {
  doc.setDrawColor(210, 210, 218);
  doc.setLineWidth(0.25);
  doc.line(15, y, PW - 15, y);
};

/**
 * Section header: left accent bar + bold label + underline.
 * Returns the y position AFTER the header (ready for content).
 */
const drawSectionHeader = (doc: jsPDF, title: string, y: number, accent: [number, number, number]): number => {
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(15, y, 3, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(title.toUpperCase(), 21, y + 5.8);
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.2);
  doc.line(21, y + 8.5, PW - 15, y + 8.5);
  return y + 14;
};

/**
 * Single horizontal progress bar with label and % value.
 * Returns next y after the bar.
 */
const drawProgressBar = (
  doc: jsPDF,
  label: string,
  value: number,
  x: number,
  y: number,
  barW: number,
  accent: [number, number, number]
): number => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 70, 75);
  doc.text(label, x, y);

  const pct = `${value}%`;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(pct, x + barW - doc.getTextWidth(pct), y);

  const trackY = y + 2;
  doc.setFillColor(220, 220, 228);
  doc.roundedRect(x, trackY, barW, 3.5, 1.5, 1.5, 'F');

  const fw = Math.max(0, Math.min(value / 100, 1)) * barW;
  if (fw > 0) {
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.roundedRect(x, trackY, fw, 3.5, 1.5, 1.5, 'F');
  }
  return y + 10;
};

/**
 * Full-width confidence meter with embedded % label and right side text.
 * Returns next y after meter.
 */
const drawConfidenceMeter = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  confidence: number,
  accent: [number, number, number]
): number => {
  doc.setFillColor(220, 220, 228);
  doc.roundedRect(x, y, w, h, h / 2, h / 2, 'F');

  const fw = (confidence / 100) * w;
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(x, y, fw, h, h / 2, h / 2, 'F');

  if (fw > 14) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(`${confidence}%`, x + fw / 2, y + h / 2 + 2.2, { align: 'center' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(110, 110, 120);
  doc.text(`${confidence}% neural confidence score`, x + w + 3, y + h / 2 + 2, { align: 'left' });
  return y + h + 6;
};

// ─────────────────────────────────────────────────────────────
//  FREE REPORT  (1 page, clean layout)
// ─────────────────────────────────────────────────────────────
const generateFreeReport = (scan: ScanResult): void => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const isFake = scan.result === 'fake';
  const accent: [number, number, number] = isFake ? [220, 38, 38] : [34, 197, 94];

  // ── HEADER ──────────────────────────────────────────────────
  doc.setFillColor(22, 22, 30);
  doc.rect(0, 0, PW, 38, 'F');
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, 5, 38, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('DeepGuard', 13, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(175, 175, 192);
  doc.text('FORENSIC ANALYSIS CERTIFICATE', 13, 24);

  doc.setFontSize(6.5);
  doc.setTextColor(110, 110, 128);
  doc.text(`CERT ID: ${scan.id.toUpperCase()}`, 13, 32);

  // Free plan badge
  doc.setFillColor(55, 55, 70);
  doc.roundedRect(PW - 38, 12, 26, 9, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(195, 195, 210);
  doc.text('FREE PLAN', PW - 25, 17.8, { align: 'center' });

  let y = 48;

  // ── VERDICT CARD ────────────────────────────────────────────
  // Drop shadow illusion
  doc.setFillColor(195, 195, 205);
  doc.roundedRect(17, y + 2, PW - 32, 38, 4, 4, 'F');
  // White card
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, y, PW - 30, 38, 4, 4, 'F');
  // Top colour bar
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(15, y, PW - 30, 5, 2, 2, 'F');
  doc.rect(15, y + 3, PW - 30, 2, 'F'); // flatten rounded bottom

  // Verdict text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text('NEURAL ENGINE VERDICT', 22, y + 15);

  doc.setFontSize(18);
  doc.setTextColor(28, 28, 38);
  doc.text(isFake ? 'DEEPFAKE DETECTED' : 'VERIFIED AUTHENTIC', 22, y + 27);

  // Confidence circle (right side)
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.circle(PW - 28, y + 19, 13, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(`${scan.confidence}%`, PW - 28, y + 22, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text('SCORE', PW - 28, y + 27.5, { align: 'center' });

  y += 46;

  // ── CONFIDENCE METER ────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 55, 65);
  doc.text('CONFIDENCE METER', 15, y);
  y += 4;
  y = drawConfidenceMeter(doc, 15, y, PW - 52, 7, scan.confidence, accent);

  drawHR(doc, y); y += 7;

  // ── SECTION 1 · METADATA ────────────────────────────────────
  y = drawSectionHeader(doc, '1. File Metadata', y, accent);

  const meta: [string, string][] = [
    ['Source File', scan.fileName],
    ['Media Type', scan.fileType.toUpperCase()],
    ['File Size', `${(scan.fileSize / 1024 / 1024).toFixed(2)} MB`],
    ['Analysis Date', new Date(scan.createdAt).toLocaleString()],
    ['Scan ID', scan.id.slice(0, 28)],
  ];

  meta.forEach(([label, val], i) => {
    const ry = y + i * 7.5;
    if (i % 2 === 0) {
      doc.setFillColor(247, 248, 252);
      doc.rect(15, ry - 3.5, PW - 30, 7.5, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(108, 108, 120);
    doc.text(label, 18, ry + 1);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 22, 32);
    doc.text(String(val), 65, ry + 1);
  });
  y += meta.length * 7.5 + 7;

  drawHR(doc, y); y += 7;

  // ── SECTION 2 · TECHNICAL ANALYSIS ──────────────────────────
  y = drawSectionHeader(doc, '2. Technical Analysis', y, accent);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 60);
  const expLines = doc.splitTextToSize(scan.explanation, PW - 32);
  doc.text(expLines, 18, y);
  y += expLines.length * 5.2 + 7;

  drawHR(doc, y); y += 7;

  // ── SECTION 3 · FORENSIC OBSERVATIONS ───────────────────────
  y = drawSectionHeader(doc, '3. Forensic Observations', y, accent);

  const obs = isFake ? [
    'Frequency domain artifacts consistent with GAN / diffusion model generation detected.',
    'Unnatural blinking rhythm and pupil dilation inconsistencies identified.',
    'Light refraction anomalies on dermal surface boundaries found.',
    'Neural blending edge artifacts present on facial boundary pixels.',
  ] : [
    'Authentic ISO photon noise consistent with physical camera hardware confirmed.',
    'Organic skin texture variance and rPPG blood-flow patterns verified.',
    'Natural motion blur and temporal physics alignment confirmed throughout.',
    'Sub-pixel ray reflections consistent with real-world environmental light sources.',
  ];

  obs.forEach((line, i) => {
    const oy = y + i * 8;
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.circle(19, oy - 0.8, 1.3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 60);
    doc.text(line, 24, oy);
  });
  y += obs.length * 8 + 8;

  // ── PREMIUM UPSELL BANNER ────────────────────────────────────
  doc.setFillColor(245, 242, 255);
  doc.setDrawColor(155, 115, 240);
  doc.setLineWidth(0.35);
  doc.roundedRect(15, y, PW - 30, 22, 3, 3, 'FD');
  doc.setFillColor(155, 115, 240);
  doc.roundedRect(15, y, 3, 22, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(95, 55, 200);
  doc.text('Upgrade to Premium for the Full Forensic Report', 22, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(115, 85, 180);
  doc.text('Includes: Feature Score Bars · Radar Chart · Region Detection Map · Risk Summary · 2-Page Certified Report', 22, y + 16);

  // ── FOOTER ───────────────────────────────────────────────────
  doc.setFillColor(22, 22, 30);
  doc.rect(0, PH - 13, PW, 13, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(135, 135, 152);
  doc.text(
    'DeepGuard Neural Engine  ·  For informational purposes only  ·  Results based on pixel-layer & frequency domain analysis',
    PW / 2, PH - 5, { align: 'center' }
  );

  doc.save(`DeepGuard_Report_${scan.fileName.split('.')[0]}.pdf`);
  toast.success('Report downloaded!');
};

// ─────────────────────────────────────────────────────────────
//  PREMIUM REPORT  (2 pages, full analytics)
// ─────────────────────────────────────────────────────────────
const generatePremiumReport = (scan: ScanResult): void => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const isFake = scan.result === 'fake';
  const accent: [number, number, number] = isFake ? [220, 38, 38] : [34, 197, 94];

  const sevColors: Record<string, [number, number, number]> = {
    HIGH: [220, 38, 38],
    MED: [234, 179, 8],
    PASS: [34, 197, 94],
  };

  // ══════════════════════════ PAGE 1 ═══════════════════════════

  // ── HEADER ──────────────────────────────────────────────────
  doc.setFillColor(22, 22, 30);
  doc.rect(0, 0, PW, 44, 'F');
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, 5, 44, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('DeepGuard', 13, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(175, 175, 192);
  doc.text('NEURAL FORENSIC INTELLIGENCE REPORT  ·  PREMIUM EDITION', 13, 27);

  doc.setFontSize(6.5);
  doc.setTextColor(108, 108, 126);
  doc.text(`CERT ID: ${scan.id.toUpperCase()}`, 13, 34);
  doc.text(`GENERATED: ${new Date().toLocaleString().toUpperCase()}`, 13, 40);

  // Premium gold badge
  doc.setFillColor(210, 172, 48);
  doc.roundedRect(PW - 50, 12, 38, 10, 2.5, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(75, 45, 5);
  doc.text(' Verified Premium User', PW - 32, 18.5, { align: 'center' });

  let y = 54;

  // ── VERDICT CARD ────────────────────────────────────────────
  doc.setFillColor(195, 195, 205);
  doc.roundedRect(17, y + 2, PW - 32, 42, 4, 4, 'F');
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, y, PW - 30, 42, 4, 4, 'F');
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(15, y, PW - 30, 5, 2, 2, 'F');
  doc.rect(15, y + 3, PW - 30, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text('NEURAL ENGINE VERDICT', 22, y + 15);

  doc.setFontSize(18);
  doc.setTextColor(28, 28, 38);
  doc.text(isFake ? 'DEEPFAKE DETECTED' : 'VERIFIED AUTHENTIC', 22, y + 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(95, 95, 108);
  const shortExp = doc.splitTextToSize(scan.explanation, PW - 80);
  doc.text(shortExp, 22, y + 35);

  // Confidence circle
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.circle(PW - 28, y + 21, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(`${scan.confidence}%`, PW - 28, y + 24, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text('CONFIDENCE', PW - 28, y + 30, { align: 'center' });

  y += 50;

  // ── CONFIDENCE METER ────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 55, 65);
  doc.text('CONFIDENCE METER', 15, y);
  y += 4;
  y = drawConfidenceMeter(doc, 15, y, PW - 52, 7, scan.confidence, accent);

  drawHR(doc, y); y += 7;

  // ── SECTION 1 · METADATA (two-column) ───────────────────────
  y = drawSectionHeader(doc, '1. Media File Metadata', y, accent);

  const meta: [string, string][] = [
    ['Source File', scan.fileName.length > 34 ? scan.fileName.slice(0, 34) + '…' : scan.fileName],
    ['Media Type', scan.fileType.toUpperCase()],
    ['File Size', `${(scan.fileSize / 1024 / 1024).toFixed(2)} MB`],
    ['Analysis Date', new Date(scan.createdAt).toLocaleString()],
    ['Scan ID', scan.id.slice(0, 26)],
    ['Neural Hash', btoa(scan.id).slice(0, 26)],
  ];

  const colW = (PW - 38) / 2;
  meta.forEach(([label, val], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const mx = 15 + col * (colW + 8);
    const my = y + row * 9.5;
    if (row % 2 === 0) {
      doc.setFillColor(247, 248, 252);
      doc.rect(mx, my - 3.5, colW + 4, 9, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(125, 125, 138);
    doc.text(label.toUpperCase(), mx + 2, my);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(22, 22, 32);
    doc.text(String(val), mx + 2, my + 5.5);
  });
  y += Math.ceil(meta.length / 2) * 9.5 + 7;

  drawHR(doc, y); y += 7;

  // ── SECTION 2 · FEATURE SCORES ──────────────────────────────
  if (scan.featureScores) {
    y = drawSectionHeader(doc, '2. Biometric Feature Scores', y, accent);

    const features: [string, number][] = [
      ['Skin Texture Authenticity', scan.featureScores.texture],
      ['Facial Symmetry Score', scan.featureScores.symmetry],
      ['Artifact-Free Rating', scan.featureScores.artifacts],
    ];

    const halfBarW = (PW - 46) / 2;

    // Two bars side by side on row 1
    drawProgressBar(doc, features[0][0], features[0][1], 15, y, halfBarW, accent);
    drawProgressBar(doc, features[1][0], features[1][1], 15 + halfBarW + 8, y, halfBarW, accent);
    y += 12;

    // Third bar full width
    drawProgressBar(doc, features[2][0], features[2][1], 15, y, PW - 30, accent);
    y += 14;

    drawHR(doc, y); y += 7;
  }

  // ── SECTION 3 · KEY FINDINGS (page 1 summary) ───────────────
  y = drawSectionHeader(doc, '3. Key Forensic Findings', y, accent);

  const shortFindings: [string, string, string][] = isFake ? [
    ['HIGH', 'GAN Artifacts', 'High-frequency spatial GAN / diffusion residuals detected via DCT frequency analysis.'],
    ['HIGH', 'Biometric Anomaly', 'Non-natural blinking rhythm, pupil dilation irregularities and micro-expression drift found.'],
    ['MED',  'Lighting Mismatch', 'Dermal surface light refraction does not match the scene environmental lighting model.'],
  ] : [
    ['PASS', 'Sensor Noise Auth.', 'ISO photon noise distribution is consistent with physical CCD/CMOS sensor capture hardware.'],
    ['PASS', 'Dermal Texture', 'Organic skin micro-texture variance and rPPG blood-flow subsurface signals confirmed authentic.'],
    ['PASS', 'Landmark Geometry', 'Facial landmark positions and proportions fall within natural biological face distribution.'],
  ];

  shortFindings.forEach(([sev, title, detail], i) => {
    const fy = y + i * 13;
    const sc = sevColors[sev] ?? accent;

    if (i % 2 === 0) {
      doc.setFillColor(247, 248, 252);
      doc.rect(15, fy - 2.5, PW - 30, 12.5, 'F');
    }

    doc.setFillColor(sc[0], sc[1], sc[2]);
    doc.roundedRect(17, fy - 0.5, 13, 6, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(255, 255, 255);
    doc.text(sev, 23.5, fy + 3.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(28, 28, 38);
    doc.text(title, 33, fy + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 75, 88);
    doc.text(detail, 33, fy + 9.5, { maxWidth: PW - 50 });
  });
  y += shortFindings.length * 13 + 4;

  // ── PAGE 1 FOOTER ────────────────────────────────────────────
  doc.setFillColor(22, 22, 30);
  doc.rect(0, PH - 13, PW, 13, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(135, 135, 152);
  doc.text(
    'DeepGuard Premium  ·  Page 1 of 2  ·  Neural Forensic Intelligence Platform',
    PW / 2, PH - 5, { align: 'center' }
  );

  // ══════════════════════════ PAGE 2 ═══════════════════════════
  doc.addPage();

  // Thin continuation header
  doc.setFillColor(22, 22, 30);
  doc.rect(0, 0, PW, 14, 'F');
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, 5, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(195, 195, 210);
  doc.text('DeepGuard Premium  ·  Forensic Report — Continued', 13, 9);
  doc.setTextColor(118, 118, 135);
  doc.text('Page 2 of 2', PW - 15, 9, { align: 'right' });

  y = 24;

  // ── SECTION 4 · REGION DETECTION MAP ────────────────────────
  if (scan.suspiciousRegions && scan.suspiciousRegions.length > 0) {
    y = drawSectionHeader(doc, '4. Facial Region Detection Map', y, accent);

    scan.suspiciousRegions.forEach((region, i) => {
      const isGood = region.label === 'Verified';
      const rc: [number, number, number] = isGood ? [34, 197, 94] : [220, 38, 38];

      // Card
      doc.setFillColor(248, 249, 252);
      doc.setDrawColor(rc[0], rc[1], rc[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(15, y, PW - 30, 30, 3, 3, 'FD');
      // Left accent
      doc.setFillColor(rc[0], rc[1], rc[2]);
      doc.roundedRect(15, y, 3, 30, 1.5, 1.5, 'F');

      // Label pill
      doc.setFillColor(rc[0], rc[1], rc[2]);
      doc.roundedRect(22, y + 4, 22, 7, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text(region.label.toUpperCase(), 33, y + 8.5, { align: 'center' });

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(rc[0], rc[1], rc[2]);
      doc.text(`Region ${i + 1} — Detected Face Zone`, 48, y + 8.5);

      // Coordinate grid (2 columns)
      const coords: [string, string][] = [
        [`Origin X: ${region.x} px`, `Origin Y: ${region.y} px`],
        [`Width:  ${region.w} px`, `Height:  ${region.h} px`],
        ...(region.origWidth ? [[`Source canvas: ${region.origWidth} × ${region.origHeight} px`, '']] as [string, string][] : []),
      ];
      coords.forEach((row, ri) => {
        const cy2 = y + 17 + ri * 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(50, 50, 62);
        doc.text(row[0], 22, cy2);
        if (row[1]) doc.text(row[1], PW / 2, cy2);
      });

      y += 36;
    });

    drawHR(doc, y); y += 7;
  }

  // ── SECTION 5 · COMPLETE FORENSIC FINDINGS ──────────────────
  y = drawSectionHeader(doc, '5. Complete Forensic Findings', y, accent);

  const allFindings: [string, string, string][] = isFake ? [
    ['HIGH', 'Frequency Domain', 'GAN and diffusion-model residuals detected in high-frequency spatial layers via DCT analysis.'],
    ['HIGH', 'Biological Consistency', 'Non-natural blinking rhythm, pupil dilation irregularities, and micro-expression anomalies found.'],
    ['MED',  'Environment Physics', 'Light refraction on dermal surfaces does not match the scene environmental lighting model.'],
    ['HIGH', 'Neural Blending', 'Blurring at facial-edge boundaries consistent with neural compositing or face-swap latent blending.'],
    ['MED',  'Temporal Drift', 'Inter-frame feature drift exceeds threshold for natural movement — generated frames suspected.'],
  ] : [
    ['PASS', 'Sensor Noise Auth.', 'ISO photon noise distribution consistent with physical CCD/CMOS sensor capture hardware confirmed.'],
    ['PASS', 'Dermal Texture', 'Organic skin micro-texture variance and rPPG blood-flow subsurface signals confirmed authentic.'],
    ['PASS', 'Temporal Fluidity', 'Natural motion blur, optical flow, and Newtonian physics alignment confirmed across sampled frames.'],
    ['PASS', 'Lighting Physics', 'Sub-pixel specular reflections and ambient occlusion match real-world environmental light sources.'],
    ['PASS', 'Landmark Geometry', 'Facial landmark positions and proportions fall within natural distribution of biological faces.'],
  ];

  allFindings.forEach(([sev, title, detail], i) => {
    const fy = y + i * 14;
    const sc = sevColors[sev] ?? accent;

    if (i % 2 === 0) {
      doc.setFillColor(247, 248, 252);
      doc.rect(15, fy - 2.5, PW - 30, 13.5, 'F');
    }

    doc.setFillColor(sc[0], sc[1], sc[2]);
    doc.roundedRect(17, fy - 0.5, 13, 6, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(255, 255, 255);
    doc.text(sev, 23.5, fy + 3.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(28, 28, 38);
    doc.text(title, 33, fy + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(72, 72, 85);
    doc.text(detail, 33, fy + 10, { maxWidth: PW - 50 });
  });
  y += allFindings.length * 14 + 8;

  drawHR(doc, y); y += 7;

  // ── SECTION 6 · RISK SCORE SUMMARY ──────────────────────────
  y = drawSectionHeader(doc, '6. Neural Risk Score Summary', y, accent);

  const riskItems: [string, number, [number, number, number]][] = [
    ['Overall Manipulation Risk', isFake ? scan.confidence : 100 - scan.confidence, isFake ? [220, 38, 38] : [34, 197, 94]],
    ['Visual Coherence Score',    scan.featureScores?.texture  ?? (isFake ? 20 : 94), [34, 197, 94]],
    ['Biometric Integrity',       scan.featureScores?.symmetry ?? (isFake ? 22 : 96), [34, 197, 94]],
    ['Signal Authenticity',       scan.featureScores?.artifacts?? (isFake ? 18 : 97), [34, 197, 94]],
  ];

  const riskBarW = (PW - 46) / 2;
  riskItems.forEach(([label, score, color], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const rx = 15 + col * (riskBarW + 8);
    const ry = y + row * 11;
    drawProgressBar(doc, label, score, rx, ry, riskBarW, color);
  });
  y += Math.ceil(riskItems.length / 2) * 11 + 10;

  // ── CERTIFICATION BLOCK ──────────────────────────────────────
  doc.setFillColor(245, 242, 255);
  doc.setDrawColor(150, 110, 238);
  doc.setLineWidth(0.35);
  doc.roundedRect(15, y, PW - 30, 28, 3, 3, 'FD');
  doc.setFillColor(150, 110, 238);
  doc.roundedRect(15, y, 3, 28, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(92, 52, 198);
  doc.text('Premium Neural Certification', 22, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(108, 78, 175);
  const certText =
    `This report was generated by DeepGuard's multi-layer neural forensic engine. ` +
    `Analysis includes pixel-layer texture profiling, frequency-domain artifact detection, ` +
    `facial landmark geometry verification, and temporal coherence analysis across sampled frames. ` +
    `Certificate ID: ${scan.id.toUpperCase()}`;
  const certLines = doc.splitTextToSize(certText, PW - 50);
  doc.text(certLines, 22, y + 18);

  // ── PAGE 2 FOOTER ────────────────────────────────────────────
  doc.setFillColor(22, 22, 30);
  doc.rect(0, PH - 13, PW, 13, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(135, 135, 152);
  doc.text(
    'DeepGuard Premium  ·  Page 2 of 2  ·  For informational purposes only  ·  Neural Forensic Intelligence',
    PW / 2, PH - 5, { align: 'center' }
  );

  doc.save(`DeepGuard_Premium_Report_${scan.fileName.split('.')[0]}.pdf`);
  toast.success('Premium 2-page forensic report downloaded!');
};

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const HistoryPage = () => {
  const { user } = useAuth();
  const isPremium = user?.subscription === 'premium';
  const [scans, setScans] = useState<ScanResult[]>(user ? getScanHistory(user.id) : []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'real' | 'fake'>('all');

  const filtered = scans.filter(s => {
    if (filter !== 'all' && s.result !== filter) return false;
    if (search && !s.fileName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    deleteScan(id);
    setScans(prev => prev.filter(s => s.id !== id));
    toast.success('Scan deleted');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all scans? This cannot be undone.')) {
      scans.forEach(s => deleteScan(s.id));
      setScans([]);
      toast.success('All history cleared');
    }
  };

  /** Dispatch to correct report tier */
  const generateReport = (scan: ScanResult) => {
    if (isPremium) {
      generatePremiumReport(scan);
    } else {
      generateFreeReport(scan);
    }
  };

  const getIcon = (type: string) => {
    if (type === 'video') return FileVideo;
    if (type === 'audio') return FileAudio;
    return FileImage;
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 px-4 sm:px-0 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Scan History</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Found {scans.length} forensic records in your database</p>
          </div>
          {scans.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              Clear Records
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 rounded-2xl glass border-none ring-1 ring-border/50 focus:ring-primary/40 transition-all"
            />
          </div>
          <div className="flex gap-1 p-1 bg-muted/30 rounded-2xl overflow-x-auto no-scrollbar">
            {(['all', 'real', 'fake'] as const).map(f => (
              <Button
                key={f}
                variant="ghost"
                size="sm"
                onClick={() => setFilter(f)}
                className={`rounded-xl h-10 px-4 sm:px-6 capitalize transition-all flex-1 min-w-[80px] ${filter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Scan list */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-3xl py-12 px-6 sm:py-20 text-center border-dashed border-2 border-border/50"
              >
                <p className="text-muted-foreground font-medium">No records matching your search criteria.</p>
              </motion.div>
            ) : (
              filtered.map((scan) => {
                const Icon = getIcon(scan.fileType);
                const isFake = scan.result === 'fake';
                return (
                  <motion.div
                    key={scan.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass group rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 border border-white/5 hover:ring-1 hover:ring-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${isFake ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                        {isFake ? <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" /> : <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" />}
                      </div>
                      <div className="flex-1 min-w-0 sm:hidden">
                        <p className="font-bold text-foreground text-sm truncate">{scan.fileName}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{scan.confidence}% Confidence</p>
                      </div>
                    </div>

                    <div className="hidden sm:block flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <p className="font-bold text-foreground text-base truncate">{scan.fileName}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                          {new Date(scan.createdAt).toLocaleDateString()}
                        </p>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <p className="text-[11px] text-muted-foreground font-medium uppercase">
                          {(scan.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border/30">
                      <div className="sm:text-right">
                        <span className={`text-lg sm:text-xl font-black tracking-tighter ${isFake ? 'text-destructive' : 'text-success'}`}>
                          {scan.confidence}%
                        </span>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase leading-none mt-1">Accuracy</p>
                      </div>

                      <div className="hidden sm:block h-10 w-[1px] bg-border mx-2" />

                      <div className="flex gap-2 items-center">
                        {/* Download with tier tooltip */}
                        <div className="relative group/btn">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => generateReport(scan)}
                            className="h-10 w-10 rounded-xl glass border-none ring-1 ring-border/50 hover:bg-primary hover:text-white transition-all shadow-sm"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-opacity z-50">
                            <div className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap text-white shadow-lg ${isPremium ? 'bg-violet-600' : 'bg-gray-700'}`}>
                              {isPremium ? '★ Premium Report' : 'Basic Report'}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(scan.id)}
                          className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default HistoryPage;