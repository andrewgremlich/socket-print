;waitForTemp.g
if !exists(global.stopHeat)
  global stopHeat  = false
else
  set global.stopHeat = false

var heater= {param.P}
var temp = {param.S}

while {!global.stopHeat && heat.heaters[var.heater].current < var.temp-5}
  echo "waiting for temperature, heater: "^var.heater^", temp: "^var.temp^", global.stopHeat: "^global.stopHeat
  G4 S0.5 ; wait 500ms
  M400

if global.stopHeat
  echo "macro ended due to stop button"
  set global.stopHeat = false
else
  echo "macro finished without stop button being pressed"
