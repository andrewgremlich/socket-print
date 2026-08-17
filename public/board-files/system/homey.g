; homey.g
; called to home the Y axis
;

G91               ; relative positioning
G1 H1 Y-503 F3600 ; move quickly to Y axis endstop and stop there (first pass)
if move.axes[0].machinePosition <= -503
    set set global.yLF =1
    abort
G1 H2 Y5 F6000    ; go back a few mm
G1 H1 Y-6 F600  ; move slowly to X axis endstop once more (second pass)
G1 H2 Y5 F6000
G90               ; absolute positioning