@echo off
cd /d "%~dp0"

:: Charge le token depuis .env sans l'afficher
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="GH_TOKEN" set GH_TOKEN=%%b
)

if "%GH_TOKEN%"=="" (
    echo ERREUR : Token GH_TOKEN introuvable dans le fichier .env
    pause
    exit /b 1
)

echo.
echo ================================================
echo   Publication d'une mise a jour ASB CRM
echo ================================================
echo.

:: Affiche la version actuelle
for /f "tokens=2 delims=:, " %%v in ('findstr "\"version\"" package.json') do (
    set VERSION=%%~v
    goto :found
)
:found
echo Version a publier : %VERSION%
echo.
echo Appuie sur une touche pour compiler et publier...
pause > nul

set CSC_IDENTITY_AUTO_DISCOVERY=false
npm run publish:win

if %ERRORLEVEL% == 0 (
    echo.
    echo ================================================
    echo   SUCCES ! Version %VERSION% publiee sur GitHub
    echo   Les utilisateurs recevront la mise a jour
    echo   automatiquement au prochain demarrage.
    echo ================================================
) else (
    echo.
    echo ERREUR lors de la publication. Verifie la connexion internet.
)

echo.
pause
