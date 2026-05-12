@echo off
title INFRATEK dev server
cd /d "%~dp0"
echo.
echo Starting Astro dev server (Ctrl+C to stop)
echo Folder: %CD%
echo.
npm run dev
if errorlevel 1 pause
