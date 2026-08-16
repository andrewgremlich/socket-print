# PanelDue screen firmware

Drop the PanelDue firmware binary here, e.g.
`PanelDueFirmware-3.5.4-v3-7.0.bin`, and bump `version` in `package.json`.

Provel Print then uploads it to `0:/firmware/` on the SD card and flashes the
screen with `M997 S4 P"0:/firmware/<file>.bin"`. Until a `.bin` is present the
group is empty and the Settings dialog hides the screen firmware row.

Use a PanelDue firmware version matching the mainboard's RepRapFirmware version.
Markdown files in this directory are excluded from the manifest and never
uploaded to the board.

Docs: https://docs.duet3d.com/User_manual/RepRapFirmware/Updating_PanelDue
