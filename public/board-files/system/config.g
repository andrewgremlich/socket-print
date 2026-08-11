; Configuration file for Duet 3 MB 6XD (firmware version 3.6)
; executed by the firmware on start-up
;
; ------------------------------
; PROVEL PRINTER CONFIG FILE
; VERSION: 0.5
; DATE:2025-Feb-12
;-------------------------------
;

; General preferences
M575 P1 S1 B57600                                 ; enable support for PanelDue
G90                                               ; send absolute coordinates...
M83                                               ; ...but relative extruder moves
M550 P"ProvelPrinter1"                            ; set printer name
M586 C"*"         ;enable CORS

; Network
M552 P192.168.10.14 S1                            ; enable network and set IP address
;M553 P255.255.255.0                               ; set netmask
;M554 P192.168.10.254                               ; set gateway
M586 P0 S1                                        ; enable HTTP
M586 P1 S0                                        ; disable FTP
M586 P2 S0                                        ; disable Telnet

;pre declare speed override variable
if !exists(global.extruderFeed)
  global extruderFeed = 8200                     

; Drives
M569 P0.0 S0                                     ; physical drive 0.0 goes forwards
M569 P0.1 S0                                     ; physical drive 0.1 goes forwards
M569 P0.2 S1                                     ; physical drive 0.2 goes forwards
M569 P0.3 S0                                     ; physical drive 0.3 goes forwards
M569 P0.0 T1:1:1:1                               ;test - step pulse timing of 1uS
M569 P0.1 T1:1:1:1
M584 X0.0 Y0.1 Z0.2 E0.3                         ; set drive mapping
;M92 X14.80 Y22.2 Z210.50 E22.4                   ; set steps per mm  (if E1600 a movement of 1"mm" = 1 screw revolution)
;M92 X14.80 Y22.2 Z210.50 E51.00                  ; set steps per mm old extruder befoe gearing changes
M92 X14.80 Y22.2 Z210.50 E99.00                  ; set steps per mm  update to 51* new gear ratio

M566 X900.00 Y900.00 Z60.00 E1000.00               ; set maximum instantaneous speed changes (mm/min) extuder jer increased to allow for smooth movement with the algorithim expanded files
M203 X6000.00 Y6000.00 Z1800.00 E{global.extruderFeed} I0.001          ; set maximum speeds (mm/min) minimum feedrate
M201 X500.00 Y500.00 Z20.00 E250.00               ; set accelerations (mm/s^2)

; Axis Limits
M208 X-200:185 Y-170:250 Z0:506.6

; Endstops
M574 X1 S1 P"io3.in"                              ; configure switch-type (e.g. microswitch) endstop for low end on X via pin io3.in
M574 Y1 S1 P"io4.in"                              ; configure switch-type (e.g. microswitch) endstop for low end on Y via pin io4.in
M574 Z2 S1 P"io5.in"                              ; configure switch-type (e.g. microswitch) endstop for High end on Z via pin io5.in

; Z-Probe
M558 P0 H5 F120 T6000                             ; disable Z probe but set dive height, probe speed and travel speed
M557 X20:480 Y20:480 S40                          ; define mesh grid

; Heaters and temperature sensors
M308 S0 P"temp0" Y"thermistor" A"BedTemp" T100000 B4138              ; configure sensor 0 as thermistor on pin temp0
M950 H0 C"out2" T0                                                   ; create bed heater output on out7 and map it to sensor 0
M307 H0 R0.632 K0.373:0.000 D3.55 E1.35 S1.00 B0                     ; disable bang-bang mode for the bed heater and set PWM limit
M140 P0 H0                                                           ; map heated bed to heater 0
M143 H0 S120                                                         ; set temperature limit for heater 0 to 120C
M308 S1 P"temp1" Y"pt1000" A"NozzleTemp"                             ; configure sensor 1 as PT1000 on pin temp1
M950 H1 C"out0" T1                                                   ; create nozzle heater output on out0 and map it to sensor 1
;M307 H1 R0.836 K0.060:0.000 D43.70 E1.35 S1.00 B0 V24.1              ; old tuning for old heater barrel
;M307 H1 R1.278 K0.106:0.154 D19.00 E1.35 S1.00 B0 V24.0   
;M307 H1 R0.735 K0.046:0.000 D58.84 E1.35 S1.00 B0 V23.9              ; new barrel heater 10.04.25 
M307 H1 R0.635 K0.050:0.000 D68.50 E1.35 S1.00 B0 V24.2               ;2.19.26
M143 H1 S350                                                         ; set temperature limit for heater 1 to 350C
M570 H1 T30 P30; for development only

M308 S2 P"temp2" Y"thermistor" A"CupTemp" T100000 B4138              ; configure sensor 2 as thermistor on pin temp2
M950 H2 C"out1" T2                                                   ; create nozzle heater output on out1 and map it to sensor 2
;M307 H2 R0.796 K0.247:0.000 D12.13 E1.35 S1.00 B0                      ; disable bang-bang mode for heater  and set PWM limit
;M307 H2 R3.183 K1.538:0.000 D1.02 E1.35 S1.00 B0                    ;old tuning for old cup heater 6.18.25

;M307 H2 R1.095 K0.484:0.000 D5.98 E1.35 S1.00 B0                    ;new cup heater tuning 6.19.25 #1
;M307 H2 R1.199 K0.559:0.000 D6.43 E1.35 S1.00 B0                    ;new cup heater tuning 6.19.25 #2 extra silicon insulation
;M307 H2 R1.527 K0.635:0.000 D5.67 E1.35 S1.00 B0                    ;new cup heater tuning 6.19.25 #3 fiber insulation
;M307 H2 R1.520 K0.660:0.000 D6.01 E1.35 S1.00 B0                    ;new cup heater tuning 7.16.25 #4 sand dollar top
;M307 H2 R1.927 K0.644:0.000 D3.50 E1.35 S1.00 B0                    ;new cup heater tuning 7.23.25 #5 new heater
;M307 H2 R1.948 K0.613:0.000 D3.66 E1.35 S1.00 B0                    ;new cup heater tuning 7.25.25 #6 target 170C 
M307 H2 R1.940 K0.656:0.000 D3.53 E1.35 S1.00 B0                     ;new cup heater tuning 7.31.25 #7 target 160C

M140 P1 H2                                                           ; map cup heater as second heated bed to heater2
M143 H2 S210                                                         ; set temperature limit for heater 2 to 210C
M308 S3 P"temp3" Y"thermistor" A"EnclosureTemp" T100000 B4138        ; configure sensor 3 as thermistor on pin temp3

M950 H3 T3 C"io2.out"                     ; create a dummy heater on io2.out to allow enclosure temperature faults to be raised
M141 P0 H3                                ; configure the dummy heater as a chamber heater
M143 H3 P0 T3 A0 C0 S50                   ; configure a heater fault to be raised if the enclosure temperature goes above 50C, use heater-fault.g to handle it

M302 P0 S180 R180                         ; set temp at which cold extrude is allowed  

; Fans
M950 F0 C"!out3" Q500                              ; create fan 0 on pin out4 and set its frequency
M106 P0 C"Exhaust" S0 H-1                         ; set fan 0 name and value. Thermostatic control is turned off
M950 F1 C"!out4" Q500                              ; create fan 1 on pin out5 and set its frequency
M106 P1 C"PelletFeed" S0 H-1                            ; set fan 1 name and value. Thermostatic control is turned off
M950 F2 C"!out5" Q500                              ; create fan 2 on pin out6 and set its frequency
M106 P2 C"PartCooling" S0 H-1                            ; set fan 2 name and value. Thermostatic control is turned off
M950 F3 C"out6" Q500                              ; create fan 3 on pin out7 and set its frequency
M106 P3 C"Extruderservo" S1 H1 T100                         ; set fan 3 name and value. Thermostatic control is turned off
M950 F4 C"out7" Q500                              ; create fan 3 on pin out7 and set its frequency
M106 P4 C"PelletPump" S0 H-1                          ; set fan 3 name and value. Thermostatic control is turned off

; Tools
M563 P0 D0 H1 F2                                  ; define tool 0
G10 P0 X0 Y0 Z0                                   ; set tool 0 axis offsets
G10 P0 R0 S0                                      ; set initial tool 0 active and standby temperatures to 0C

;Other control and IO

M950 J1 C"io7.in"                                      ; io7.in as a input switch for the door latch
;M308 S10 P"io7.in" Y"linear-analog" A"pellet-feed"
M950 J2 C"io8.in"                                      ; io8.in as a input switch for the Emergency stop
M308 S10 P"io6.in" Y"linear-analog" A"pellet-feed"
M581 T2 P2 S0 R0                                       ; create trigger2 for monitoring the estop switch

; Miscellaneous
;M501                                              ; load saved parameters from non-volatile memory ; commented out 8.14.25 by KF
;M911 S21 R19 P"M913 X0 Y0 G91 M83 G1 Z3 E-5 F1000 ;CHANGE THIS" ; set voltage thresholds and actions to run on power loss
T0                                                ; select first tool
M17 XYZ
M17 E0
;set firmware retraction length to 0.
M207 P0 S0
;segmentation
;M669 T0.1 ; set segmentation lenght to 0.1

;----------------
;--Setup global variables for UI & Printer Management
;----------------

;set to true to run the automated daemon process for pellet feed management and fault/warning handling
if !exists(global.runDaemon)
  global runDaemon = true


;manage cancelling out of heating
if !exists(global.stopHeat)
  global stopHeat  = false


;manage jobs that need to run as print jobs but are actually macros
if !exists(global.nonPrintJob)
  global nonPrintJob  = false
else
  set global.nonPrintJob  = false

;variables to manage manual purging
if !exists(global.manualPurgeTime)
  global manualPurgeTime = 70
if !exists(global.purgeFeed)
  global purgeFeed = 3500 ; changed from 4000 to 3500 by KF 8.11.25 
if !exists(global.primeFeed)
  global primeFeed = 2350   ; 75 Screw RPM 10.25.25 KF

;Heater feed forward(M309) variable
M309 P0 S0.005 ; set feed forward
if !exists(global.heaterFFvalue)
  global heaterFFvalue = 0.01
else
  set global.heaterFFvalue = 0.01


if !exists(global.purgeStop)
  global purgeStop = false
if !exists(global.remainingPurgeTime)
  global remainingPurgeTime = global.manualPurgeTime
else
  set global.remainingPurgeTime = global.manualPurgeTime
if !exists(global.manualPurgeTemp)
  global manualPurgeTemp = 200
else
  set global.manualPurgeTemp = 200
M98 P"0:/sys/provel/setManualPurgeTemp.g"

if !exists(global.primeTime)
  global primeTime = 8 ;was 16, changed 3.10.26 KF
  
if !exists(global.primeStop)
  global primeStop = false
  
if !exists(global.remainingPrimeTime)
  global remainingPrimeTime = 0

;analog sensor purge feed threshold
if !exists(global.feedThreshold)
  global feedThreshold = 40
else
  set global.feedThreshold = 40
  
;pellet feed delay in seconds
if !exists(global.pelletFeedDelay)
  global pelletFeedDelay = 3
else
  set global.pelletFeedDelay = 3

;global pellet feed on/off
if !exists(global.pelletFeedOn)
  global pelletFeedOn = false
else
  set global.pelletFeedOn = false

;pellet feed delay in S
if !exists(global.pelletFeedTime)
  global pelletFeedTime = 2.2
else
  set global.pelletFeedTime = 2.2
 
;variables for Z calibration
if !exists(global.zCalPosition)
  global zCalPosition = 10
else
  set global.zCalPosition = 10

;variables for Z calibration offset
if !exists(global.zCalOffset)
  global zCalOffset = 0
else
  set global.zCalOffset = 0
M98 P"0:/sys/provel/setZCalOffset.g"
M208 Z{0.0, move.axes[2].max-global.zCalOffset}

if !exists(global.xIndex)
  global xIndex = -202
if !exists(global.yIndex)
  global yIndex = -169
M98 P"0:/sys/provel/setCupIndex.g" 

;variables for preliminary travel speeds before a print starts
if !exists(global.prelimTravelSpeed)
  global prelimTravelSpeed = 1800
else
  set global.prelimTravelSpeed = 1800

;variable for flagging if index cup is running
if !exists(global.indexing)
  global indexing = 0
else
  set global.indexing = 0

;variable for flagging if estop has been pressed and released
if !exists(global.estopped)
  global estopped = 0
else
  set global.estopped = 0
if sensors.gpIn[2].value == 0
  set global.estopped = 1

;variables for handling faults
if !exists(global.eHF)
  global eHF = -1
else
  set global.eHF = -1
if !exists(global.cHF)
  global cHF = -1
else
  set global.cHF = -1
if !exists(global.bHF)
  global bHF = -1
else
  set global.bHF = -1
if !exists(global.encHF)
  global encHF = -1
else
  set global.encHF = -1
if !exists(global.xDF)
  global xDF = -1
else
  set global.xDF = -1
if !exists(global.yDF)
  global yDF = -1
else
  set global.yDF = -1
if !exists(global.zDF)
  global zDF = -1
else
  set global.zDF = -1
if !exists(global.eDF)
  global eDF = -1
else
  set global.eDF = -1

;Homing on startup (check if emergency stop is pushed down, if it is then don't call it.)
if sensors.gpIn[2].value == 1     
  G28 