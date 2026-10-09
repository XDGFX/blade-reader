---
date: 2026-10-09
issue: 5
map: 1
---

# Can pinned tscircuit do the whole rev A flow?

Answers XDGFX/blade-reader#5. Checked against tscircuit's docs and source, and by building a
throwaway comb-shaped strip in a scratch directory (not committed). Builds on the earlier trial
in XDGFX/hailey#190, which covered parts import, pours and the fab zip on a plain rectangle.

**Versions tested:** `tscircuit` 0.0.2786, which pulls `@tscircuit/core` 0.0.2116,
`@tscircuit/props` 0.0.697 and `@tscircuit/cli` 0.1.2273 (global) or 0.1.2274 (project). Bun
1.4.2, macOS arm64. tscircuit releases several times a day: 0.0.2786 and 0.0.2788 were both
published on 2026-10-09.[^npm]

## Answer

Yes, with five workarounds. Every step runs from the CLI and none needs another EDA tool.

| Step | Works? | Workaround or note |
|---|---|---|
| Comb outline with routed slots | Yes | `<board outline={[...]}>` takes any polygon. Slots open to the edge and fingertip screw slots are just outline points. Internal slots use `<cutout>` |
| Polygon pours, both layers | Yes, with care | **Pours are not clipped by notches in the board outline.** Draw each pour's own outline clear of every slot. A pour that touches no pad of its net is dropped without a warning |
| Via stitching | Yes | `enableViaStitching viaStitchPitch="2.5mm"` on `<board>` |
| Antenna keepout | Yes | `<keepout>` defaults to **top layer only**. Pass `layers={["top","bottom"]}`. Rect and circle shapes only |
| LCSC parts by C-number | Yes | `tsci import --jlcpcb C…` writes a component with pin labels, MPN, footprint and the C-number |
| M4 SMT nut C2916378 | Import fails DRC | The EasyEDA footprint has a 6.3 mm plated hole with a 0.05 mm ring plus a separate SMD pad, both `pin1`. Hand-write a `<footprint>` from the datasheet |
| CC6905S8 C41421490 | Yes | Imports as a `soic8` footprinter string. Its pick-and-place rotation cannot be verified (see below) |
| DRC | Yes, generic rules | `tsci build` runs it and exits 1 on errors. `tsci export` does **not** gate on DRC. The rules are generic, not JLC's: JLC's DFM check stays the acceptance test |
| Gerbers, BOM, CPL | Yes | `tsci export -f gerbers` gives one zip with Gerbers, drill, `bom.csv` and `pick_and_place.csv` in JLC's column names |
| 3D for Fusion | Board only | `tsci export -f step` gives the board solid with its outline, slots and holes, but **drops the EasyEDA part models**. Import those STEPs into Fusion separately |

**Pin it in the project, not globally.** Put `"tscircuit": "0.0.2786"` (exact, no caret) in
the board's `package.json`, commit `bun.lock`, and run the CLI as `bunx tsci …` or through
`bun run` scripts. Details under [Pinning](#pinning).

## Board outline and slots

`BoardProps.outline` is an array of points defining the board edge.[^board] The trial strip
was 80.16 mm long (6 × 13.36 mm), with six 8 mm fingers, open slots between them, and a
4.5 × 6 mm open screw slot in each fingertip, all in one outline polygon. The `Edge_Cuts`
Gerber carried every point. Internal corners are sharp in the file; JLC's router leaves its
own tool radius there.

`<cutout shape="rect" | "circle" | "polygon">` removes material inside the board.[^cutout] A
1 × 6 mm rect cutout came out as a closed path in `Edge_Cuts`, and the STEP solid had it too.

## Pours, stitching and exposed copper

`<copperpour layer connectsTo outline clearance boardEdgeMargin coveredWithSolderMask …>`
takes an arbitrary polygon per layer.[^pour] As in hailey#190, `connectsTo` must be a named net.

Two traps found on the comb:

- **Notches are ignored.** A pour drawn across a fingertip screw slot filled the slot, and the
  stitcher dropped vias into it. Build DRC caught it ("Copper pour … violates
  copper-to-board-edge clearance (measured 0.000mm)"), and `boardEdgeMargin` did not fix it.
  Giving the pour its own U-shaped outline round the slot cleared every error.
- **Unconnected pours vanish.** A pour that overlapped no pad of its net was left out of the
  output with no message. Count `pcb_copper_pour` entries in `dist/*/circuit.json`, or look at
  `pcb-png`, after every change.

`coveredWithSolderMask={false}` opens the mask over a pour: `F_Mask.gbr` gained matching
regions. That is the way to leave the finger's contact face bare.

`enableViaStitching` with `viaStitchPitch="2.5mm"` placed a grid of stitching vias (12 on the
first trial layout) across the paired top and bottom pours.[^board]

## Keepout

`<keepout shape="rect" | "circle">`.[^keepout-props] With no `layers`, tscircuit emits the
keepout on the **top layer only**.[^keepout-docs] In the trial, a bottom GND pour filled
straight under a top-only keepout; with `layers={["top","bottom"]}` it was cut back round it.
Pours avoid keepouts even when `allowTraces` or `allowPlacements` are set. Use
`excludeRefs={[".U2"]}` when the keepout overlaps the module's own courtyard, as an
ESP32-C3-MINI-1's antenna area does.[^keepout-docs]

## Parts and footprints

`tsci import --jlcpcb <C-number>` writes `imports/<MPN>.tsx`.[^import]

- **ESP32-C3-MINI-1 (C2838502):** exact EasyEDA footprint, all 53 pins labelled.
- **CC6905S8-3FB030 (C41421490):** matched to
  `soic8_pillpads_w7mm_pw0.59mm_pl1.8mm_pin1location(leftside,bottom)`, 99.69 % copper IoU.
  Pins 1 to 4 (IP+ 1–2, IP− 3–4) sit along one edge. Labels come from EasyEDA; check them against
  the datasheet.
- **SMTSO4040CTJ M4 SMT nut (C2916378):** imports with the EasyEDA footprint, but it fails
  DRC. It holds a plated hole of 6.3 mm drill and 6.4 mm pad, plus a 9.3 mm round SMD pad, both
  on `pin1`. Build reports "N1.pin1 is ambiguous" and "Pads … are too close (clearance: 0mm)".

For a part with no usable footprint, write it inline: a `<chip>` with
`footprint={<footprint>…</footprint>}` built from `<smtpad>`, `<platedhole>`, `<hole>` and
`<courtyardoutline>`, plus `supplierPartNumbers={{ jlcpcb: ["C2916378"] }}` so it lands in the
BOM.[^footprint] The trial nut used a single `<platedhole holeDiameter="6.3mm"
outerDiameter="9mm">` and passed DRC. The real hole and pad sizes must come from the nut's
datasheet. Copy the `cadModel` block from the import to keep its 3D model. `tsci convert` also
turns a `.kicad_mod` into TSX.

## DRC

`tsci build <file>` runs netlist, placement and routing checks and exits 1 on any error. It
caught, on this board: copper to board edge (0.2 mm minimum), pad to pad and via to pad (0.1 mm
minimum), components outside the outline, courtyards in a keepout, and traces over holes.
`tsci check shorts` renders the Gerbers and looks for copper bridges; it passed.

Two limits:

- **`tsci export` does not run the DRC gate.** With the fingertip pour error above, `build` exited
  1 and `export -f gerbers` exited 0. Always `build` first.
- **No JLC rule deck.** `<board fabricatorPreset="jlcpcb_standard">` is accepted, but core only
  runs fabricator checks when the platform supplies a `fabricatorEngine`, and the 0.1.2274 CLI
  supplies none.[^core] The preset does nothing from the CLI today. Set JLC-friendly minimums
  by hand (`nominalTraceWidth="0.25mm" minViaHoleDiameter="0.3mm" minViaPadDiameter="0.6mm"`,
  from hailey#190) and treat JLC's own DFM check as the acceptance test.

## Fab files

`tsci export <file> -f gerbers -o fab.zip` produced, as in hailey#190: `F_/B_Cu`, `F_/B_Mask`,
`F_/B_Paste`, `F_/B_SilkScreen`, `Edge_Cuts`, `F_Fab`, `drill-L1-L2.drl`, `bom.csv` and
`pick_and_place.csv`.[^export] [^fab]

```
Designator,Comment,Value,Footprint,JLCPCB Part #
N1,"",C2916378,C2916378,C2916378
C1,100n,100n,cap0603,C14663

Designator,Mid X,Mid Y,Layer,Rotation
N1,-6.680,-8.000,top,0
```

Hand-written parts with `supplierPartNumbers` appear in the BOM like imported ones. `Comment`
is blank for imported chips; JLC matches on the part-number column.

**Rotation.** The export warns where it cannot check the pick-and-place rotation:
`missing_pin1_location` for the ESP32 and both nuts, and `incompatible_pin1_locations` for the
CC6905. hailey#190 found the CC6905 verified; the footprinter string it now picks differs.
`docs/design.md` already says to check every rotation in JLC's preview, and that still holds.

## 3D for the Fusion fit check

| Format | Result |
|---|---|
| `step` | Board solid with outline, finger slots, cutout and holes, plus generated boxes for footprinter parts (the 0603). **EasyEDA part STEPs failed to merge** ("Could not parse entity …"), so the ESP32, CC6905 and nut are missing |
| `glb` / `gltf` | Exported (714 kB against 79 kB for the STEP, so probably with part models; not inspected). Not tried in Fusion |
| `kicad_pcb` | Exported, with part STEP URLs as `(model …)` entries, outline and zones |
| `component-box-3mf` | Crashes: `manifold.wasm` is missing from the CLI package |

The STEP is enough for the mechanical question, which is whether the comb fits the panel.
For part heights, insert the STEPs from each import's `cadModel.stepUrl` (or LCSC) into
Fusion at the CPL coordinates. The fallback is the `kicad_pcb` route: open in KiCad, point the
models at local files, and use KiCad's STEP export. `kicad-cli` is not installed here, so that
route is untested. The STEP merge failure is in `circuit-json-to-step` v0.0.36 as bundled in the
CLI; npm has 0.0.43,[^npm] so a later tscircuit may fix it. Retest before moving the pin.

## Pinning

- `tsci init -y` writes `"tscircuit": "^0.0.2788"` (latest, with a caret). Edit it to the exact
  version.
- Pinning `tscircuit` alone is not enough. It depends on `@tscircuit/cli` at `^0.1.2273`, which
  floats: the same `tscircuit` 0.0.2786 resolved to CLI 0.1.2273 globally and 0.1.2274 in the
  project. Other `^0.0.x` dependencies are effectively exact. **Commit `bun.lock`.**
- **The global `tsci` runs the global CLI**, even inside a project with its own `tscircuit`
  (the STEP export's stack traces showed `~/.bun/install/global/…`). Run `bunx tsci` or
  `bun run build` so the project's pinned copy is used. The global install is then only
  needed for `tsci init`.

Rev A workflow, from the board's directory:

```
bun install                                   # pinned tscircuit from bun.lock
bunx tsci import --jlcpcb C2838502            # once per part; review the TSX
bunx tsci build index.circuit.tsx             # DRC gate: must exit 0
bunx tsci check shorts index.circuit.tsx
bunx tsci export index.circuit.tsx -f pcb-png -o pcb.png       # look at it
bunx tsci export index.circuit.tsx -f gerbers -o fab/fab.zip   # Gerbers + BOM + CPL
bunx tsci export index.circuit.tsx -f step -o fab/board.step   # Fusion fit check
```

Then upload to JLC, take `bom.csv` and `pick_and_place.csv` out of the zip for the assembly
step, and check DFM and every rotation in JLC's preview. Pin the autorouter's output with
`<autoroutingphase pcbTracePaths={…}>` once routing is good: one Gerber export here took 75 s
re-routing against 4 s otherwise, and routes can change between runs.

[^npm]: npm registry, `tscircuit` and `circuit-json-to-step` version times,
    <https://registry.npmjs.org/tscircuit>, read 2026-10-09.
[^board]: `BoardProps` (`outline`, `enableViaStitching`, `viaStitchPitch`, `fabricatorPreset`),
    [tscircuit/props `lib/components/board.ts`](https://github.com/tscircuit/props/blob/main/lib/components/board.ts),
    as shipped in `@tscircuit/props` 0.0.697.
[^cutout]: [docs.tscircuit.com/elements/cutout](https://docs.tscircuit.com/elements/cutout).
[^pour]: `CopperPourProps`,
    [tscircuit/props `lib/components/copper-pour.ts`](https://github.com/tscircuit/props/blob/main/lib/components/copper-pour.ts);
    [docs.tscircuit.com/elements/copperpour](https://docs.tscircuit.com/elements/copperpour).
[^keepout-props]: `pcbKeepoutProps`,
    [tscircuit/props `lib/components/pcb-keepout.ts`](https://github.com/tscircuit/props/blob/main/lib/components/pcb-keepout.ts).
[^keepout-docs]: [docs.tscircuit.com/elements/keepout](https://docs.tscircuit.com/elements/keepout),
    "If `layers` is omitted, tscircuit emits the keepout on the top layer."
[^import]: [docs.tscircuit.com/command-line/tsci-import](https://docs.tscircuit.com/command-line/tsci-import);
    [Importing from JLCPCB](https://docs.tscircuit.com/guides/importing-modules-and-chips/importing-from-jlcpcb).
[^footprint]: [docs.tscircuit.com/elements/footprint](https://docs.tscircuit.com/elements/footprint);
    [docs.tscircuit.com/elements/chip](https://docs.tscircuit.com/elements/chip).
[^core]: `@tscircuit/core` 0.0.2116 `dist/index.js`, board DRC phase:
    `shouldRunFabricatorChecks = … && !!fabricatorEngine && !!fabricatorPreset`. The CLI bundle
    mentions `fabricatorEngine` only in that copy of core and in the platform schema.
[^export]: [docs.tscircuit.com/command-line/tsci-export](https://docs.tscircuit.com/command-line/tsci-export).
[^fab]: [Understanding fabrication files](https://github.com/tscircuit/docs/blob/main/docs/guides/understanding-fabrication-files.md),
    tscircuit/docs.
