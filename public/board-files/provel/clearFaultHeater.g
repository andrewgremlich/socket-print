M118 P3 S{"Clear heater fault: "^{param.D}}
if {param.D} == 0
  set global.bHF = -1
  M562 P{param.D}
if {param.D} == 1
  set global.eHF = -1
  M562 P{param.D}
if {param.D} == 2
  set global.cHF = -1
  M562 P{param.D}
if {param.D} == 3
  set global.encHF = -1
  M562 P{param.D}
