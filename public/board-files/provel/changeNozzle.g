;changeNozzle.g
;State16: this file moves the print head to a nozzle change position with the nozzle hot.

; use nonPrintJob to ensure if the macro is stopped before completing, stop.g does not run the end of print logic
if !exists(global.nonPrintJob)
  global nonPrintJob  = true
else
  set global.nonPrintJob  = true

; check if e-stop pressed
if sensors.gpIn[2].value == 0
  M118 P3 S"estop pressed - cancelling nozzle change"
  M0
; check if door closed
;if sensors.gpIn[1].value == 0
;   M118 P3 S"door open - cancelling nozzle change"
;  M0
  
if !exists(global.manualPurgeTemp)
  M118 P3 S"global.manualPurgeTemp not set in config.g"
  global manualPurgeTemp  = 190

if !exists(global.stopHeat)
  global stopHeat  = false
else
  set global.stopHeat = false
; set the temperature for changing the nozzle to the purging temperature
M568 P0 S{global.manualPurgeTemp}
; move to same position as access
G1 X50 Y-70 Z200 F3000

if global.stopHeat
  M118 P3 S"stop button pressed"
  M568 P0 S0
  M0

;wait for temperature to be reached.
while {!global.stopHeat && heat.heaters[1].current < global.manualPurgeTemp-5}
  M118 P3 S{"waiting for temperature, set temp: "^heat.heaters[1].active^", current temp: "^heat.heaters[1].current}
  G4 S0.5 ; wait 500ms
  M400

if global.stopHeat
  M118 P3 S"stop button pressed"
  M568 P0 S0
  M0

; set the temperature off - Commented out because this makes no sense - we need another macro to be run once the nozzle change is finished.
;M568 P0 S0
M118 P3 S{"Nozzle Change at temperature"}