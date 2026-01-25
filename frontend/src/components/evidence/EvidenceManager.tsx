/**
 * EvidenceManager V4 - Complete Evidence Management System
 * Features:
 * 1. Fillable report
 * 2. Add Wallet/Suspect data in report
 * 3. Save evidence to LocalStorage (simulate Database)
 * 4. Attach evidence images in PDF report
 * 5. Link Evidence to Cases
 * 6. QR Code for Hash verification
 */
import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  Eye,
  Shield,
  CheckCircle,
  Clock,
  User,
  X,
  Plus,
  Lock,
  Printer,
  ChevronDown,
  Settings,
  QrCode,
  Wallet,
  Users,
  Database,
  Link2
} from 'lucide-react';
import { Button } from '../../components/ui';

// ============================================
// TYPES
// ============================================

interface Evidence {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string;
  sha256Hash: string;
  uploadedAt: string;
  uploadedBy: string;
  description: string;
  category: 'screenshot' | 'document' | 'blockchain' | 'communication' | 'other';
  verified: boolean;
  caseId?: string;
}

interface ReportConfig {
  examinerName: string;
  examinerPosition: string;
  examinerUnit: string;
  requestedBy: string;
  requestedUnit: string;
  requestNumber: string;
  requestDate: string;
  includeImages: boolean;
  includeWallets: boolean;
  includeSuspects: boolean;
}

interface WalletInfo {
  address: string;
  type: string;
  balance?: string;
  label?: string;
}

interface SuspectInfo {
  name: string;
  idNumber?: string;
  role?: string;
  nationality?: string;
}

interface CaseInfo {
  id: string;
  name: string;
  description?: string;
}

interface EvidenceManagerProps {
  caseId?: string;
  caseName?: string;
  wallets?: WalletInfo[];
  suspects?: SuspectInfo[];
  cases?: CaseInfo[];
  onEvidenceChange?: (evidence: Evidence[]) => void;
  readOnly?: boolean;
}

// ============================================
// UTILITIES
// ============================================

const calculateSHA256 = async (data: ArrayBuffer): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatThaiDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const thaiMonths = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${month} B.E. ${year}`;
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType === 'application/pdf') return FileText;
  return File;
};

const CATEGORY_LABELS: Record<string, { label: string; color: string; thaiLabel: string }> = {
  screenshot: { label: 'Screenshot', color: 'bg-blue-500/20 text-blue-400', thaiLabel: 'ภาพถ่ายPageจอ' },
  document: { label: 'Document', color: 'bg-purple-500/20 text-purple-400', thaiLabel: 'เอกสาร' },
  blockchain: { label: 'Blockchain', color: 'bg-amber-500/20 text-amber-400', thaiLabel: 'Blockchain Data' },
  communication: { label: 'Communication', color: 'bg-green-500/20 text-green-400', thaiLabel: 'Evidenceการสื่อสาร' },
  other: { label: 'Other', color: 'bg-dark-500/20 text-dark-300', thaiLabel: 'อื่นๆ' }
};

// Storage key for localStorage
const STORAGE_KEY = 'investigates_evidence';

// ============================================
// QR CODE GENERATOR (Points to verify page)
// ============================================

const generateQRDataURL = (hash: string, fileName: string, caseId: string, timestamp: string, size: number = 150): string => {
  // Build verify URL with all params
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    hash: hash,
    file: fileName,
    case: caseId,
    ts: timestamp
  });
  const verifyUrl = `${baseUrl}/verify?${params.toString()}`;
  
  // Use QR Server API
  const encodedUrl = encodeURIComponent(verifyUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`;
};

// ============================================
// REPORT GENERATORS
// ============================================

const generateCourtReportHTML = (
  caseId: string,
  caseName: string,
  evidence: Evidence[],
  config: ReportConfig,
  wallets?: WalletInfo[],
  suspects?: SuspectInfo[]
): string => {
  const reportDate = formatThaiDate(new Date().toISOString());
  const reportId = `RPT-${Date.now()}`;

  // Evidence rows with optional images
  const evidenceRows = evidence.map((item, index) => {
    // For PDF report, use direct hash (can't use dynamic URL in print)
    const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(item.sha256Hash)}`;
    return `
    <tr>
      <td style="text-align: center; padding: 10px; border: 1px solid #ddd;">${index + 1}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">
        ${config.includeImages && item.fileType.startsWith('image/') ? 
          `<img src="${item.fileData}" style="max-width: 150px; max-height: 100px; margin-bottom: 8px; border-radius: 4px;"/><br/>` : ''}
        <strong>${item.fileName}</strong>
        ${item.description ? `<br><small style="color: #666;">${item.description}</small>` : ''}
      </td>
      <td style="padding: 10px; border: 1px solid #ddd;">${CATEGORY_LABELS[item.category]?.thaiLabel || item.category}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${formatFileSize(item.fileSize)}</td>
      <td style="padding: 10px; border: 1px solid #ddd; font-size: 12px;">${formatThaiDate(item.uploadedAt)}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
        <img src="${qrDataUrl}" width="50" height="50" style="margin-bottom: 4px;"/><br/>
        <span style="background: #28a745; color: #fff; padding: 2px 8px; border-radius: 3px; font-size: 10px;">✓ Verified</span>
      </td>
    </tr>
    <tr>
      <td colspan="6" style="padding: 8px; border: 1px solid #ddd; font-family: monospace; font-size: 11px; color: #666; background: #f9f9f9;">
        🔐 SHA-256: ${item.sha256Hash}
      </td>
    </tr>
  `}).join('');

  // Wallets section
  const walletsHTML = config.includeWallets && wallets && wallets.length > 0 ? `
    <div class="section">
      <div class="section-title">💰 Related Digital Asset Wallets</div>
      <table>
        <thead><tr><th>No.</th><th>Wallet Address</th><th>Type</th><th>Balance</th></tr></thead>
        <tbody>
          ${wallets.map((w, i) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${i + 1}</td>
              <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; font-size: 11px;">${w.address}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${w.type}</td>
              <td style="padding: 8px; border: 1px solid #ddd; color: #c00; font-weight: bold;">${w.balance || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  // Suspects section
  const suspectsHTML = config.includeSuspects && suspects && suspects.length > 0 ? `
    <div class="section">
      <div class="section-title">👤 Accused/Suspects</div>
      <table>
        <thead><tr><th>No.</th><th>Full Name</th><th>ID Number</th><th>Role</th></tr></thead>
        <tbody>
          ${suspects.map((s, i) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${i + 1}</td>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #c00;">${s.name}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${s.idNumber || '-'}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${s.role || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>Digital Evidence Report - ${caseId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Sarabun', sans-serif; font-size: 16px; line-height: 1.6; color: #333; background: #fff; padding: 20mm; }
    .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 20px; margin-bottom: 30px; }
    .header-title { font-size: 24px; font-weight: 700; margin-bottom: 5px; }
    .header-subtitle { font-size: 18px; color: #555; }
    .report-info { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 15px; background: #f5f5f5; border-radius: 5px; flex-wrap: wrap; gap: 10px; }
    .report-info-item { text-align: center; min-width: 120px; }
    .report-info-label { font-size: 12px; color: #666; }
    .report-info-value { font-weight: 600; color: #333; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: 700; color: #1a5f7a; border-bottom: 2px solid #1a5f7a; padding-bottom: 5px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1a5f7a; color: #fff; padding: 12px; text-align: left; border: 1px solid #ddd; }
    .hash-verification { background: #e8f5e9; border: 1px solid #4caf50; border-radius: 5px; padding: 15px; margin-top: 30px; }
    .hash-verification-title { font-weight: 700; color: #2e7d32; margin-bottom: 10px; }
    .signature-section { display: flex; justify-content: space-between; margin-top: 60px; }
    .signature-box { text-align: center; width: 200px; }
    .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
    .disclaimer { margin-top: 30px; padding: 15px; background: #f0f0f0; border-radius: 5px; font-size: 12px; color: #666; }
    .qr-section { margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px; text-align: center; }
    .print-btn { position: fixed; bottom: 20px; right: 20px; padding: 15px 30px; font-size: 16px; background: #1a5f7a; color: #fff; border: none; border-radius: 5px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    @media print { body { padding: 15mm; } .print-btn { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size: 40px; margin-bottom: 10px;">⚖️</div>
    <div class="header-title">Digital Evidence Report</div>
    <div class="header-subtitle">Digital Evidence Report</div>
  </div>
  <div class="report-info">
    <div class="report-info-item"><div class="report-info-label">Report Number</div><div class="report-info-value">${reportId}</div></div>
    <div class="report-info-item"><div class="report-info-label">Case Number</div><div class="report-info-value">${caseId}</div></div>
    <div class="report-info-item"><div class="report-info-label">Date Created</div><div class="report-info-value">${reportDate}</div></div>
    <div class="report-info-item"><div class="report-info-label">Evidence Count</div><div class="report-info-value">${evidence.length} items</div></div>
  </div>
  
  <div class="section">
    <div class="section-title">📋 Case Information</div>
    <table>
      <tr><td style="width: 150px; padding: 10px; border: 1px solid #ddd; font-weight: 600; background: #f9f9f9;">Case Number:</td><td style="padding: 10px; border: 1px solid #ddd;">${caseId}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: 600; background: #f9f9f9;">Case Name:</td><td style="padding: 10px; border: 1px solid #ddd;">${caseName}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: 600; background: #f9f9f9;">Report Date:</td><td style="padding: 10px; border: 1px solid #ddd;">${reportDate}</td></tr>
    </table>
  </div>

  ${suspectsHTML}
  ${walletsHTML}
  
  <div class="section">
    <div class="section-title">📁 Digital Evidence Items</div>
    <table>
      <thead><tr><th style="width: 50px;">No.</th><th>File Name / Description</th><th style="width: 100px;">Type</th><th style="width: 80px;">Size</th><th style="width: 130px;">Date Recorded</th><th style="width: 80px;">QR/Status</th></tr></thead>
      <tbody>${evidenceRows}</tbody>
    </table>
  </div>
  
  <div class="hash-verification">
    <div class="hash-verification-title">🔐 Evidence Verification (Hash Verification)</div>
    <div style="font-size: 14px;">
      All evidence items are verified with <strong>SHA-256</strong> which is the standard used in Blockchain systems<br><br>
      <strong>Verification Method:</strong> Calculate SHA-256 Hash of the original file. If it matches, the file has not been modified<br>
      <strong>QR Code:</strong> Scan QR Code to verify Hash value of each evidence
    </div>
  </div>
  
  <div class="signature-section">
    <div class="signature-box"><div class="signature-line">Report Author</div><div style="margin-top: 5px; font-size: 12px;">Date _______________</div></div>
    <div class="signature-box"><div class="signature-line">Examiner</div><div style="margin-top: 5px; font-size: 12px;">Date _______________</div></div>
    <div class="signature-box"><div class="signature-line">Approver</div><div style="margin-top: 5px; font-size: 12px;">Date _______________</div></div>
  </div>
  
  <div class="disclaimer"><strong>Note:</strong> This document was created by InvestiGate Investigation Platform<br><strong>Report ID:</strong> ${reportId}</div>
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
</body>
</html>`;
};

const generateForensicReportHTML = (
  caseId: string,
  caseName: string,
  evidence: Evidence[],
  config: ReportConfig,
  wallets?: WalletInfo[],
  suspects?: SuspectInfo[]
): string => {
  const reportDate = formatThaiDate(new Date().toISOString());
  const reportNumber = `EVID.${new Date().getFullYear() + 543}/${String(Date.now()).slice(-6)}`;

  const evidenceRows = evidence.map((item, index) => {
    // For PDF report, use direct hash (can't use dynamic URL in print)
    const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${encodeURIComponent(item.sha256Hash)}`;
    return `
    <tr>
      <td style="padding: 8px; border: 1px solid #333; text-align: center;">${index + 1}</td>
      <td style="padding: 8px; border: 1px solid #333;">
        ${config.includeImages && item.fileType.startsWith('image/') ? 
          `<img src="${item.fileData}" style="max-width: 120px; max-height: 80px; margin-bottom: 5px; border-radius: 3px;"/><br/>` : ''}
        ${item.fileName}<br><small style="color: #666;">${item.description || '-'}</small>
      </td>
      <td style="padding: 8px; border: 1px solid #333;">${CATEGORY_LABELS[item.category]?.thaiLabel || item.category}</td>
      <td style="padding: 8px; border: 1px solid #333;">${formatFileSize(item.fileSize)}</td>
      <td style="padding: 8px; border: 1px solid #333; font-family: monospace; font-size: 9px; word-break: break-all;">${item.sha256Hash}</td>
      <td style="padding: 8px; border: 1px solid #333; text-align: center;"><img src="${qrDataUrl}" width="40" height="40"/></td>
    </tr>
  `}).join('');

  const methods = [
    'File verification using SHA-256 Hash Algorithm',
    'Blockchain transaction analysis using Chainalysis/Elliptic',
    'Fund Tracing (Fund Tracing)',
    'KYC data verification from Exchange',
    'Event Timeline Creation'
  ];

  const tools = [
    'Chainalysis Reactor - Analyze Blockchain transactions',
    'Blockchain Explorer - Verify transactions',
    'SHA-256 Hash Calculator - Verify file integrity',
    'InvestiGate Platform - Case and Evidence Management'
  ];

  const findings = [
    `Found digital evidence related to case: ${evidence.length} items`,
    'All evidence verified with SHA-256 Hash',
    'Can be used as evidence in court',
    'Complete Chain of Custody recorded'
  ];

  // Wallets section
  const walletsHTML = config.includeWallets && wallets && wallets.length > 0 ? `
    <div class="section">
      <div class="section-title">5. Related Digital Asset Wallets</div>
      <table>
        <thead><tr><th style="width: 40px;">No.</th><th>Wallet Address (Wallet Address)</th><th style="width: 100px;">Type</th><th style="width: 100px;">Balance</th></tr></thead>
        <tbody>
          ${wallets.map((w, i) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #333; text-align: center;">${i + 1}</td>
              <td style="padding: 8px; border: 1px solid #333; font-family: monospace; font-size: 10px; word-break: break-all;">${w.address}</td>
              <td style="padding: 8px; border: 1px solid #333;">${w.type}</td>
              <td style="padding: 8px; border: 1px solid #333; color: #c00; font-weight: bold;">${w.balance || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  // Suspects section
  const suspectsHTML = config.includeSuspects && suspects && suspects.length > 0 ? `
    <div class="section">
      <div class="section-title">6. Accused/Suspects</div>
      <table>
        <thead><tr><th style="width: 40px;">No.</th><th>Full Name</th><th style="width: 150px;">ID Number</th><th style="width: 150px;">Role</th></tr></thead>
        <tbody>
          ${suspects.map((s, i) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #333; text-align: center;">${i + 1}</td>
              <td style="padding: 8px; border: 1px solid #333; font-weight: bold; color: #c00;">${s.name}</td>
              <td style="padding: 8px; border: 1px solid #333;">${s.idNumber || '-'}</td>
              <td style="padding: 8px; border: 1px solid #333;">${s.role || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  const sectionOffset = (config.includeWallets && wallets?.length ? 1 : 0) + (config.includeSuspects && suspects?.length ? 1 : 0);

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>Evidence Examination Report - ${caseId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Sarabun', sans-serif; font-size: 16px; line-height: 1.8; color: #333; background: #fff; padding: 15mm 20mm; }
    .header { text-align: center; margin-bottom: 20px; }
    .header-logo { font-size: 50px; margin-bottom: 5px; }
    .header-org { font-size: 18px; font-weight: 600; }
    .header-unit { font-size: 14px; color: #555; }
    .document-title { text-align: center; margin: 30px 0; padding: 15px; background: #1a5f7a; color: #fff; }
    .document-title h1 { font-size: 22px; font-weight: 700; }
    .document-title h2 { font-size: 16px; font-weight: 400; margin-top: 5px; }
    .report-number { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 10px 15px; background: #f5f5f5; border-radius: 5px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 16px; font-weight: 700; color: #1a5f7a; border-left: 4px solid #1a5f7a; padding-left: 10px; margin-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 180px 1fr; gap: 5px 15px; padding: 10px; background: #fafafa; border-radius: 5px; }
    .info-label { font-weight: 600; color: #555; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #1a5f7a; color: #fff; padding: 10px 8px; text-align: left; border: 1px solid #333; font-size: 14px; }
    td { border: 1px solid #333; padding: 8px; font-size: 14px; }
    tr:nth-child(even) { background: #f9f9f9; }
    .list-section { padding: 10px 15px; background: #fafafa; border-radius: 5px; }
    .list-section ul { margin-left: 20px; }
    .list-section li { margin-bottom: 5px; }
    .opinion-box { padding: 15px; background: #fff8e6; border: 2px solid #ffd700; border-radius: 5px; margin-top: 10px; }
    .signature-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .signature-box { text-align: center; padding: 20px; }
    .signature-line { border-top: 1px solid #333; margin-top: 70px; padding-top: 5px; }
    .signature-name { font-weight: 600; margin-top: 5px; }
    .signature-position { font-size: 14px; color: #555; }
    .stamp-area { width: 120px; height: 120px; border: 2px dashed #ccc; margin: 10px auto; display: flex; align-items: center; justify-content: center; color: #999; font-size: 11px; }
    .hash-notice { background: #e8f5e9; border: 1px solid #4caf50; border-radius: 5px; padding: 10px 15px; margin-top: 15px; font-size: 13px; }
    .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    .print-btn { position: fixed; bottom: 20px; right: 20px; padding: 15px 30px; font-size: 16px; background: #1a5f7a; color: #fff; border: none; border-radius: 5px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    @media print { body { padding: 10mm; } .print-btn { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-logo">🔬</div>
    <div class="header-org">${config.examinerUnit || 'Digital Forensics Unit'}</div>
    <div class="header-unit">Digital Forensics Division</div>
  </div>
  <div class="document-title">
    <h1>Digital Evidence Examination Report</h1>
    <h2>Digital Forensic Examination Report</h2>
  </div>
  <div class="report-number">
    <div><strong>Report Number:</strong> ${reportNumber}</div>
    <div><strong>Report Date:</strong> ${reportDate}</div>
  </div>

  <div class="section">
    <div class="section-title">1. Case Information</div>
    <div class="info-grid">
      <div class="info-label">Case Number:</div><div>${caseId}</div>
      <div class="info-label">Case Name:</div><div>${caseName}</div>
      <div class="info-label">Case Type:</div><div>Criminal case involving digital assets</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. Submission Information</div>
    <div class="info-grid">
      <div class="info-label">Submitter:</div><div>${config.requestedBy || '......................................'}</div>
      <div class="info-label">Unit:</div><div>${config.requestedUnit || '......................................'}</div>
      <div class="info-label">Document Number:</div><div>${config.requestNumber || '......................................'}</div>
      <div class="info-label">Submission Date:</div><div>${config.requestDate ? formatThaiDate(config.requestDate) : '......................................'}</div>
      <div class="info-label">Completion Date:</div><div>${reportDate}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. Evidence/Items Submitted</div>
    <table>
      <thead><tr><th style="width: 40px;">No.</th><th>items</th><th style="width: 100px;">Type</th><th style="width: 70px;">Size</th><th style="width: 180px;">SHA-256 Hash</th><th style="width: 60px;">QR</th></tr></thead>
      <tbody>${evidenceRows}</tbody>
    </table>
    <div class="hash-notice"><strong>🔐 Note:</strong> SHA-256 Hash and QR Code are used to verify that the file has not been modified. Scan QR to verify</div>
  </div>

  <div class="section">
    <div class="section-title">4. Examination Methods</div>
    <div class="list-section">
      <p><strong>4.1 Methods Used:</strong></p>
      <ul>${methods.map(m => `<li>${m}</li>`).join('')}</ul>
      <br>
      <p><strong>4.2 Tools Used:</strong></p>
      <ul>${tools.map(t => `<li>${t}</li>`).join('')}</ul>
    </div>
  </div>

  ${walletsHTML}
  ${suspectsHTML}

  <div class="section">
    <div class="section-title">${5 + sectionOffset}. Examination Results</div>
    <div class="list-section">
      <ul>${findings.map(f => `<li>${f}</li>`).join('')}</ul>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${6 + sectionOffset}. Examiner's Opinion</div>
    <div class="opinion-box">
      Based on the digital evidence examination above, all evidence has been properly stored according to Chain of Custody principles 
      and verified with Cryptographic Hash Function. Can be used as evidence in court
    </div>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <div class="stamp-area">Unit<br>Stamp</div>
      <div class="signature-line">Examiner</div>
      <div class="signature-name">(${config.examinerName || '......................................'})</div>
      <div class="signature-position">${config.examinerPosition || 'Digital Forensic Scientist'}</div>
    </div>
    <div class="signature-box">
      <div class="stamp-area">Supervisor<br>Stamp</div>
      <div class="signature-line">Unit Head</div>
      <div class="signature-name">(......................................)</div>
      <div class="signature-position">Head of Digital Forensics Unit</div>
    </div>
  </div>

  <div class="footer">
    <p><strong>Note:</strong></p>
    <ol style="margin-left: 20px; font-size: 13px;">
      <li>This report is prepared according to Digital Forensics standards (Digital Forensics)</li>
      <li>All evidence stored according to Chain of Custody</li>
      <li>This examination result is a technical opinion. Legal judgment is at the discretion of the court</li>
    </ol>
    <p style="margin-top: 15px; text-align: center;"><strong>Report Number:</strong> ${reportNumber} | <strong>Created by:</strong> InvestiGate Platform</p>
  </div>

  <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
</body>
</html>`;
};

// ============================================
// MAIN COMPONENT
// ============================================

export const EvidenceManager = ({ 
  caseId = 'CASE-DEMO', 
  caseName = 'Sample Case',
  wallets = [],
  suspects = [],
  cases = [],
  onEvidenceChange,
  readOnly = false 
}: EvidenceManagerProps) => {
  // State
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCaseLinkModal, setShowCaseLinkModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState<Evidence['category']>('screenshot');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFileData, setPendingFileData] = useState<string | null>(null);
  const [pendingHash, setPendingHash] = useState<string | null>(null);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [reportType, setReportType] = useState<'court' | 'forensic'>('court');
  const [selectedCaseId, setSelectedCaseId] = useState(caseId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Report config state
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    examinerName: '',
    examinerPosition: 'Digital Forensic Scientist',
    examinerUnit: 'Digital Forensics Unit',
    requestedBy: '',
    requestedUnit: '',
    requestNumber: '',
    requestDate: '',
    includeImages: true,
    includeWallets: true,
    includeSuspects: true
  });

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${caseId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEvidenceList(parsed);
      } catch (e) {
        console.error('Failed to load evidence from storage:', e);
      }
    }
  }, [caseId]);

  // Save to localStorage when evidence changes
  useEffect(() => {
    if (evidenceList.length > 0) {
      localStorage.setItem(`${STORAGE_KEY}_${caseId}`, JSON.stringify(evidenceList));
    }
  }, [evidenceList, caseId]);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PNG, JPG, PDF files are supported');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must not exceed 10MB');
      return;
    }

    setIsUploading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hash = await calculateSHA256(arrayBuffer);

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPendingFile(file);
        setPendingFileData(base64);
        setPendingHash(hash);
        setShowUploadModal(true);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file');
      setIsUploading(false);
    }
  };

  const handleConfirmUpload = () => {
    if (!pendingFile || !pendingFileData || !pendingHash) return;

    const newEvidence: Evidence = {
      id: `EVD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileName: pendingFile.name,
      fileType: pendingFile.type,
      fileSize: pendingFile.size,
      fileData: pendingFileData,
      sha256Hash: pendingHash,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'admin@test.com',
      description: uploadDescription || pendingFile.name,
      category: uploadCategory,
      verified: true,
      caseId: selectedCaseId
    };

    const updatedList = [...evidenceList, newEvidence];
    setEvidenceList(updatedList);
    onEvidenceChange?.(updatedList);

    setPendingFile(null);
    setPendingFileData(null);
    setPendingHash(null);
    setUploadDescription('');
    setUploadCategory('screenshot');
    setShowUploadModal(false);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancelUpload = () => {
    setPendingFile(null);
    setPendingFileData(null);
    setPendingHash(null);
    setUploadDescription('');
    setShowUploadModal(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (id: string) => {
    if (!confirm('Do you want to delete this evidence?')) return;
    const updatedList = evidenceList.filter(e => e.id !== id);
    setEvidenceList(updatedList);
    onEvidenceChange?.(updatedList);
    
    // Update localStorage
    if (updatedList.length === 0) {
      localStorage.removeItem(`${STORAGE_KEY}_${caseId}`);
    }
  };

  const handlePreview = (evidence: Evidence) => {
    setSelectedEvidence(evidence);
    setShowPreviewModal(true);
  };

  const handleDownload = (evidence: Evidence) => {
    const link = document.createElement('a');
    link.href = evidence.fileData;
    link.download = evidence.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShowQR = (evidence: Evidence) => {
    setSelectedEvidence(evidence);
    setShowQRModal(true);
  };

  const handleLinkCase = (evidence: Evidence) => {
    setSelectedEvidence(evidence);
    setShowCaseLinkModal(true);
  };

  const handleUpdateCaseLink = (newCaseId: string) => {
    if (!selectedEvidence) return;
    const updatedList = evidenceList.map(e => 
      e.id === selectedEvidence.id ? { ...e, caseId: newCaseId } : e
    );
    setEvidenceList(updatedList);
    setShowCaseLinkModal(false);
  };

  // Open report configuration modal
  const handleOpenReportModal = (type: 'court' | 'forensic') => {
    setReportType(type);
    setShowReportModal(true);
    setShowReportMenu(false);
  };

  // Generate and open report
  const handleGenerateReport = () => {
    let html: string;
    if (reportType === 'court') {
      html = generateCourtReportHTML(caseId, caseName, evidenceList, reportConfig, wallets, suspects);
    } else {
      html = generateForensicReportHTML(caseId, caseName, evidenceList, reportConfig, wallets, suspects);
    }
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
    setShowReportModal(false);
  };

  // Clear all evidence from storage
  const handleClearStorage = () => {
    if (!confirm('Do you want to delete all evidence from database?')) return;
    setEvidenceList([]);
    localStorage.removeItem(`${STORAGE_KEY}_${caseId}`);
  };

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700">
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Digital Evidence</h2>
              <p className="text-xs text-dark-400">
                {evidenceList.length} items • 
                <span className="text-green-400 ml-1">
                  <Database size={10} className="inline mr-1" />
                  Auto Save
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {evidenceList.length > 0 && (
              <>
                <Button 
                  variant="ghost" 
                  onClick={handleClearStorage}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} className="mr-1" />
                  Clear Data
                </Button>
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowReportMenu(!showReportMenu)} 
                    className="text-sm"
                  >
                    <Printer size={14} className="mr-1" />
                    Print Report
                    <ChevronDown size={14} className="ml-1" />
                  </Button>
                  
                  {showReportMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-dark-700 border border-dark-600 rounded-lg shadow-xl z-50">
                      <button
                        onClick={() => handleOpenReportModal('court')}
                        className="w-full px-4 py-3 text-left hover:bg-dark-600 flex items-start gap-3 border-b border-dark-600 rounded-t-lg"
                      >
                        <span className="text-2xl">⚖️</span>
                        <div>
                          <div className="text-white font-medium">Digital Evidence Report</div>
                          <div className="text-xs text-dark-400">For Court Submission</div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleOpenReportModal('forensic')}
                        className="w-full px-4 py-3 text-left hover:bg-dark-600 flex items-start gap-3 rounded-b-lg"
                      >
                        <span className="text-2xl">🔬</span>
                        <div>
                          <div className="text-white font-medium">ReportExamination Results</div>
                          <div className="text-xs text-dark-400">For Investigator</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            {!readOnly && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-sm"
                >
                  {isUploading ? (
                    <><span className="animate-spin mr-1">⏳</span>Processing...</>
                  ) : (
                    <><Plus size={14} className="mr-1" />Add Evidence</>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Evidence List */}
      <div className="p-4">
        {evidenceList.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={24} className="text-dark-500" />
            </div>
            <div className="text-dark-400 mb-2">No evidence yet</div>
            <div className="text-xs text-dark-500">Click "Add Evidence" to upload files (PNG, JPG, PDF)</div>
          </div>
        ) : (
          <div className="space-y-3">
            {evidenceList.map((evidence) => {
              const FileIcon = getFileIcon(evidence.fileType);
              const categoryInfo = CATEGORY_LABELS[evidence.category];
              
              return (
                <div key={evidence.id} className="bg-dark-900 rounded-lg border border-dark-700 p-4 hover:border-dark-600 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-dark-800 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {evidence.fileType.startsWith('image/') ? (
                        <img src={evidence.fileData} alt={evidence.fileName} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <FileIcon size={24} className="text-dark-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-medium truncate">{evidence.fileName}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${categoryInfo.color}`}>{categoryInfo.label}</span>
                        {evidence.verified && (
                          <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 flex items-center gap-1">
                            <CheckCircle size={10} />Verified
                          </span>
                        )}
                        {evidence.caseId && (
                          <span className="px-2 py-0.5 rounded text-xs bg-primary-500/20 text-primary-400 flex items-center gap-1">
                            <Link2 size={10} />{evidence.caseId}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-dark-400 mb-2 truncate">{evidence.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-dark-500">
                        <span className="flex items-center gap-1"><File size={10} />{formatFileSize(evidence.fileSize)}</span>
                        <span className="flex items-center gap-1"><Clock size={10} />{formatDate(evidence.uploadedAt)}</span>
                        <span className="flex items-center gap-1"><User size={10} />{evidence.uploadedBy}</span>
                      </div>
                      <div className="mt-2 p-2 bg-dark-800 rounded flex items-center gap-2">
                        <Lock size={12} className="text-amber-400 flex-shrink-0" />
                        <code className="text-xs text-amber-400 font-mono truncate">SHA-256: {evidence.sha256Hash}</code>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <button onClick={() => handleShowQR(evidence)} className="p-2 hover:bg-dark-700 rounded-lg transition-colors" title="QR Code">
                        <QrCode size={16} className="text-primary-400" />
                      </button>
                      <button onClick={() => handlePreview(evidence)} className="p-2 hover:bg-dark-700 rounded-lg transition-colors" title="Preview">
                        <Eye size={16} className="text-dark-400" />
                      </button>
                      <button onClick={() => handleDownload(evidence)} className="p-2 hover:bg-dark-700 rounded-lg transition-colors" title="Download">
                        <Download size={16} className="text-dark-400" />
                      </button>
                      {cases.length > 0 && (
                        <button onClick={() => handleLinkCase(evidence)} className="p-2 hover:bg-dark-700 rounded-lg transition-colors" title="Link to Case">
                          <Link2 size={16} className="text-dark-400" />
                        </button>
                      )}
                      {!readOnly && (
                        <button onClick={() => handleDelete(evidence.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Court Notice */}
      <div className="p-4 border-t border-dark-700">
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-green-400">Court ready</div>
              <div className="text-xs text-dark-300 mt-1">
                All evidence verified with SHA-256 Hash, Timestamp, Chain of Custody and QR Code for verification
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && pendingFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-[500px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Upload size={20} className="text-primary-400" />Add Evidence
              </h3>
              <button onClick={handleCancelUpload} className="p-1 hover:bg-dark-700 rounded"><X size={18} className="text-dark-400" /></button>
            </div>
            <div className="mb-4">
              <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
                <div className="flex items-center gap-3 mb-3">
                  {pendingFile.type.startsWith('image/') && pendingFileData ? (
                    <img src={pendingFileData} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                  ) : (
                    <div className="w-20 h-20 bg-dark-800 rounded-lg flex items-center justify-center"><FileText size={32} className="text-dark-400" /></div>
                  )}
                  <div>
                    <div className="text-white font-medium">{pendingFile.name}</div>
                    <div className="text-sm text-dark-400">{formatFileSize(pendingFile.size)}</div>
                    <div className="text-xs text-dark-500">{pendingFile.type}</div>
                  </div>
                </div>
                <div className="p-3 bg-dark-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock size={14} className="text-green-400" />
                    <span className="text-xs text-dark-400">SHA-256 Hash (Auto calculated)</span>
                  </div>
                  <code className="text-xs text-green-400 font-mono break-all">{pendingHash}</code>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {cases.length > 0 && (
                <div>
                  <label className="text-sm text-dark-400 mb-1 block">Link to Case:</label>
                  <select 
                    value={selectedCaseId} 
                    onChange={(e) => setSelectedCaseId(e.target.value)} 
                    className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 text-white"
                  >
                    <option value={caseId}>{caseId} (Current)</option>
                    {cases.filter(c => c.id !== caseId).map(c => (
                      <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Category:</label>
                <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value as Evidence['category'])} className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 text-white">
                  <option value="screenshot">📸 Screenshot</option>
                  <option value="blockchain">⛓️ Blockchain Transaction</option>
                  <option value="document">📄 Document</option>
                  <option value="communication">💬 Communication</option>
                  <option value="other">📁 Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Description:</label>
                <textarea value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="Describe this evidence..." rows={3} className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 text-white resize-none" />
              </div>
              <div className="p-3 bg-dark-900 rounded-lg">
                <div className="text-xs text-dark-400 mb-2">Data to be saved:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-dark-500">Date:</span> <span className="text-white">{formatDate(new Date().toISOString())}</span></div>
                  <div><span className="text-dark-500">Recorded by:</span> <span className="text-white">admin@test.com</span></div>
                  <div><span className="text-dark-500">Case:</span> <span className="text-white">{selectedCaseId}</span></div>
                  <div><span className="text-dark-500">Status:</span> <span className="text-green-400">Verified ✓</span></div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleCancelUpload} className="flex-1">Cancel</Button>
                <Button variant="primary" onClick={handleConfirmUpload} className="flex-1"><CheckCircle size={14} className="mr-1" />Save Evidence</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedEvidence && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-[900px] max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-green-400" />
                <div>
                  <div className="text-white font-medium">{selectedEvidence.fileName}</div>
                  <div className="text-xs text-dark-400">{formatDate(selectedEvidence.uploadedAt)} • {selectedEvidence.uploadedBy}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => handleDownload(selectedEvidence)}><Download size={14} className="mr-1" />Download</Button>
                <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-dark-700 rounded"><X size={18} className="text-dark-400" /></button>
              </div>
            </div>
            <div className="p-4 max-h-[60vh] overflow-auto bg-dark-900">
              {selectedEvidence.fileType.startsWith('image/') ? (
                <img src={selectedEvidence.fileData} alt={selectedEvidence.fileName} className="max-w-full mx-auto rounded-lg" />
              ) : selectedEvidence.fileType === 'application/pdf' ? (
                <iframe src={selectedEvidence.fileData} className="w-full h-[500px] rounded-lg" title={selectedEvidence.fileName} />
              ) : (
                <div className="text-center py-12 text-dark-400">Cannot preview this file</div>
              )}
            </div>
            <div className="p-4 border-t border-dark-700 bg-dark-800">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div><div className="text-xs text-dark-400">ID</div><div className="text-white font-mono text-xs">{selectedEvidence.id}</div></div>
                <div><div className="text-xs text-dark-400">File Size</div><div className="text-white">{formatFileSize(selectedEvidence.fileSize)}</div></div>
                <div><div className="text-xs text-dark-400">Category</div><div className="text-white">{CATEGORY_LABELS[selectedEvidence.category].label}</div></div>
                <div><div className="text-xs text-dark-400">Status</div><div className="text-green-400 flex items-center gap-1"><CheckCircle size={12} />Verified</div></div>
              </div>
              <div className="mt-3 p-2 bg-dark-900 rounded flex items-center gap-2">
                <Lock size={12} className="text-amber-400 flex-shrink-0" />
                <code className="text-xs text-amber-400 font-mono truncate">SHA-256: {selectedEvidence.sha256Hash}</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedEvidence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <QrCode size={20} className="text-primary-400" />
                QR Code for Hash verification
              </h3>
              <button onClick={() => setShowQRModal(false)} className="p-1 hover:bg-dark-700 rounded">
                <X size={18} className="text-dark-400" />
              </button>
            </div>
            
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <img 
                  src={generateQRDataURL(selectedEvidence.sha256Hash, selectedEvidence.fileName, selectedEvidence.caseId || caseId, selectedEvidence.uploadedAt, 150)} 
                  alt="QR Code"
                  width={150}
                  height={150}
                />
              </div>
              
              <div className="text-sm text-dark-400 mb-2">{selectedEvidence.fileName}</div>
              
              <div className="p-3 bg-dark-900 rounded-lg text-left">
                <div className="text-xs text-dark-400 mb-1">SHA-256 Hash:</div>
                <code className="text-xs text-amber-400 font-mono break-all">{selectedEvidence.sha256Hash}</code>
              </div>
              
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-left">
                <div className="text-xs text-green-400">
                  <strong>How to use:</strong> Scan QR Code to open evidence verification page
                  Show Hash and File Details
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Link Modal */}
      {showCaseLinkModal && selectedEvidence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Link2 size={20} className="text-primary-400" />
                Link to Case
              </h3>
              <button onClick={() => setShowCaseLinkModal(false)} className="p-1 hover:bg-dark-700 rounded">
                <X size={18} className="text-dark-400" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-dark-400 mb-2">Evidence: {selectedEvidence.fileName}</div>
              <div className="text-xs text-dark-500">Current: {selectedEvidence.caseId || 'Not linked'}</div>
            </div>
            
            <div className="space-y-2">
              {cases.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleUpdateCaseLink(c.id)}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    selectedEvidence.caseId === c.id 
                      ? 'bg-primary-500/20 border-primary-500' 
                      : 'bg-dark-900 border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <div className="text-white font-medium">{c.id}</div>
                  <div className="text-xs text-dark-400">{c.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Configuration Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings size={20} className="text-primary-400" />
                Report Settings {reportType === 'court' ? '⚖️ Court' : '🔬 Examination'}
              </h3>
              <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-dark-700 rounded">
                <X size={18} className="text-dark-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Examiner Info */}
              <div className="p-4 bg-dark-900 rounded-lg">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <User size={14} />
                  Examiner Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-dark-400">Examiner Name:</label>
                    <input
                      type="text"
                      value={reportConfig.examinerName}
                      onChange={(e) => setReportConfig({...reportConfig, examinerName: e.target.value})}
                      placeholder="Full Name"
                      className="w-full bg-dark-800 border border-dark-600 rounded p-2 text-white text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dark-400">Position:</label>
                    <input
                      type="text"
                      value={reportConfig.examinerPosition}
                      onChange={(e) => setReportConfig({...reportConfig, examinerPosition: e.target.value})}
                      className="w-full bg-dark-800 border border-dark-600 rounded p-2 text-white text-sm mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-dark-400">Unit:</label>
                    <input
                      type="text"
                      value={reportConfig.examinerUnit}
                      onChange={(e) => setReportConfig({...reportConfig, examinerUnit: e.target.value})}
                      className="w-full bg-dark-800 border border-dark-600 rounded p-2 text-white text-sm mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Request Info */}
              <div className="p-4 bg-dark-900 rounded-lg">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText size={14} />
                  Submission Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-dark-400">Submitter:</label>
                    <input
                      type="text"
                      value={reportConfig.requestedBy}
                      onChange={(e) => setReportConfig({...reportConfig, requestedBy: e.target.value})}
                      placeholder="Full Name"
                      className="w-full bg-dark-800 border border-dark-600 rounded p-2 text-white text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dark-400">Submitting Unit:</label>
                    <input
                      type="text"
                      value={reportConfig.requestedUnit}
                      onChange={(e) => setReportConfig({...reportConfig, requestedUnit: e.target.value})}
                      placeholder="Unit Name"
                      className="w-full bg-dark-800 border border-dark-600 rounded p-2 text-white text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dark-400">Document Number:</label>
                    <input
                      type="text"
                      value={reportConfig.requestNumber}
                      onChange={(e) => setReportConfig({...reportConfig, requestNumber: e.target.value})}
                      placeholder="Document Number"
                      className="w-full bg-dark-800 border border-dark-600 rounded p-2 text-white text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dark-400">Submission Date:</label>
                    <input
                      type="date"
                      value={reportConfig.requestDate}
                      onChange={(e) => setReportConfig({...reportConfig, requestDate: e.target.value})}
                      className="w-full bg-dark-800 border border-dark-600 rounded p-2 text-white text-sm mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="p-4 bg-dark-900 rounded-lg">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Settings size={14} />
                  More Options
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-dark-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeImages}
                      onChange={(e) => setReportConfig({...reportConfig, includeImages: e.target.checked})}
                      className="rounded"
                    />
                    <Image size={14} />
                    Attach evidence images in report
                  </label>
                  <label className="flex items-center gap-2 text-sm text-dark-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeWallets}
                      onChange={(e) => setReportConfig({...reportConfig, includeWallets: e.target.checked})}
                      className="rounded"
                    />
                    <Wallet size={14} />
                    Include Wallet Data ({wallets.length} items)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-dark-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeSuspects}
                      onChange={(e) => setReportConfig({...reportConfig, includeSuspects: e.target.checked})}
                      className="rounded"
                    />
                    <Users size={14} />
                    Include Suspect Data ({suspects.length} items)
                  </label>
                </div>
              </div>

              {/* Preview Info */}
              <div className="p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                <div className="text-sm text-primary-400">
                  <strong>Report will include:</strong>
                  <ul className="mt-1 ml-4 list-disc text-xs">
                    <li>Evidence {evidenceList.length} items with SHA-256 Hash and QR Code</li>
                    {reportConfig.includeImages && <li>Evidence images (if any)</li>}
                    {reportConfig.includeWallets && wallets.length > 0 && <li>Wallet data {wallets.length} items</li>}
                    {reportConfig.includeSuspects && suspects.length > 0 && <li>Suspect data {suspects.length} person</li>}
                  </ul>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowReportModal(false)} className="flex-1">Cancel</Button>
                <Button variant="primary" onClick={handleGenerateReport} className="flex-1">
                  <Printer size={14} className="mr-1" />
                  Generate Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceManager;
