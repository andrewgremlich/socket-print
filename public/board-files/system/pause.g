; pause.g
; called when a print from SD card is paused
;

;raise
  if move.axes[2].machinePosition <490
    G91
    G1 Z5 F3000
    G90
; Cancel automatically does not work
;M0