if !exists(global.runDaemon)
  global runDaemon = false
  
if !exists(global.feedThreshold)
  global feedThreshold = 40
  
;global pellet feed on/off
if !exists(global.pelletFeedOn)
  echo "global pellet feed not defined"
  abort

while global.runDaemon == true
  if state.status == "processing" && sensors.analog[10].lastReading < global.feedThreshold && global.pelletFeedOn == true
    ;M118 P3 S{"processing, feeding: "^sensors.analog[10].lastReading}
    ;M98 P"0:/sys/provel/pelletFeedOn.g"
    M106 P1 S1 ; Pellet Feed blower 100% for feeding
    M106 P4 S1 ; Pellet Feed pump on
    ;G4 S{global.pelletFeedTime}
    while sensors.analog[10].lastReading < global.feedThreshold
      G4 P300
      ;echo "feed still showing not full"
    ;M98 P"0:/sys/provel/pelletFeedIdle.g"
    M106 P1 S0.0 ; Pellet Feed blower off for idle
    M106 P4 S1.0 ; Pellet Feed pump on
    G4 S{global.pelletFeedDelay}
  elif state.status == "processing" && global.pelletFeedOn == true
    ;M118 P3 S{"processing, feed is enabled, hopper is full: "^sensors.analog[10].lastReading}
    ;M98 P"0:/sys/provel/pelletFeedIdle.g"
    M106 P1 S0.0 ; Pellet Feed blower off for idle
    M106 P4 S1.0 ; Pellet Feed pump on
    G4 P500
  else
    ;M118 P3 S{"not processing, not feeding: "^sensors.analog[10].lastReading}
    ;M98 P"0:/sys/provel/pelletFeedOff.g"
    M106 P1 S0 ; Pellet Feed blower off
    M106 P4 S0 ; Pellet Feed pump off
  G4 P500
  G4 P500