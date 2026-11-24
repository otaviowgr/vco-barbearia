@echo off
chcp 65001 >nul
title VCO Barbearia - Parando o sistema
echo.
echo  Desligando a API com seguranca (fechando o banco de dados)...
curl -s -X POST -o nul http://localhost:8080/api/sistema/desligar

set /a tentativas=0
:esperar_api
netstat -ano | findstr /R /C:":8080 .*LISTENING" >nul
if errorlevel 1 goto api_desligada
set /a tentativas+=1
if %tentativas% geq 15 goto forcar_api
ping -n 2 127.0.0.1 >nul
goto esperar_api

:forcar_api
echo  A API demorou para responder; forcando o desligamento...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":8080 .*LISTENING"') do taskkill /PID %%p /T /F >nul 2>nul

:api_desligada
echo  Desligando o site...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do taskkill /PID %%p /T /F >nul 2>nul
echo.
echo  Pronto. Tudo desligado. As janelas pretas que sobrarem podem ser fechadas.
echo.
pause
