@echo off
echo ========================================
echo ENVIAR TUDO PARA O GITHUB
echo ========================================
echo.

echo [1/5] Verificando status atual...
git status
echo.

echo [2/5] Adicionando TODOS os arquivos...
git add -A
echo.

echo [3/5] Arquivos que serao enviados:
git status
echo.

set /p msg="Digite a mensagem do commit: "
echo.

echo [4/5] Fazendo commit...
git commit -m "%msg%"
echo.

echo [5/5] Enviando para GitHub...
git push
echo.

echo ========================================
echo PRONTO! Verifique no GitHub:
echo https://github.com/Helgonhc/chameiapp-portal
echo ========================================
pause
