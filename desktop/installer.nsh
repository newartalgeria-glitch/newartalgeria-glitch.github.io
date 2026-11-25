; Installation code page (asked before the files are installed).
; The code is never stored in clear text: only a one-way-ish number derived from it.
!include nsDialogs.nsh
!include LogicLib.nsh

!macro customInit
  ${If} ${Silent}
    Abort
  ${EndIf}
!macroend

!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
  Page custom NadirCodeCreate NadirCodeLeave
  Var /GLOBAL NadirCodeField
  Function NadirCodeCreate
    !insertmacro MUI_HEADER_TEXT "Nadir Photo Lab - Nadir" "Code d'installation requis"
    nsDialogs::Create 1018
    Pop $0
    ${NSD_CreateLabel} 0 0 100% 24u "Entrez le code secret fourni par Nadir pour installer Nadir Photo Lab."
    Pop $0
    ${NSD_CreatePassword} 0 34u 50% 14u ""
    Pop $NadirCodeField
    ${NSD_CreateLabel} 0 56u 100% 24u "Le code est composé de chiffres uniquement."
    Pop $0
    nsDialogs::Show
  FunctionEnd
  Function NadirCodeLeave
    ${NSD_GetText} $NadirCodeField $0
    ${If} $0 == ""
      MessageBox MB_OK|MB_ICONEXCLAMATION "Veuillez saisir le code."
      Abort
    ${EndIf}
    IntOp $1 $0 + 0
    IntOp $2 $1 ^ 0x5A5A1234
    IntOp $2 $2 * 40503
    IntOp $2 $2 + 12345
    ${If} $2 <> -1763240321
      MessageBox MB_OK|MB_ICONSTOP "Code incorrect. L'installation ne peut pas continuer."
      Abort
    ${EndIf}
  FunctionEnd
!macroend
