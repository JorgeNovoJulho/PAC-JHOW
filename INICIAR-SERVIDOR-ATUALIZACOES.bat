@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist "dist\latest.yml" (
  echo.
  echo Ainda nao existe dist\latest.yml.
  echo Gera primeiro o instalador com: npm run dist
  echo.
  pause
  exit /b 1
)

echo.
echo Servidor local de atualizacoes do PAC-JHOW
echo Abre a aplicacao: Opcoes -^> Servidor proprio / local
echo Endereco: http://127.0.0.1:8787/
echo Para parar: fecha esta janela ou prime Ctrl+C.
echo.
node update-server\server.js
pause
