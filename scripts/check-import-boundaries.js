#!/usr/bin/env node
// scripts/check-import-boundaries.js
// Pre-flight check: scans client-side code for imports of server-only packages.
// Run before next dev / next build to catch bundling issues early.
//
// Usage: node scripts/check-import-boundaries.js
// Exit code 0 = clean, 1 = violations found

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Configuration ──────────────────────────────────────────────────────────

// Packages that are Node-only and must NEVER be imported in client code
const SERVER_ONLY_PACKAGES = [
  // Node built-ins
  'fs', 'path', 'child_process', 'crypto', 'stream', 'buffer', 'util',
  'assert', 'url', 'os', 'zlib', 'http', 'https', 'net', 'tls', 'dns',
  'readline', 'repl', 'vm', 'cluster', 'dgram', 'worker_threads',
  // npm packages that depend on Node built-ins
  'epub-gen-memory', // → ejs → fs
  'pdfkit',          // → fs
  'ejs',             // → fs
  'mobi',            // → epub-gen-memory → fs
  'sharp',           // → fs + native bindings
  'canvas',          // → native bindings
];

// Directories that are client-side (imports here must be browser-safe)
const CLIENT_DIRS = [
  'src/app',
  'src/components',
  'src/hooks',
];

// Files/directories to skip
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  'src/lib/export',       // server-only lib — allowed to import server packages
  'src/app/api',          // API routes — server-only by design
  'scripts/',             // build scripts — Node by design
];

// ── Helpers ────────────────────────────────────────────────────────────────

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(p => filePath.includes(p));
}

function walkDir(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (shouldIgnore(full)) continue;
    if (entry.isDirectory()) {
      files.push(...walkDir(full));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

// Find all imports (static and dynamic) in a file
function findImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const imports = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Static imports: import X from 'Y' or import { X } from 'Y'
    const staticMatch = line.match(/^import\s+.*?\s+from\s+['"]([^'"]+)['"]/);
    if (staticMatch) {
      imports.push({ line: lineNum, source: staticMatch[1], raw: line });
    }

    // Dynamic imports: await import('Y') or import('Y')
    const dynamicMatch = line.match(/(?:await\s+)?import\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (dynamicMatch) {
      imports.push({ line: lineNum, source: dynamicMatch[1], raw: line, dynamic: true });
    }

    // require('Y') — less common in TS but still possible
    const requireMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (requireMatch) {
      imports.push({ line: lineNum, source: requireMatch[1], raw: line, require: true });
    }
  }

  return imports;
}

// Resolve an import source to a package name
function resolveToPackage(source) {
  // Relative imports — resolve to actual file
  if (source.startsWith('.') || source.startsWith('@/')) {
    return { type: 'relative', source };
  }
  // Scoped package: @scope/name
  if (source.startsWith('@')) {
    const parts = source.split('/');
    return { type: 'package', name: parts.slice(0, 2).join('/') };
  }
  // Regular package: name
  return { type: 'package', name: source.split('/')[0] };
}

// Check if a relative import eventually pulls in a server-only package
function checkRelativeImport(source, filePath, depth = 0) {
  if (depth > 5) return []; // prevent infinite recursion

  const dir = path.dirname(filePath);
  let resolved = path.resolve(dir, source);

  // Try extensions
  const candidates = [
    resolved,
    resolved + '.ts',
    resolved + '.tsx',
    resolved + '/index.ts',
    resolved + '/index.tsx',
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    if (shouldIgnore(candidate)) return []; // skip ignored dirs

    const imports = findImports(candidate);
    const violations = [];

    for (const imp of imports) {
      const resolved = resolveToPackage(imp.source);

      if (resolved.type === 'package') {
        if (SERVER_ONLY_PACKAGES.includes(resolved.name)) {
          violations.push({
            file: candidate,
            line: imp.line,
            package: resolved.name,
            chain: `→ ${resolved.name}`,
          });
        }
      } else if (resolved.type === 'relative') {
        const deeper = checkRelativeImport(resolved.source, candidate, depth + 1);
        violations.push(...deeper);
      }
    }

    return violations;
  }

  return [];
}

// ── Main ───────────────────────────────────────────────────────────────────

console.log('🔍 Checking import boundaries...\n');

const cwd = process.cwd();
let allViolations = [];
let filesChecked = 0;

for (const clientDir of CLIENT_DIRS) {
  const dirPath = path.join(cwd, clientDir);
  const files = walkDir(dirPath);

  for (const file of files) {
    filesChecked++;
    const imports = findImports(file);
    const relPath = path.relative(cwd, file);

    for (const imp of imports) {
      const resolved = resolveToPackage(imp.source);

      if (resolved.type === 'package') {
        if (SERVER_ONLY_PACKAGES.includes(resolved.name)) {
          allViolations.push({
            file: relPath,
            line: imp.line,
            package: resolved.name,
            dynamic: imp.dynamic,
            raw: imp.raw.trim(),
          });
        }
      } else if (resolved.type === 'relative') {
        const chainViolations = checkRelativeImport(imp.source, file);
        for (const v of chainViolations) {
          allViolations.push({
            file: relPath,
            line: imp.line,
            package: v.package,
            dynamic: imp.dynamic,
            raw: imp.raw.trim(),
            chain: `${relPath}:${imp.line} → ${path.relative(cwd, v.file)}:${v.line}`,
          });
        }
      }
    }
  }
}

// ── Report ─────────────────────────────────────────────────────────────────

if (allViolations.length === 0) {
  console.log(`✅ Clean — checked ${filesChecked} files, no server-only imports in client code.\n`);
  process.exit(0);
}

console.log(`❌ Found ${allViolations.length} import boundary violation(s):\n`);

for (const v of allViolations) {
  const type = v.dynamic ? 'dynamic import' : 'static import';
  console.log(`  ${v.file}:${v.line} — ${type}`);
  console.log(`    ${v.raw}`);
  console.log(`    └─ pulls in '${v.package}' (Node-only)`);
  if (v.chain) console.log(`    chain: ${v.chain}`);
  console.log();
}

console.log('─'.repeat(60));
console.log('Fix: Move server-only logic to an API route under src/app/api/');
console.log('     The client should call fetch("/api/...") instead of importing.');
console.log('─'.repeat(60));
console.log();

process.exit(1);
