;turn off cup
M140 P1 S0
;turn off part cooling
M106 S0
;Move to the purge area done in purge now
;G1 X-180 F6000

;turn off global pellet feed
set global.pelletFeedOn = false
; run purge.g

;if job.lastFileName != "0:/sys/provel/purge.g"
  ;if heat.heaters[1].current > heat.coldExtrudeTemperature
    ;M98 P"0:/sys/provel/purge.g"
    ;M400
  ;M568 P0 S0
  ;set global.nonPrintJob = false

M568 P0 S0
set global.nonPrintJob = false