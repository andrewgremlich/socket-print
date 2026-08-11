M118 P3 S"moving to Z Calibrate Position"
;G1 X-100 Y-148 Z{global.zCalPosition} F3000
G1 X0 Y0 Z{global.zCalPosition} F3000           ;Zcal position changed 8.27.25 KF
M208 S1 Z-3