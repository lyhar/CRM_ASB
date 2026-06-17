!include nsDialogs.nsh
!include LogicLib.nsh
!include FileFunc.nsh

!macro customInit
  ; Répertoire d'install par défaut : Program Files\CRM Trajectoire\app
  StrCpy $INSTDIR "$PROGRAMFILES64\CRM Trajectoire\app"
  SetShellVarContext all
  StrCpy $DataDirPath "$APPDATA\CRM Trajectoire\data"
!macroend

; Page de sélection du dossier DATA — affichée après le choix du dossier APP
!macro customPageAfterChangeDir
  Page custom DataDirPage DataDirPageLeave
!macroend

!macro customInstall
  ; Créer le dossier data et donner les droits d'écriture aux utilisateurs
  CreateDirectory "$DataDirPath"
  ExecWait 'icacls "$DataDirPath" /grant *S-1-5-32-545:(OI)(CI)F /T /Q'
  ; Sauvegarder le chemin des données dans le registre
  WriteRegStr HKLM "Software\CRM Trajectoire" "DataDir" "$DataDirPath"
!macroend

!macro customUnInstall
  DeleteRegValue HKLM "Software\CRM Trajectoire" "DataDir"
!macroend

; Variables et fonctions de page : compilées uniquement pour l'installeur
!ifndef BUILD_UNINSTALLER

Var DataDirPath
Var DataDirControl

Function DataDirPage
  ; Propose un dossier data partage sous ProgramData
  SetShellVarContext all
  StrCpy $DataDirPath "$APPDATA\CRM Trajectoire\data"

  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0u 100% 14u "Dossier des données"
  Pop $0
  SetCtlColors $0 "" transparent
  CreateFont $1 "$(^Font)" "10" "700"
  SendMessage $0 ${WM_SETFONT} $1 0

  ${NSD_CreateLabel} 0 18u 100% 36u "Ce dossier contiendra la base de données et les documents importés.$\r$\nIl ne sera jamais supprimé lors des mises à jour de l'application."
  Pop $0

  ${NSD_CreateDirRequest} 0 62u 78% 14u "$DataDirPath"
  Pop $DataDirControl

  ${NSD_CreateBrowseButton} 81% 62u 19% 14u "Parcourir..."
  Pop $0
  ${NSD_OnClick} $0 OnDataDirBrowse

  nsDialogs::Show
FunctionEnd

Function OnDataDirBrowse
  Pop $0
  ${NSD_GetText} $DataDirControl $DataDirPath
  nsDialogs::SelectFolderDialog "Choisir le dossier des données" "$DataDirPath"
  Pop $0
  ${If} $0 != error
    StrCpy $DataDirPath $0
    ${NSD_SetText} $DataDirControl $DataDirPath
  ${EndIf}
FunctionEnd

Function DataDirPageLeave
  ${NSD_GetText} $DataDirControl $DataDirPath
  ${If} $DataDirPath == ""
    MessageBox MB_OK|MB_ICONEXCLAMATION "Veuillez choisir un dossier pour les données."
    Abort
  ${EndIf}
FunctionEnd

!endif
