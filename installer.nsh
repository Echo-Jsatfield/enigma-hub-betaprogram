; Custom NSIS installer script for Enigma Hub
; This script runs during installation and uninstallation

!macro customUnInstall
  ; Delete AppData folder
  RMDir /r "$APPDATA\enigma-hub-frontend"

  ; Try to delete plugins from common game locations
  ; Current plugin: enigma_telemetry_core.dll
  ; ETS2 Steam default (64-bit)
  Delete "$PROGRAMFILES64\Steam\steamapps\common\Euro Truck Simulator 2\bin\win_x64\plugins\enigma_telemetry_core.dll"
  ; Legacy cleanup (old plugin structure)
  Delete "$PROGRAMFILES64\Steam\steamapps\common\Euro Truck Simulator 2\bin\win_x64\plugins\scs-telemetry.dll"
  RMDir /r "$PROGRAMFILES64\Steam\steamapps\common\Euro Truck Simulator 2\bin\win_x64\plugins\enigma"

  ; ATS Steam default (64-bit)
  Delete "$PROGRAMFILES64\Steam\steamapps\common\American Truck Simulator\bin\win_x64\plugins\enigma_telemetry_core.dll"
  ; Legacy cleanup
  Delete "$PROGRAMFILES64\Steam\steamapps\common\American Truck Simulator\bin\win_x64\plugins\scs-telemetry.dll"
  RMDir /r "$PROGRAMFILES64\Steam\steamapps\common\American Truck Simulator\bin\win_x64\plugins\enigma"

  ; Alternative Steam location (x86 Program Files)
  Delete "$PROGRAMFILES\Steam\steamapps\common\Euro Truck Simulator 2\bin\win_x64\plugins\enigma_telemetry_core.dll"
  Delete "$PROGRAMFILES\Steam\steamapps\common\Euro Truck Simulator 2\bin\win_x64\plugins\scs-telemetry.dll"
  RMDir /r "$PROGRAMFILES\Steam\steamapps\common\Euro Truck Simulator 2\bin\win_x64\plugins\enigma"

  Delete "$PROGRAMFILES\Steam\steamapps\common\American Truck Simulator\bin\win_x64\plugins\enigma_telemetry_core.dll"
  Delete "$PROGRAMFILES\Steam\steamapps\common\American Truck Simulator\bin\win_x64\plugins\scs-telemetry.dll"
  RMDir /r "$PROGRAMFILES\Steam\steamapps\common\American Truck Simulator\bin\win_x64\plugins\enigma"
!macroend
