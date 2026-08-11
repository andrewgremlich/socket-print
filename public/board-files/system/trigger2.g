;trigger2.g - used to set the global variable to indicate that the estop is pressed
; debounce by checking the estop is still pressed
if sensors.gpIn[2].value == 0
  set global.estopped = 1
M118 P3 S{"Trigger2-estop: global set to: "^global.estopped}
