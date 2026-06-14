# Phase 4 Plan — PWA, Cloud Backup, Sprint Timer, Word Count Targets

> Created: 2026-06-14 | Status: In Progress

## Tasks

### Task 4.1: PWA Configuration
- Create `public/manifest.json` with app name, icons, theme color, display mode
- Create `public/sw.js` service worker with offline cache strategy
- Update `next.config.ts` to enable PWA output
- Update `src/app/layout.tsx` to link manifest, add meta viewport, theme-color

### Task 4.2: Cloud Backup UI
- Create `src/components/backup/CloudBackup.tsx` — UI panel for backup/sync status
- Add cloud backup state to bookStore (lastBackupAt, backupStatus: 'idle'|'syncing'|'error'|'synced')
- Implement export-to-JSON backup (download .atticus backup file)
- Implement restore-from-JSON (upload .atticus file, replace current book)

### Task 4.3: Writing Sprint Timer
- Create `src/components/sprint/SprintTimer.tsx` — Pomodoro-style sprint timer
- Add sprint state to bookStore (sprintDuration, sprintRemaining, isSprinting, sprintsCompleted)
- Store sprint history (timestamp, words written during sprint)
- Visual timer display with start/pause/reset controls

### Task 4.4: Chapter/Scene Word Count Targets
- Add `wordCountGoal` field to Chapter type
- Update store with `setChapterGoal(id, goal)` action
- Create `src/components/sidebar/ChapterGoals.tsx` — per-chapter word count progress bar
- Show chapter completion percentage in ChapterTree alongside existing word count
