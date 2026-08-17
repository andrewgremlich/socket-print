;purge.g
;this macro file runs the screw for long enough to clear the barrel of pellets and molten plastic as far as possible,
;the pellet feed should not run during this macro,
;reset etrusion factor
M221 S100
; use nonPrintJob to ensure if the macro is stopped before completing, stop.g does not run the end of print logic
if !exists(global.nonPrintJob)
  global nonPrintJob  = true
else
  set global.nonPrintJob  = true

;reset nozzle heater fault so purge can continue
M562 P1
M400
M568 A2

;heater feed forward
M309 P0 S0

; check if e-stop pressed
if sensors.gpIn[2].value == 0
  M118 P3 S"estop pressed - cancelling purge"
  M0
; check if door closed
;if sensors.gpIn[1].value == 0
;  echo "door open - cancelling purge"
;  M0

if !exists(global.manualPurgeTime)
  M118 P3 S"manual Purge Time not set in config.g"
if !exists(global.purgeFeed)
  M118 P3 S"purge feedrate not set in config.g"

;set the purge stop override to false
set global.purgeStop=false

set global.pelletFeedOn=false

; set the time left for purging
set global.remainingPurgeTime = global.manualPurgeTime
M118 P3 S{"purging for: "^global.remainingPurgeTime}

; set the purging temperature
M568 P0 S{global.manualPurgeTemp}

;wait for temperature to be reached.
while {!global.purgeStop && heat.heaters[1].current < global.manualPurgeTemp-20}
  ;M118 P3 S{"waiting for temperature, set temp: "^heat.heaters[1].active^", current temp: "^heat.heaters[1].current}
  G4 S0.5 ; wait 500ms
  M400
  

if global.purgeStop
  M118 P3 S"stop button pressed"
  M568 P0 S0
  set global.purgeStop=false
  M0

;set max purge speed to a different speed than extrusion maximums
M203 E{global.purgeFeed}
;Move to purge area while extruding
G1 X-180 E30 F6000   
;Check Z is suitable for purge while extruding
if move.axes[2].machinePosition <100
  G1 Z100 E12 F1800

while {sensors.analog[10].lastReading > global.feedThreshold} && iterations < 2000
  G1 E0.1 F{global.purgeFeed}

while {global.remainingPurgeTime > 0 && global.purgeStop == false}
  ;G1 E7.6 F{global.purgeFeed} 
  G1 E3.8 F{global.purgeFeed}
  set global.remainingPurgeTime = global.remainingPurgeTime - 0.055  ; at 80RPM half a rotation is 0.375 seconds
  M118 P2 S{"{""key"": ""oem"",""flags"": """",""result"": {""remainingPurgeTime"":" ^ global.remainingPurgeTime ^"}}"}
  ;echo "purging for: "^global.remainingPurgeTime

echo "purge complete"
M203 E{global.extruderFeed}

if global.purgeStop
  M118 P3 S"stop button pressed"
  set global.remainingPurgeTime = global.manualPurgeTime
  M568 P0 S0
  set global.purgeStop=false
  ; set the heater feed forward back
  if exists(global.heaterFFvalue)
     M309 P0 S{global.heaterFFvalue}
  M0

; set the temperature off
M568 P0 S0
set global.remainingPurgeTime = global.manualPurgeTime
set global.purgeStop=false

; set the heater feed forward back
if exists(global.heaterFFvalue)
  M309 P0 S{global.heaterFFvalue}
