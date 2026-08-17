; Kade Fischer, Provel E2.20, 8/22/25
; This is a test designed to measure the linearity of output at various Screw RPMs
; The Screw will rotate 10 revolutions at 30, 45, 60, 75, and 90 RPM
; Each sample can be snipped off and weighed

; START GCODE SEQUENCE
G21  ; Set units to millimeters
G90  ; Use absolute positioning
M83  ; use relative distances for extrusion

; SET TEMPERATURES AND POSITION
M568 P0 S200	        ; set temperature for barrel to 200;
G1 X50 Y-70 Z250 F3000  ; move to convenient position
M116 		        ; wait for temperatures to be reached +/-2C

; ENABLE PELLET FEED AND PRIME
set global.pelletFeedOn = true  ; enable pellet feed
M98 P"0:/sys/provel/prime.g"    ; prime extruder
G4 S8				; pause for 8 seconds to snip prime

; ROTATE SCREW 10 REVOLUTIONS AT SPECIFIED RPMS
;G1 E313 F940	; 30 RPM, 10 Revolutions
;G4 S8		; Snip sample
G1 E313 F1410	; 45 RPM, 10 Revolutions
G4 S8		; Snip sample
G1 E313 F1880	; 60 RPM, 10 Revolutions
G4 S8		; Snip sample
G1 E313 F2350	; 75 RPM, 10 Revolutions
G4 S8		; Snip sample
G1 E313 F2820	; 90 RPM, 10 Revolutions
G4 S8		; Snip sample

; END GCODE SEQUENCE 
set global.pelletFeedOn = false	  ; turn off pellet feed

G1 X-180 E30 F6000  		; move extruder head out of way
M568 P0 S0          		; set the temperature off

M106 S0				  ; turn the blowers and fan off	
M140 S0 			  ; set bed temperature
M98 P"0:/sys/provel/end.g"