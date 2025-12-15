@echo off
echo ========================================
echo   DEPLOY RAPIDO - PORTAL CLIENTE
echo ========================================
echo.

echo [1/3] Adicionando arquivos...
git add .

echo.
echo [2/3] Fazendo commit...
set /p msg="Digite a mensagem do commit (ou Enter para usar padrao): "
if "%msg%"=="" set msg=Update: Deploy para Vercel

git commit -m "%msg%"

echo.
echo [3/3] Enviando para GitHub...
git push origin main

echo.
echo ========================================
echo   DEPLOY CONCLUIDO!
echo ========================================
echo.
echo Proximos passos:
echo 1. Acesse https://vercel.com
echo 2. Verifique o deploy automatico
echo 3. Aguarde 2-3 minutos
echo.
pause
