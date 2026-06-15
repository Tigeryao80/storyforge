@echo off
:: ============================================
::  ComfyUI Launcher for StoryForge
::  Starts ComfyUI with the correct Python env
:: ============================================

title ComfyUI - StoryForge Cover Generator

set COMFYUI_DIR=C:\Users\tiger\ComfyUI-Installs\ComfyUI\ComfyUI
set PYTHONPATH=%COMFYUI_DIR%\.venv\Lib\site-packages
set OUTPUT_DIR=C:\Users\tiger\ComfyUI-Shared\output
set INPUT_DIR=C:\Users\tiger\ComfyUI-Shared\input

echo ============================================
echo   ComfyUI - StoryForge Cover Generator
echo ============================================
echo.
echo   GPU:     NVIDIA RTX 3060 Laptop (6GB)
echo   Models:  Juggernaut XL v9, Realistic Vision V5.1
echo   Output:  %OUTPUT_DIR%
echo   API:     http://127.0.0.1:8188
echo.
echo   Starting ComfyUI...
echo   (This takes ~30-60 seconds on first launch)
echo ============================================
echo.

cd /d "%COMFYUI_DIR%"
"%COMFYUI_DIR%\.venv\Scripts\python.exe" -B main.py ^
  --listen 127.0.0.1 --port 8188 ^
  --output-directory "%OUTPUT_DIR%" ^
  --input-directory "%INPUT_DIR%"

echo.
echo ComfyUI has stopped.
pause
