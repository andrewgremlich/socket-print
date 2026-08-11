;start index cup
G1 Z30
G92 X0 Y0
G1 H3 X-400 F1200
G1 H3 Y-300 F1200

if !exists(global.xIndex)
	global xIndex = move.axes[0].userPosition
else
	set global.xIndex = move.axes[0].userPosition

if !exists(global.yIndex)
	global yIndex = move.axes[1].userPosition
else
	set global.yIndex = move.axes[1].userPosition

echo >"0:/sys/provel/setCupIndex.g" "set global.xIndex = "^{global.xIndex}
echo >>"0:/sys/provel/setCupIndex.g" "set global.yIndex = "^{global.yIndex}
echo >>"0:/sys/provel/setCupIndex.g" "M208 X"^{global.xIndex}^":185 Y"^{global.yIndex}^":300"
M118 P3 S{"xIndex set to: "^global.xIndex^" yIndex set to: "^global.yIndex}

;variable for flagging if index cup is running
M400
if !exists(global.indexing)
  global indexing = 0
else
  set global.indexing = 0

G28 ;home