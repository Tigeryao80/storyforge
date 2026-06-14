@echo off
cd /d C:\Users\tiger\hermes-workspace/storyforge

git diff --quiet
if %ERRORLEVEL% EQU 0 (
    git diff --cached --quiet
    if %ERRORLEVEL% EQU 0 (
        echo No changes to sync.
        exit /b 0
    )
)

git add -a
git commit -m "auto-sync: %date% %time%" --no-verify

git remote get-url origin >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    git push origin main
    echo Synced successfully.
) else (
    echo No remote configured. Run: git remote add origin ^<your-repo-url^>
)
