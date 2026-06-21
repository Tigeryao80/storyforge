# J.A.R.V.I.S. — Full System Audit & Build Plan
## Hermes Agent + Obsidian Vault Integration

---

## YOUR SYSTEM — FULL AUDIT

### Hardware
| Component | Spec |
|-----------|------|
| **CPU** | AMD Ryzen 7 6800H (8C/16T) |
| **RAM** | 32 GB |
| **OS** | Windows 11 (Build 26200) |
| **Shell** | MSYS2/MinGW64 bash |

### Development Environment
| Tool | Version | Status |
|------|---------|--------|
| **Node.js** | v24.x | ✅ Working |
| **Python** | 3.14.x | ✅ Working |
| **uv** | 0.11.21 | ✅ Working |
| **Rust** | 1.96.0 | ✅ Working |
| **Cargo** | 1.96.0 | ✅ Working |
| **Git** | 2.54.0 | ✅ Working |
| **Docker** | 29.5.3 | ✅ Working |
| **FFmpeg** | 8.1.1 | ✅ Working |
| **CMake** | 4.3.3 | ✅ Working |

### Python Packages (Key Ones)
| Package | Version | Purpose |
|---------|---------|---------|
| **mcp** | 1.26.0 | ✅ MCP protocol library |
| **uvicorn** | 0.41.0 | ✅ ASGI server |
| **aiohttp** | 3.13.4 | ✅ HTTP client/server |
| **cryptography** | 49.0.0 | ✅ Encryption |
| **ctranslate2** | 4.8.0 | ✅ Local AI inference |
| **discord.py** | 2.7.1 | ✅ Discord bot |
| **edge-tts** | 7.2.7 | ✅ Text-to-speech |
| **boto3** | 1.42.89 | ✅ AWS SDK |

### npm Global Packages
| Package | Version | Purpose |
|---------|---------|---------|
| **n8n** | 2.25.7 | ✅ Workflow automation |
| **pnpm** | 11.7.0 | ✅ Package manager |
| **sqlite3** | 6.0.1 | ✅ Database |

### Hermes Agent
| Component | Path | Status |
|-----------|------|--------|
| **Config** | `C:\Users\tiger\.hermes\config.yaml` | ✅ Active |
| **Skills** | `C:\Users\tiger\.hermes\skills\` | ✅ 12+ skills |
| **Memories** | `C:\Users\tiger\.hermes\memories\` | ✅ Active |
| **Sessions** | `C:\Users\tiger\.hermes\sessions\` | ✅ Active |
| **MCP servers** | storyforge_fs, storyforge_memory, storyforge_git, storyforge_book, webforge | ✅ 5 servers |
| **Telegram** | Connected | ✅ Bot active |

### Obsidian Vault
| Component | Path | Status |
|-----------|------|--------|
| **Vault location** | `C:\Users\tiger\Documents\Obsidian Vault\HermesVault\` | ✅ Exists |
| **Core plugins** | daily-notes, templates, graph, search, word-count, properties | ✅ Enabled |
| **Community plugins** | NONE installed | ❌ Need to install |
| **REST API plugin** | NOT installed | ❌ Need to install |
| **Current structure** | 1_raw, 2_wiki, 3_output, 4_archive, 5_templates, Tasks | ⚠️ Needs restructuring |

### StoryForge Codebase
| Component | Status |
|-----------|--------|
| **Next.js app** | ✅ v0.7.0, compiles |
| **TipTap editor** | ✅ Working |
| **Export (PDF/EPUB/DOCX)** | ✅ Working |
| **MCP server** | ✅ Custom server |
| **Hermes integration** | ✅ Via MCP |

---

## WHAT'S MISSING (J.A.R.V.I.S. Requirements)

### Critical (Must Install)
1. **Obsidian Local REST API plugin** — Needed for Hermes to read/write vault
2. **mcp-obsidian Python package** — MCP bridge between Hermes and Obsidian
3. **Community plugins**: Templater, Dataview (optional but recommended)

### Nice to Have
4. **Templater plugin** — Advanced template engine for daily notes
5. **Dataview plugin** — Query vault like a database
6. **Tasks plugin** — Task management inside Obsidian

---

## BUILD PLAN (Ponytail Approach — Least Code, Maximum Impact)

### Step 1: Install Obsidian Plugin (5 minutes)
```
In Obsidian:
1. Settings → Community Plugins → Turn off "Restricted Mode"
2. Browse → Search "Local REST API"
3. Install → Enable
4. Settings → Local REST API → Enable
5. Copy API Key
6. Set port: 27124 (default)
7. Enable "Start server on startup"
```

### Step 2: Install mcp-obsidian (2 minutes)
```bash
pip3 install mcp-obsidian
```

### Step 3: Add to Hermes Config (1 minute)
Add to `C:\Users\tiger\.hermes\config.yaml` under `mcp_servers`:

```yaml
  obsidian:
    command: "uvx"
    args: ["mcp-obsidian"]
    env:
      OBSIDIAN_API_KEY: "YOUR_API_KEY_HERE"
      OBSIDIAN_HOST: "127.0.0.1"
      OBSIDIAN_PORT: "27124"
    timeout: 30
    connect_timeout: 60
```

### Step 4: Restructure Vault (I'll do this)
```
HermesVault/
├── 0_BRAIN/
│   ├── SOUL.md          ← Your identity, values, style
│   ├── MEMORY.md        ← Long-term memories
│   ├── SKILLS.md        ← Skills & procedures
│   └── PREFERENCES.md   ← Habits, routines, preferences
├── 1_JOURNAL/
│   └── 2026/
│       └── 2026-06-18.md  ← Daily logs
├── 2_LIBRARY/
│   ├── projects/        ← Active projects
│   ├── references/      ← Research materials
│   └── resources/       ← Tools, links, contacts
├── 3_DASHBOARD/
│   ├── TODO.md          ← Master task list
│   ├── FOCUS.md         ← Top 3 priorities
│   └── PROJECTS.md      ← Project status
├── 4_OUTPUT/            ← Completed work
├── 5_TEMPLATES/         ← Note templates
└── .obsidian/           ← Config (existing)
```

### Step 5: Create Brain Files (I'll do this)
Populate SOUL.md, MEMORY.md, SKILLS.md from what I already know.

### Step 6: Test (2 minutes)
```bash
# Test the MCP server directly
uvx mcp-obsidian
# Should start without errors

# Then test via Hermes — ask:
# "Search my vault for Trophy Wife"
# "What's in my daily log?"
# "Create a note called 'test' with content 'hello'"
```

---

## WHAT THIS GIVES YOU (J.A.R.V.I.S. Capabilities)

| Capability | How It Works |
|-----------|--------------|
| **Persistent memory** | Hermes reads/writes MEMORY.md across sessions |
| **Daily journaling** | Hermes auto-logs to 1_JOURNAL/YYYY/YYYY-MM-DD.md |
| **Semantic search** | `mcp-obsidian` `search` tool searches all vault content |
| **Task management** | Hermes reads/writes TODO.md, FOCUS.md |
| **Project context** | Hermes knows what you're working on |
| **Self-updating** | Weekly memory consolidation from daily logs |
| **Note creation** | Hermes can create new notes from conversations |
| **Context injection** | Hermes reads relevant notes before responding |

---

## ESTIMATED TIME

| Step | Time | Who |
|------|------|-----|
| Install Obsidian plugin | 5 min | You |
| Install mcp-obsidian | 2 min | Terminal |
| Give me API key | 1 min | You |
| I restructure vault | 15 min | Me |
| I create brain files | 30 min | Me |
| Test | 5 min | You |
| **TOTAL** | **~1 hour** | |

---

## FIRST ACTION — DO THIS NOW

1. **Open Obsidian**
2. **Settings → Community Plugins → Browse**
3. **Search "Local REST API"**
4. **Install + Enable**
5. **Copy the API key**
6. **Give it to me**

I'll do everything else.
