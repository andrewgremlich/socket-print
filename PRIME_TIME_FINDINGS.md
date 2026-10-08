# Reducing prime time

The prime duration is controlled by a printer macro called from the generated G-code.

## Where priming is configured

- `src/3d/generateGCode.ts` calls `M98 P"0:/sys/provel/prime.g"` to prime the extruder before printing.
- `public/board-files/provel/prime.g` copies `global.primeTime` into `global.remainingPrimeTime`, then repeatedly extrudes until the countdown reaches zero.
- `public/board-files/system/config.g` currently initializes `global.primeTime` to `8`. Its comment says the value was reduced from `16` to `8` on March 10, 2026.
- The same configuration initializes `global.primeFeed` to `2350`, with a comment identifying this as 75 screw RPM.

Duet documents `M98` as a macro call: [M98 documentation](https://docs.duet3d.com/User_manual/Reference/Gcodes/M98).

## How to halve the current priming phase

Change the initialization in `public/board-files/system/config.g` from:

```gcode
global primeTime = 8
```

to:

```gcode
global primeTime = 4
```

Keep `global.primeFeed` unchanged. This roughly halves the number of priming extrusion moves and the amount extruded, rather than increasing the screw speed.

## The countdown is not an actual timer

The active priming loop in `prime.g` performs:

```gcode
G1 E3.8 F{global.primeFeed}
set global.remainingPrimeTime = global.remainingPrimeTime - 0.08
```

Each iteration subtracts a fixed value, rather than measuring elapsed time. Therefore, a `primeTime` setting of `8` does not guarantee eight seconds of actual priming. Actual duration depends on feedrate, acceleration, printer limits, and command processing. Halving the setting roughly halves the extrusion move count.

See [Duet G1 motion documentation](https://docs.duet3d.com/User_manual/Reference/Gcodes/G1) for extrusion and feedrate behavior.

## Recommended next steps

1. Check the client's installed `0:/sys/config.g` and the current runtime value of `global.primeTime`.
2. If the installed value is still `16`, the repository already contains the requested reduction to `8`.
3. If the current value is `8`, reduce it to `4` to halve the current active priming phase.
4. Install the updated configuration on the printer and ensure the runtime value takes effect. The initialization is guarded by `if !exists(global.primeTime)`, so rereading the configuration while that global already exists will not overwrite its value. A board restart initializes the global from the updated configuration.
5. Run a trial print to confirm the shorter prime still establishes enough flow for the start of the print.

This adjustment reduces active priming. It does not halve the entire startup sequence: heating waits, cup heater removal, positioning, and the extrusion moves after the macro remain separate.

Research inspected the repository's bundled files, not the client's installed printer configuration. No implementation changes were made as part of the research.
