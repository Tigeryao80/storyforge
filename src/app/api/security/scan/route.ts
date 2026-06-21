// src/app/api/security/scan/route.ts
// Server-side security scan API. Runs Python security scanners and returns results.

import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/api/auth';
import { z } from 'zod';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';

const execAsync = promisify(exec);

const ScanBodySchema = z.object({
  level: z.enum(['quick', 'deep']).default('quick'),
});

const MAX_BODY_SIZE = 10 * 1024; // 10KB — scan requests are small

export async function POST(request: Request) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const roleError = requireRole('admin');
  if (roleError) return roleError;

  // Body size check
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return NextResponse.json({ error: `Body too large. Max ${MAX_BODY_SIZE / 1024}KB.` }, { status: 413 });
  }

  try {
    const rawBody = await request.json();
    const parsed = ScanBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
    }
    const level = parsed.data.level;
    const body: { level: 'quick' | 'deep' } = { level };

    const home = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\tiger';
    const scriptsDir = join(home, '.hermes', 'scripts');
    const pythonExe = join(home, 'AppData', 'Local', 'hermes', 'hermes-agent', 'venv', 'Scripts', 'python.exe');

    const tools: Record<string, unknown> = {};

    // 1. Quick scan
    if (level === 'quick') {
      try {
        const { stdout } = await execAsync(
          `"${pythonExe}" "${join(scriptsDir, 'security-scan.py')}"`,
          { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
        );
        tools.quick_scan = JSON.parse(stdout);
      } catch (e: unknown) {
        const err = e as { stdout?: string; stderr?: string; message?: string };
        try { tools.quick_scan = JSON.parse(err.stdout || '{}'); }
        catch { tools.quick_scan = { error: err.message || 'Scan failed' }; }
      }
    }

    // 2. Deep scan
    if (level === 'deep') {
      // security-deep.py
      try {
        const { stdout } = await execAsync(
          `"${pythonExe}" "${join(scriptsDir, 'security-deep.py')}"`,
          { timeout: 120000, maxBuffer: 10 * 1024 * 1024 }
        );
        tools.deep_scan = JSON.parse(stdout);
      } catch (e: unknown) {
        const err = e as { stdout?: string; message?: string };
        try { tools.deep_scan = JSON.parse(err.stdout || '{}'); }
        catch { tools.deep_scan = { error: err.message || 'Deep scan failed' }; }
      }

      // Auth tester
      try {
        const { stdout } = await execAsync(
          `"${pythonExe}" "${join(scriptsDir, 'auth-tester.py')}"`,
          { timeout: 30000, maxBuffer: 5 * 1024 * 1024 }
        );
        tools.auth_test = JSON.parse(stdout);
      } catch (e: unknown) {
        const err = e as { stdout?: string; message?: string };
        try { tools.auth_test = JSON.parse(err.stdout || '{}'); }
        catch { tools.auth_test = { error: err.message }; }
      }

      // Header checker
      try {
        const { stdout } = await execAsync(
          `"${pythonExe}" "${join(scriptsDir, 'header-checker.py')}"`,
          { timeout: 30000, maxBuffer: 5 * 1024 * 1024 }
        );
        tools.header_check = JSON.parse(stdout);
      } catch (e: unknown) {
        const err = e as { stdout?: string; message?: string };
        try { tools.header_check = JSON.parse(err.stdout || '{}'); }
        catch { tools.header_check = { error: err.message }; }
      }

      // Bandit
      try {
        const { stdout } = await execAsync(
          `"${pythonExe}" -m bandit -r "${scriptsDir}" -f json -q`,
          { timeout: 60000, maxBuffer: 5 * 1024 * 1024 }
        );
        const banditData = JSON.parse(stdout || '{}');
        const results = banditData.results || [];
        tools.bandit = {
          issues: results.map((r: { test_id: string; issue_text: string; filename: string; line_number: number; issue_severity: string }) => ({
            id: r.test_id, text: r.issue_text, file: r.filename,
            line: r.line_number, severity: r.issue_severity,
          })),
          total: results.length,
        };
      } catch { tools.bandit = { error: 'Bandit not available' }; }

      // pip-audit
      try {
        const { stdout } = await execAsync(
          `"${pythonExe}" -m pip_audit --format json`,
          { timeout: 60000, maxBuffer: 5 * 1024 * 1024 }
        );
        const auditData = JSON.parse(stdout || '{}');
        const deps = auditData.dependencies || [];
        const vulns = deps.filter((d: { vulns?: unknown[] }) => d.vulns && d.vulns.length > 0);
        tools.pip_audit = {
          total_packages: deps.length,
          vulnerable_packages: vulns.length,
          findings: vulns.map((d: { name: string; version: string; vulns: { id: string; fix_versions: string[] }[] }) => ({
            package: d.name, version: d.version,
            vulns: d.vulns.map((v: { id: string; fix_versions: string[] }) => ({
              id: v.id, fix: v.fix_versions.join(', '),
            })),
          })),
        };
      } catch { tools.pip_audit = { error: 'pip-audit failed' }; }
    }

    // Calculate totals
    let totalCritical = 0;
    let totalHigh = 0;
    let totalMedium = 0;
    let totalLow = 0;

    const countFindings = (obj: unknown) => {
      if (!obj || typeof obj !== 'object') return;
      const o = obj as Record<string, unknown>;
      if (typeof o.critical === 'number') totalCritical += o.critical;
      if (typeof o.high === 'number') totalHigh += o.high;
      if (typeof o.medium === 'number') totalMedium += o.medium;
      if (typeof o.low === 'number') totalLow += o.low;
      if (Array.isArray(o.findings)) {
        for (const f of o.findings as { severity?: string }[]) {
          if (f.severity === 'CRITICAL') totalCritical++;
          else if (f.severity === 'HIGH') totalHigh++;
          else if (f.severity === 'MEDIUM') totalMedium++;
          else if (f.severity === 'LOW') totalLow++;
        }
      }
    };

    for (const toolResult of Object.values(tools)) {
      countFindings(toolResult);
    }

    return NextResponse.json({
      scan_time: new Date().toISOString(),
      level,
      tools,
      summary: {
        critical: totalCritical,
        high: totalHigh,
        medium: totalMedium,
        low: totalLow,
        total: totalCritical + totalHigh + totalMedium + totalLow,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scan failed' },
      { status: 500 }
    );
  }
}
