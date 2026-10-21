;coldSoak.g
;added 2026-10-16
;called from the print file start G-code directly after the barrel and cup
;temperatures are set, before the M116 temperature waits
;if the barrel is below var.soakTemp when this macro starts, it waits for the
;barrel to reach temperature, then waits var.soakTime seconds so the screw and
;the material in the barrel reach temperature
;the cup heater stays on during the soak

var soakTemp = 150   ; barrel temperature (C) below which the print soaks
var soakTime = 300   ; soak time (s) after the barrel reaches temperature

if heat.heaters[1].current >= var.soakTemp
  M99

M116 P0 S5 ; wait for barrel temperature +/-5C, same as the print file
M118 P3 S{"cold start - soaking barrel for "^var.soakTime^" s"}
var soakEnd = state.upTime + var.soakTime
while state.upTime < var.soakEnd
  G4 S1
M118 P3 S"cold start soak complete"
