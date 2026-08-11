;variable for flagging if index cup is running
if !exists(global.indexing)
  global indexing = 0

if state.status !="starting" & global.indexing =0 & global.estopped =0
  M118 P3 S{"driver error from driver: "^{param.B}^"."^{param.D}^" : "^{param.P}^" ,"^{param.S}}
  if {param.D} == 0
    set global.xDF =1
  if {param.D} == 1
    set global.yDF =1
  if {param.D} == 2
    set global.zDF =1
  if {param.D} == 3
    set global.eDF =1 
  ;turn off all motors
  M18
  ;cancel wait for heating
  M108
  ;pause then cancel a print if one is ongoing. Note: this will not work properly because motors are un powered
  if state.status == "processing"
    set global.purgeStop=true
    M25
    M400
    M0
  M400
  ;turn off heaters
  M568 P0 S0
  M140 P1 S0
  set global.purgeStop=false
  abort

