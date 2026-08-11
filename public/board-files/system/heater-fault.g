
M118 P3 S{"heater fault from heater: "^{param.B}^"."^{param.D}^" : "^{param.P}^" ,"^{param.S}}
if {param.D} == 0
  set global.bHF = {param.P}
if {param.D} == 1
  set global.eHF = {param.P}
if {param.D} == 2
  set global.cHF = {param.P}
  
;pause then cancel a print if one is ongoing

M108
if state.status == "processing"
  M25
  M400
  M0
M400
abort