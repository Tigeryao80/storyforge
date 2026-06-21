// src/components/security/SecurityPanel.tsx
// Compact security status panel for the sidebar.

'use client';

import { useState, useEffect, useCallback } from 'react';

interface SecuritySummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  score: number;
}

export default function SecurityPanel() {
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [scanning, setScanning] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const runQuickScan = useCallback(async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/security/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 'quick' }),
      });
      if (res.ok) {
        const data = await res.json();
        setSummary({
          critical: data.summary?.critical || 0,
          high: data.summary?.high || 0,
          medium: data.summary?.medium || 0,
          low: data.summary?.low || 0,
          total: data.summary?.total || 0,
          score: Math.max(0, 100 - (data.summary?.critical || 0) * 20 - (data.summary?.high || 0) * 10 - (data.summary?.medium || 0) * 3),
        });
      }
    } catch {
      // Silent fail
    } finally {
      setScanning(false);
    }
  }, []);

  // Auto-scan on mount
  useEffect(() => { runQuickScan(); }, [runQuickScan]);

  const scoreColor = !summary ? 'bg-gray-400' :
    summary.score >= 80 ? 'bg-green-500' :
    summary.score >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  const hasIssues = summary && (summary.critical > 0 || summary.high > 0);

  return (
    <div className="border-t border-gray-200 p-3">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-base">🛡️</span>
        <h3 className="text-sm font-semibold text-gray-800 flex-1">Security</h3>
        {scanning && <span className="text-xs text-blue-500 animate-pulse">Scanning...</span>}
        {!scanning && hasIssues && (
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        )}
        {!scanning && summary && !hasIssues && (
          <span className="w-2 h-2 rounded-full bg-green-500" />
        )}
        <svg className={`w-3 h-3 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {summary && (
        <div className="mt-2">
          {/* Score bar */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${scoreColor} rounded-full transition-all duration-500`}
                style={{ width: `${summary.score}%` }}
              />
            </div>
            <span className="text-xs font-mono text-gray-600">{summary.score}</span>
          </div>

          {/* Severity counts */}
          <div className="flex gap-2 text-xs">
            {summary.critical > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                {summary.critical} 🔴
              </span>
            )}
            {summary.high > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">
                {summary.high} 🟠
              </span>
            )}
            {summary.medium > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">
                {summary.medium} 🟡
              </span>
            )}
            {summary.total === 0 && (
              <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                ✅ Clean
              </span>
            )}
          </div>
        </div>
      )}

      {expanded && (
        <div className="mt-3 space-y-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); runQuickScan(); }}
            disabled={scanning}
            className="w-full text-xs text-left px-2.5 py-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50 transition-colors"
          >
            ⚡ Quick Scan
          </button>
          <a
            href="/security"
            className="block w-full text-xs text-left px-2.5 py-1.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
          >
            🔍 Open Security Dashboard →
          </a>
          {summary && summary.total > 0 && (
            <div className="text-xs text-gray-500 px-2">
              Last scan: {summary.total} finding{summary.total !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
