// src/app/security/page.tsx
// Hermes Security Dashboard — polished UI for viewing scan results.

'use client';

import { useState, useEffect, useCallback } from 'react';

interface Finding {
  severity: string;
  title: string;
  component: string;
  detail: string;
  fix?: string;
  owasp?: string;
  cvss?: number;
  chain?: string;
}

interface ScanSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface ScanResult {
  scan_time: string;
  level: string;
  summary: ScanSummary;
  tools: Record<string, unknown>;
}

const SEVERITY_CONFIG = {
  CRITICAL: { color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: '🔴', label: 'Critical' },
  HIGH:     { color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: '🟠', label: 'High' },
  MEDIUM:   { color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '🟡', label: 'Medium' },
  LOW:      { color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: '🔵', label: 'Low' },
  INFO:     { color: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: 'ℹ️', label: 'Info' },
};

function SeverityBadge({ severity }: { severity: string }) {
  const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.INFO;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.border} border`}>
      {config.icon} {config.label}
    </span>
  );
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={radius} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center w-20 h-20">
        <span className="text-lg font-bold">{score}</span>
      </div>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[finding.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.INFO;

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} p-3 transition-all`}>
      <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <SeverityBadge severity={finding.severity} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">{finding.title}</h4>
            {finding.cvss && (
              <span className="text-xs font-mono text-gray-500">CVSS {finding.cvss}</span>
            )}
            {finding.owasp && (
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">{finding.owasp}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 font-mono truncate">{finding.component}</p>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {expanded && (
        <div className="mt-3 pl-8 space-y-2">
          <p className="text-xs text-gray-700">{finding.detail}</p>
          {finding.chain && (
            <div className="text-xs bg-red-100 text-red-800 rounded px-2 py-1 font-medium">
              ⚡ Attack Chain: {finding.chain}
            </div>
          )}
          {finding.fix && (
            <div className="text-xs bg-green-100 text-green-800 rounded px-2 py-1">
              💡 Fix: {finding.fix}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolResultCard({ name, data }: { name: string; data: unknown }) {
  const [expanded, setExpanded] = useState(false);
  const d = data as Record<string, unknown>;
  const error = d?.error as string | undefined;
  const findings = d?.findings as Finding[] | undefined;
  const critical = d?.critical as number | undefined;
  const high = d?.high as number | undefined;

  const hasIssues = (critical && critical > 0) || (high && high > 0) || (findings && findings.length > 0);

  return (
    <div className={`rounded-lg border ${error ? 'border-red-200 bg-red-50' : hasIssues ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'} p-3`}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <span className="text-sm">{error ? '❌' : hasIssues ? '⚠️' : '✅'}</span>
          <span className="text-sm font-medium text-gray-800 capitalize">{name.replace(/_/g, ' ')}</span>
        </div>
        <div className="flex items-center gap-2">
          {critical && critical > 0 && <SeverityBadge severity="CRITICAL" />}
          {high && high > 0 && <SeverityBadge severity="HIGH" />}
          {!error && !hasIssues && <span className="text-xs text-green-600">Clean</span>}
        </div>
      </div>
      {expanded && (
        <div className="mt-2">
          {error ? (
            <pre className="text-xs text-red-600 whitespace-pre-wrap">{error}</pre>
          ) : findings && findings.length > 0 ? (
            <div className="space-y-1">
              {findings.map((f, i) => (
                <div key={i} className="text-xs bg-white rounded px-2 py-1 border border-gray-200">
                  <SeverityBadge severity={f.severity} />
                  <span className="ml-2 font-medium">{f.title}</span>
                  <span className="ml-2 text-gray-500 font-mono">{f.component}</span>
                </div>
              ))}
            </div>
          ) : (
            <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {JSON.stringify(d, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function SecurityDashboard() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'findings' | 'tools'>('overview');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const runScan = useCallback(async (level: 'quick' | 'deep') => {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch('/api/security/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      });
      if (!res.ok) throw new Error(`Scan failed: ${res.status}`);
      const data = await res.json();
      setScanResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }, []);

  // Auto-run quick scan on mount
  useEffect(() => { runScan('quick'); }, [runScan]);

  // Collect all findings from all tools
  const allFindings: Finding[] = [];
  if (scanResult?.tools) {
    for (const toolData of Object.values(scanResult.tools)) {
      const d = toolData as Record<string, unknown>;
      if (Array.isArray(d.findings)) {
        allFindings.push(...d.findings as Finding[]);
      }
    }
  }

  const filteredFindings = filterSeverity === 'ALL'
    ? allFindings
    : allFindings.filter(f => f.severity === filterSeverity);

  // Security score (0-100, higher = more secure)
  const summary = scanResult?.summary;
  const securityScore = summary
    ? Math.max(0, 100 - (summary.critical * 20) - (summary.high * 10) - (summary.medium * 3) - (summary.low * 1))
    : 0;

  const scoreColor = securityScore >= 80 ? '#22c55e' : securityScore >= 60 ? '#eab308' : '#ef4444';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-lg">
              🛡️
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Hermes Security</h1>
              <p className="text-xs text-gray-500">Local AI-powered security scanner</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => runScan('quick')}
              disabled={scanning}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {scanning ? '⏳ Scanning...' : '⚡ Quick Scan'}
            </button>
            <button
              onClick={() => runScan('deep')}
              disabled={scanning}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {scanning ? '⏳ Scanning...' : '🔍 Deep Scan'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        {scanResult ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {/* Security Score */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center justify-center relative">
                <ScoreRing score={securityScore} label="Security Score" color={scoreColor} />
              </div>

              {/* Severity Counts */}
              {[
                { label: 'Critical', value: summary?.critical || 0, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                { label: 'High', value: summary?.high || 0, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
                { label: 'Medium', value: summary?.medium || 0, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
                { label: 'Low', value: summary?.low || 0, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
              ].map(item => (
                <div key={item.label} className={`rounded-xl border ${item.border} ${item.bg} p-4 flex flex-col items-center justify-center`}>
                  <span className={`text-3xl font-bold ${item.color}`}>{item.value}</span>
                  <span className="text-xs text-gray-500 mt-1">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
              {(['overview', 'findings', 'tools'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'overview' ? '📊 Overview' : tab === 'findings' ? `📋 Findings (${allFindings.length})` : '🔧 Tools'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attack Chains */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">⚡ Attack Chains</h3>
                  {allFindings.filter(f => f.chain).length > 0 ? (
                    <div className="space-y-2">
                      {allFindings.filter(f => f.chain).map((f, i) => (
                        <FindingCard key={i} finding={f} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No attack chains detected ✅</p>
                  )}
                </div>

                {/* OWASP Coverage */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">📋 OWASP Top 10 Coverage</h3>
                  <div className="space-y-2">
                    {['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10'].map(code => {
                      const owaspFindings = allFindings.filter(f => f.owasp?.startsWith(code));
                      const hasIssues = owaspFindings.length > 0;
                      return (
                        <div key={code} className={`flex items-center justify-between px-3 py-2 rounded-lg ${hasIssues ? 'bg-orange-50' : 'bg-green-50'}`}>
                          <span className="text-sm font-mono">{code}</span>
                          <span className={`text-xs ${hasIssues ? 'text-orange-600' : 'text-green-600'}`}>
                            {hasIssues ? `${owaspFindings.length} finding(s)` : '✅ Clean'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scan Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">ℹ️ Scan Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Scan Time</span>
                      <span className="font-mono">{new Date(scanResult.scan_time).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Level</span>
                      <span className="capitalize">{scanResult.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tools Run</span>
                      <span>{Object.keys(scanResult.tools).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Findings</span>
                      <span className="font-bold">{summary?.total || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">💡 Top Recommendations</h3>
                  <div className="space-y-2">
                    {allFindings
                      .filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH')
                      .slice(0, 5)
                      .map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <SeverityBadge severity={f.severity} />
                          <div>
                            <p className="font-medium text-gray-800">{f.title}</p>
                            {f.fix && <p className="text-gray-500 text-xs mt-0.5">{f.fix}</p>}
                          </div>
                        </div>
                      ))}
                    {allFindings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length === 0 && (
                      <p className="text-sm text-green-600">✅ No critical or high findings!</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'findings' && (
              <div>
                {/* Filter */}
                <div className="flex gap-2 mb-4">
                  {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                    <button
                      key={sev}
                      onClick={() => setFilterSeverity(sev)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        filterSeverity === sev
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {sev === 'ALL' ? `All (${allFindings.length})` : sev}
                    </button>
                  ))}
                </div>

                {/* Findings List */}
                <div className="space-y-2">
                  {filteredFindings.length > 0 ? (
                    filteredFindings.map((f, i) => <FindingCard key={i} finding={f} />)
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">No findings match this filter</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(scanResult.tools).map(([name, data]) => (
                  <ToolResultCard key={name} name={name} data={data} />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-2xl animate-pulse">
              🛡️
            </div>
            <p className="mt-4 text-gray-600">Running security scan...</p>
            <p className="text-xs text-gray-400 mt-1">This may take 30-60 seconds for a deep scan</p>
          </div>
        )}
      </main>
    </div>
  );
}
