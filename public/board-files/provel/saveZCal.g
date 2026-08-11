;saveZCal.g
if !exists(global.zCalOffset)
  global zCalOffset = move.axes[2].userPosition
else
  M118 P3 S{"initial zCalOffset: "^global.zCalOffset^", userPosition: "^move.axes[2].userPosition^", new offset: "^global.zCalOffset+move.axes[2].userPosition}
  set global.zCalOffset = global.zCalOffset+move.axes[2].userPosition
echo >"0:/sys/provel/setZCalOffset.g" "set global.zCalOffset = "^{global.zCalOffset}
M208 Z{0.0, move.axes[2].max-move.axes[2].userPosition}
M118 P3 S{"zCalOffset set to: "^global.zCalOffset}
G28