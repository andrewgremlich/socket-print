; homez.g
; called to home the Z axis
;

G91               ; relative positioning
G1 H1 Z510 F3600 ; move quickly to Z axis endstop and stop there (first pass)
if move.axes[0].machinePosition >= 510
    set set global.zLF =1
    abort
G1 H2 Z-5 F6000    ; go back a few mm
G1 H1 Z6 F600  ; move slowly to Z axis endstop once more (second pass)
G1 H2 Z-5 F6000
G90               ; absolute positioning

