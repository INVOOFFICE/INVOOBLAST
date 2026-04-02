@echo off
chcp 65001 >nul
title INVOOBLAST - Relais SMTP
cd /d "%~dp0"

echo Dossier: %CD%
echo.

if not exist "package.json" (
  echo Erreur: package.json introuvable. Placez ce script dans le dossier server du projet.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo Erreur: npm introuvable. Installez Node.js https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installation des dependances ^(premiere fois^)...
  call npm install
  if errorlevel 1 (
    echo Echec de npm install.
    pause
    exit /b 1
  )
  echo.
)

echo Demarrage du relais SMTP ^(http://127.0.0.1:18765 par defaut^)...
echo Laissez cette fenetre ouverte pendant l'envoi des e-mails.
echo Ctrl+C pour arreter.
echo.
call npm start

echo.
pause
