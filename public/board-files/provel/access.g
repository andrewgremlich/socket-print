;access.g
;State15: this file moves the print head to a maintenance position.
; do we want all heaters off or just the nozzle heater?
M568 P0 R0 S0
M140 S0
; move
G1 X50 Y-70 Z200 F3000