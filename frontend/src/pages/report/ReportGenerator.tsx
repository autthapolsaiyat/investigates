/**
 * PDF Report Generator - Generate Court Report
 * Digital Forensic Standard
 */
import { useState, useRef, useEffect } from 'react';
import {
  FileText, Download, Printer, User,
  Scale, FileCheck, Clock, Shield, CheckCircle2, Loader2,
  Eye, Settings, CreditCard, AlertTriangle
} from 'lucide-react';
import { Button, Card, Input } from '../../components/ui';
import { casesAPI, moneyFlowAPI } from '../../services/api';
import type { Case, MoneyFlowNode, MoneyFlowEdge } from '../../services/api';

interface ReportConfig {
  includeExecutiveSummary: boolean;
  includeNetworkDiagram: boolean;
  includeTimeline: boolean;
  includeTransactionList: boolean;
  includeSuspectList: boolean;
  includeVictimList: boolean;
  includeEvidenceSummary: boolean;
  includeMethodology: boolean;
  includeConclusion: boolean;
  investigatorName: string;
  investigatorRank: string;
  investigatorUnit: string;
  reportDate: string;
  caseJudge: string;
  courtName: string;
}

interface ReportStats {
  totalSuspects: number;
  totalVictims: number;
  totalMuleAccounts: number;
  totalTransactions: number;
  totalAmount: number;
  dateRange: { start: string; end: string };
}

export const ReportGenerator = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [nodes, setNodes] = useState<MoneyFlowNode[]>([]);
  const [, setEdges] = useState<MoneyFlowEdge[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [, setShowPreview] = useState(false);
  const [stats, setStats] = useState<ReportStats | null>(null);
  
  const [config, setConfig] = useState<ReportConfig>({
    includeExecutiveSummary: true,
    includeNetworkDiagram: true,
    includeTimeline: true,
    includeTransactionList: true,
    includeSuspectList: true,
    includeVictimList: true,
    includeEvidenceSummary: true,
    includeMethodology: true,
    includeConclusion: true,
    investigatorName: '',
    investigatorRank: '',
    investigatorUnit: 'Technology Crime Suppression Division',
    reportDate: new Date().toISOString().split('T')[0],
    caseJudge: '',
    courtName: 'Criminal Court'
  });

  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch cases on mount
  useEffect(() => {
    casesAPI.list({ page: 1, page_size: 100 }).then(res => {
      setCases(res.items);
      if (res.items.length > 0) {
        selectCase(res.items[0].id);
      }
    });
  }, []);

  const selectCase = async (caseId: number) => {
    setSelectedCaseId(caseId);
    const caseData = cases.find(c => c.id === caseId);
    setSelectedCase(caseData || null);
    
    try {
      const [nodesRes, edgesRes] = await Promise.all([
        moneyFlowAPI.listNodes(caseId),
        moneyFlowAPI.listEdges(caseId)
      ]);
      setNodes(nodesRes);
      setEdges(edgesRes);
      
      // Calculate stats
      const totalAmount = edgesRes.reduce((sum, e) => sum + (e.amount || 0), 0);
      const dates = edgesRes
        .filter(e => e.transaction_date)
        .map(e => new Date(e.transaction_date!).getTime());
      
      setStats({
        totalSuspects: nodesRes.filter(n => n.is_suspect).length,
        totalVictims: nodesRes.filter(n => n.is_victim).length,
        totalMuleAccounts: nodesRes.filter(n => n.node_type === 'bank_account' && !n.is_suspect).length,
        totalTransactions: edgesRes.length,
        totalAmount,
        dateRange: {
          start: dates.length ? new Date(Math.min(...dates)).toLocaleDateString('th-TH') : '-',
          end: dates.length ? new Date(Math.max(...dates)).toLocaleDateString('th-TH') : '-'
        }
      });
    } catch (err) {
      console.error('Failed to fetch case data:', err);
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    // Simulate PDF generation (in real app, use a library like jsPDF or call backend)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setReportGenerated(true);
    setIsGenerating(false);
    setShowPreview(true);
  };

  const downloadPDF = () => {
    // In real implementation, generate actual PDF
    // For now, print the preview
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-dark-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="text-primary-500" />
            Generate Court Report
          </h1>
          <p className="text-dark-400 mt-1">PDF Report Generator - Digital Forensic Standard</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Configuration */}
        <div className="col-span-2 space-y-4">
          {/* Case Selection */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileCheck className="text-primary-400" />
              Select Case
            </h3>
            <select
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
              value={selectedCaseId || ''}
              onChange={(e) => selectCase(Number(e.target.value))}
            >
              {cases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.case_number} - {c.title}
                </option>
              ))}
            </select>

            {stats && (
              <div className="grid grid-cols-5 gap-3 mt-4">
                <div className="bg-dark-800 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-red-400">{stats.totalSuspects}</p>
                  <p className="text-xs text-dark-400">Suspects</p>
                </div>
                <div className="bg-dark-800 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-green-400">{stats.totalVictims}</p>
                  <p className="text-xs text-dark-400">Victims</p>
                </div>
                <div className="bg-dark-800 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-yellow-400">{stats.totalMuleAccounts}</p>
                  <p className="text-xs text-dark-400">Mule Accounts</p>
                </div>
                <div className="bg-dark-800 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-blue-400">{stats.totalTransactions}</p>
                  <p className="text-xs text-dark-400">Transactions</p>
                </div>
                <div className="bg-dark-800 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(stats.totalAmount)}</p>
                  <p className="text-xs text-dark-400">Total Value</p>
                </div>
              </div>
            )}
          </Card>

          {/* Report Sections */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="text-primary-400" />
              Select Report Sections
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'includeExecutiveSummary', label: 'Executive Summary', icon: FileText },
                { key: 'includeNetworkDiagram', label: 'Network Diagram', icon: Shield },
                { key: 'includeTimeline', label: 'Event Timeline', icon: Clock },
                { key: 'includeTransactionList', label: 'ListTransactions', icon: CreditCard },
                { key: 'includeSuspectList', label: 'Suspect List', icon: AlertTriangle },
                { key: 'includeVictimList', label: 'Victim List', icon: User },
                { key: 'includeEvidenceSummary', label: 'Evidence Summary', icon: FileCheck },
                { key: 'includeMethodology', label: 'Analysis Methodology', icon: Settings },
                { key: 'includeConclusion', label: 'Conclusion and Recommendations', icon: CheckCircle2 },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg cursor-pointer hover:bg-dark-750">
                  <input
                    type="checkbox"
                    checked={config[item.key as keyof ReportConfig] as boolean}
                    onChange={(e) => setConfig(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <item.icon size={16} className="text-primary-400" />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Investigator Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="text-primary-400" />
              Report Author Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Name</label>
                <Input
                  value={config.investigatorName}
                  onChange={(e) => setConfig(prev => ({ ...prev, investigatorName: e.target.value }))}
                  placeholder="Pol. Lt. Col. Name Surname"
                />
              </div>
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Rank/Position</label>
                <Input
                  value={config.investigatorRank}
                  onChange={(e) => setConfig(prev => ({ ...prev, investigatorRank: e.target.value }))}
                  placeholder="Investigator"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm text-dark-400 mb-1 block">Organization</label>
                <Input
                  value={config.investigatorUnit}
                  onChange={(e) => setConfig(prev => ({ ...prev, investigatorUnit: e.target.value }))}
                />
              </div>
            </div>
          </Card>

          {/* Court Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Scale className="text-primary-400" />
              Court Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Court</label>
                <Input
                  value={config.courtName}
                  onChange={(e) => setConfig(prev => ({ ...prev, courtName: e.target.value }))}
                  placeholder="Criminal Court"
                />
              </div>
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Report Date</label>
                <Input
                  type="date"
                  value={config.reportDate}
                  onChange={(e) => setConfig(prev => ({ ...prev, reportDate: e.target.value }))}
                />
              </div>
            </div>
          </Card>

          {/* Generate Button */}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowPreview(true)} disabled={!selectedCase}>
              <Eye size={18} className="mr-2" />
              Preview
            </Button>
            <Button onClick={generatePDF} disabled={isGenerating || !selectedCase}>
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download size={18} className="mr-2" />
                  Generate PDF Report
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <Card className="p-4 sticky top-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Eye className="text-primary-400" />
              Report Preview
            </h3>
            
            {selectedCase ? (
              <div className="bg-white text-black p-4 rounded-lg text-xs space-y-3 max-h-[600px] overflow-y-auto">
                {/* Report Header */}
                <div className="text-center border-b pb-3">
                  <p className="font-bold">Digital Analysis Report</p>
                  <p className="font-bold">Digital Forensic Analysis Report</p>
                  <p className="text-[10px] text-gray-600 mt-1">Case Number: {selectedCase.case_number}</p>
                </div>

                {/* Case Info */}
                <div className="border-b pb-2">
                  <p className="font-semibold">Case Information</p>
                  <p>Case Name: {selectedCase.title}</p>
                  <p>Status: {selectedCase.status}</p>
                  {stats && (
                    <p>Time Period: {stats.dateRange.start} - {stats.dateRange.end}</p>
                  )}
                </div>

                {/* Summary Stats */}
                {stats && config.includeExecutiveSummary && (
                  <div className="border-b pb-2">
                    <p className="font-semibold">Analysis Summary</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Suspects {stats.totalSuspects} persons</li>
                      <li>Victims {stats.totalVictims} persons</li>
                      <li>Mule Accounts {stats.totalMuleAccounts} accounts</li>
                      <li>Transactions Analyzed {stats.totalTransactions} List</li>
                      <li>Total Damage Value {formatCurrency(stats.totalAmount)}</li>
                    </ul>
                  </div>
                )}

                {/* Sections Preview */}
                <div className="space-y-2">
                  <p className="font-semibold">Table of Contents</p>
                  <ol className="list-decimal pl-4 text-[10px] space-y-0.5">
                    {config.includeExecutiveSummary && <li>Executive Summary</li>}
                    {config.includeNetworkDiagram && <li>Criminal Network Diagram</li>}
                    {config.includeTimeline && <li>Event Timeline</li>}
                    {config.includeSuspectList && <li>Suspect List</li>}
                    {config.includeVictimList && <li>Victim List</li>}
                    {config.includeTransactionList && <li>ListTransactions</li>}
                    {config.includeEvidenceSummary && <li>Evidence Summary</li>}
                    {config.includeMethodology && <li>Analysis Methodology</li>}
                    {config.includeConclusion && <li>Conclusion and Recommendations</li>}
                  </ol>
                </div>

                {/* Footer */}
                <div className="border-t pt-2 text-center text-[10px] text-gray-500">
                  <p>Prepared by: {config.investigatorName || '[Report Author]'}</p>
                  <p>{config.investigatorUnit}</p>
                  <p>Date: {formatDate(config.reportDate)}</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-dark-400 py-8">
                <FileText size={48} className="mx-auto mb-3 opacity-30" />
                <p>Select Case to Preview</p>
              </div>
            )}

            {reportGenerated && (
              <Button className="w-full mt-4" onClick={downloadPDF}>
                <Printer size={18} className="mr-2" />
                Download / Print
              </Button>
            )}
          </Card>
        </div>
      </div>

      {/* Print-only content */}
      <div className="hidden print:block" ref={reportRef}>
        {/* Full report content for printing */}
        <div className="p-8 text-black bg-white">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Digital Analysis Report</h1>
            <h2 className="text-xl">Digital Forensic Analysis Report</h2>
            <p className="mt-2">Case Number: {selectedCase?.case_number}</p>
          </div>

          {/* Case Information */}
          <section className="mb-6">
            <h3 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">1. Case Information</h3>
            <table className="w-full">
              <tbody>
                <tr><td className="font-semibold w-40">Case Name:</td><td>{selectedCase?.title}</td></tr>
                <tr><td className="font-semibold">NumberCase:</td><td>{selectedCase?.case_number}</td></tr>
                <tr><td className="font-semibold">Status:</td><td>{selectedCase?.status}</td></tr>
                <tr><td className="font-semibold">Priority Level:</td><td>{selectedCase?.priority}</td></tr>
              </tbody>
            </table>
          </section>

          {/* Executive Summary */}
          {config.includeExecutiveSummary && stats && (
            <section className="mb-6">
              <h3 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">2. Executive Summary</h3>
              <p className="mb-3">
                From digital data analysis in this case, evidence indicating criminal activity was found
                related to online gambling and money laundering, with the following details:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Suspects in Network: <strong>{stats.totalSuspects}</strong> persons</li>
                <li>Victims: <strong>{stats.totalVictims}</strong> persons</li>
                <li>Mule Accounts used in crime: <strong>{stats.totalMuleAccounts}</strong> accounts</li>
                <li>Transactions detected: <strong>{stats.totalTransactions}</strong> List</li>
                <li>Total Damage Value: <strong>{formatCurrency(stats.totalAmount)}</strong></li>
              </ul>
            </section>
          )}

          {/* Suspect List */}
          {config.includeSuspectList && (
            <section className="mb-6">
              <h3 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">3. Suspect List</h3>
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-black p-2">No.</th>
                    <th className="border border-black p-2">Name</th>
                    <th className="border border-black p-2">ID Number</th>
                    <th className="border border-black p-2">Role</th>
                    <th className="border border-black p-2">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.filter(n => n.is_suspect).slice(0, 20).map((node, idx) => (
                    <tr key={node.id}>
                      <td className="border border-black p-2 text-center">{idx + 1}</td>
                      <td className="border border-black p-2">{node.label}</td>
                      <td className="border border-black p-2">{node.identifier || '-'}</td>
                      <td className="border border-black p-2">{node.notes || '-'}</td>
                      <td className="border border-black p-2 text-center">{node.risk_score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Signature */}
          <section className="mt-12 text-center">
            <p>Signature ............................................. Report Author</p>
            <p className="mt-1">({config.investigatorName || '..............................'})</p>
            <p>{config.investigatorRank}</p>
            <p>{config.investigatorUnit}</p>
            <p className="mt-4">Date {formatDate(config.reportDate)}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
