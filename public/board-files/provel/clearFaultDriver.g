M118 P3 S{"Clear driver fault: "^{param.D}}
if {param.D} == 0
  set global.xDF =-1
if {param.D} == 1
  set global.yDF =-1
if {param.D} == 2
  set global.zDF =-1
if {param.D} == 3
  set global.eDF =-1 