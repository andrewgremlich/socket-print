;run before allowing the user to manually move the nozzle to the index position
G28 ;Home
G1 Z19 F3000 ; move to the Z index height
;variable for flagging if index cup is running
if !exists(global.indexing)
  global indexing = 1
else
  set global.indexing = 1
M18 X Y ; turn of XY motors