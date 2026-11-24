@echo off
chcp 65001 >nul
title VCO Barbearia - Iniciando sistema completo
cd /d "%~dp0"

echo.
echo  ==============================================================
echo   VCO BARBEARIA - SISTEMA COMPLETO: site + API + banco H2
echo  ==============================================================
echo.

where node >nul 2>nul
if errorlevel 1 goto sem_node
where java >nul 2>nul
if errorlevel 1 goto sem_java

netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 goto porta_site_ocupada

if exist "frontend-barbearia\node_modules" goto api
echo  Instalando as dependencias do site. Isso so acontece na primeira vez...
pushd frontend-barbearia
call npm install
popd

:api
netstat -ano | findstr /R /C:":8080 .*LISTENING" >nul
if not errorlevel 1 goto api_ja_rodando
echo  [1/3] Abrindo a API em outra janela - NAO feche essa janela.
start "VCO - API Spring Boot - NAO FECHE" /D "%~dp0backend-barbearia" cmd /k "%~dp0backend-barbearia\mvnw.cmd" spring-boot:run
goto esperar_api

:api_ja_rodando
echo  [1/3] A API ja estava rodando na porta 8080.

:esperar_api
echo  [2/3] Aguardando a API ficar pronta. Na primeira vez pode levar 1 a 3 minutos...
set /a tentativas=0
:loop_api
curl -s -f -o nul http://localhost:8080/api/config
if not errorlevel 1 goto api_pronta
set /a tentativas+=1
if %tentativas% geq 150 goto api_nao_subiu
ping -n 3 127.0.0.1 >nul
goto loop_api

:api_pronta
echo        API pronta!
echo  [3/3] Abrindo o site em outra janela - NAO feche essa janela.
start "VCO - Site Next.js - NAO FECHE" /D "%~dp0frontend-barbearia" cmd /k npm run dev:api

set /a tentativas=0
:loop_site
curl -s -f -o nul http://localhost:3000/login
if not errorlevel 1 goto site_pronto
set /a tentativas+=1
if %tentativas% geq 60 goto site_nao_subiu
ping -n 3 127.0.0.1 >nul
goto loop_site

:site_pronto
start "" http://localhost:3000
echo.
echo  ==============================================================
echo   TUDO PRONTO!  Site: http://localhost:3000
echo   Cliente:  cliente@demo.com  / 123456
echo   Barbeiro: barbeiro@demo.com / 123456
echo   Para desligar tudo: feche as duas janelas ou rode parar-sistema.bat
echo  ==============================================================
echo.
pause
exit /b 0

:sem_node
echo  [ERRO] Node.js nao encontrado. Instale a versao LTS em https://nodejs.org e tente de novo.
pause
exit /b 1

:sem_java
echo  [ERRO] Java nao encontrado. Instale o JDK 21 ou mais novo e tente de novo.
pause
exit /b 1

:porta_site_ocupada
echo  [ATENCAO] Ja existe um site rodando na porta 3000.
echo            Feche a outra janela do site ou rode parar-sistema.bat, e depois abra este arquivo de novo.
pause
exit /b 1

:api_nao_subiu
echo  [ERRO] A API nao respondeu. Veja a mensagem de erro na janela "VCO - API Spring Boot".
pause
exit /b 1

:site_nao_subiu
echo  [ERRO] O site nao respondeu. Veja a mensagem de erro na janela "VCO - Site Next.js".
pause
exit /b 1
