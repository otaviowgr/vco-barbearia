@echo off
chcp 65001 >nul
title VCO Barbearia - Iniciando somente o site
cd /d "%~dp0"

echo.
echo  ==============================================================
echo   VCO BARBEARIA - SOMENTE O SITE (modo demonstracao)
echo   Os dados ficam no navegador. Nao usa a API nem o banco.
echo  ==============================================================
echo.

where node >nul 2>nul
if errorlevel 1 goto sem_node

netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 goto porta_ocupada

if exist "frontend-barbearia\node_modules" goto iniciar
echo  Instalando as dependencias do site. Isso so acontece na primeira vez...
pushd frontend-barbearia
call npm install
popd

:iniciar
echo  Abrindo o site em outra janela - NAO feche essa janela.
start "VCO - Site Next.js (demonstracao) - NAO FECHE" /D "%~dp0frontend-barbearia" cmd /k npm run dev

set /a tentativas=0
:loop_site
curl -s -f -o nul http://localhost:3000/login
if not errorlevel 1 goto pronto
set /a tentativas+=1
if %tentativas% geq 60 goto nao_subiu
ping -n 3 127.0.0.1 >nul
goto loop_site

:pronto
start "" http://localhost:3000
echo.
echo  PRONTO!  Site: http://localhost:3000
echo  Cliente:  cliente@demo.com  / 123456
echo  Barbeiro: barbeiro@demo.com / 123456
echo.
pause
exit /b 0

:sem_node
echo  [ERRO] Node.js nao encontrado. Instale a versao LTS em https://nodejs.org e tente de novo.
pause
exit /b 1

:porta_ocupada
echo  [ATENCAO] Ja existe um site rodando na porta 3000. Abra http://localhost:3000
echo            ou rode parar-sistema.bat e depois abra este arquivo de novo.
pause
exit /b 1

:nao_subiu
echo  [ERRO] O site nao respondeu. Veja a mensagem na janela "VCO - Site Next.js".
pause
exit /b 1
