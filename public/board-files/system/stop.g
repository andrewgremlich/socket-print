; stop.g
; called when M0 (Stop) is run 
;

if !global.nonPrintJob
  M118 P3 S"stopping a print job"
  ;turn off global pellet feed
  set global.pelletFeedOn = false
  ;raise
  if move.axes[2].machinePosition <490
    G91
    G1 Z5 F3000
    G90    
  ;Move to the purge area
  G1 X-180 F6000
  ; run purge.g
  ;M98 P"0:/sys/provel/purge.g"
  set global.nonPrintJob  = false
else
   M118 P3 S"stopping a Nonprint job"
   set global.nonPrintJob  = false