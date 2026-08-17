;prime.g
;this macro file runs the screw with the pellet feed on to prime it before printing
;reset etrusion factor
M221 S100
; check if e-stop pressed
if sensors.gpIn[2].value == 0
  M118 P3 S"estop pressed - cancelling prime"
  M99
; check if door closed
;if sensors.gpIn[1].value == 0
;  echo "door open - cancelling prime"
;  M99

if !exists(global.primeTime)
  M118 P3 S"Prime Time not set in config.g"
  abort
if !exists(global.primeFeed)
  M118 P3 S"Prime feedrate not set in config.g"
  abort

;set the prime stop override to false
set global.primeStop=false

; set the time left for priming
set global.remainingPrimeTime = global.primeTime
M118 P3 S{"priming for: "^global.remainingPrimeTime}

; set the purging temperature
;M568 P0 S{global.manualPurgeTemp} ; set by the print file before primimg

;wait for temperature to be reached.
while {!global.primeStop && heat.heaters[1].current < heat.heaters[1].active-20}
  ;M118 P3 S{"waiting for temperature, set temp: "^heat.heaters[1].active^", current temp: "^heat.heaters[1].current}
  G4 S0.5 ; wait 500ms
  M400

if global.primeStop
  M118 P3 S"stop button pressed"
  M568 P0 S0
  M99

;echo global.remainingPrimeTime

while {global.remainingPrimeTime > 0 && global.primeStop == false}
  ;G1 E7.6 F{global.primeFeed}
  G1 E3.8 F{global.primeFeed}
  set global.remainingPrimeTime = global.remainingPrimeTime - 0.08  ;
  M118 P2 S{"{""key"": ""oem"",""flags"": """",""result"": {""remainingPrimeTime"":" ^ global.remainingPrimeTime ^"}}"}

echo "priming complete"


if global.primeStop
  M118 P3 S"stop button pressed"
  M568 P0 S0
  M99