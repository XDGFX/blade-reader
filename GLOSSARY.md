# Blade Reader

A board that measures the current on every way of a blade fuse panel. These are the words for
the panel it fits and the parts of the board itself.

## The fuse panel

**Fuse panel**:
The blade fuse block a yoke fits, such as the Blue Sea ST Blade.
_Avoid_: Fuse box, fuse block

**Way**:
One numbered fuse position on the fuse panel, and the circuit it feeds.
_Avoid_: Channel, slot

**Feed**:
The cables that supply the fuse panel, bolted to its stud past the positive end.
_Avoid_: Main, supply cable

**Stray field**:
The magnetic field of the feed's current reaching a sensor, read as current on that way.

**Crosstalk**:
A sensor reading part of the current in the finger beside it on the chin side.
_Avoid_: Leakage, bleed

**Pocket**:
The space between two barriers of the fuse panel where a way's output screw sits on its pad.

**Live way**:
A way with supply voltage on the load side of its fuse.

**Dead way**:
A way with no voltage on the load side of its fuse: blown, pulled or never fitted.

**Blown fuse**:
A way that was live and has gone dead while other ways stayed live. A pulled fuse counts as
blown until its fault is cleared.

**Empty way**:
A dead way that is not a fault: dead since start-up, or when faults were last cleared.
_Avoid_: Unused way, spare

**Zero**:
A way's sensor reading at no current, taken while the way is dead and subtracted from every
reading after.
_Avoid_: Offset, calibration (for the zero alone)

**Install mode**:
The period after start-up, while any way has no zero, in which the yoke prompts for fuses to be
pulled or moved until every way has one.
_Avoid_: Calibration mode, setup mode

## The yoke

**Yoke**:
One 12-way Blade Reader board, fitted round the positive end of a 12-way fuse panel: two arms
joined by the chin.
_Avoid_: U board, frame, board (when the fitted unit is meant), module

**Arm**:
One side of a yoke, along one long side of the fuse panel, with six fingers.

**Chin**:
The part of a yoke that joins the two arms past the fuse panel's positive end, and carries the
ESP32, the supply and the ground nut.

**Finger**:
The part of a yoke that reaches into one way's pocket and is clamped under that way's screw.
One finger per way, six on each arm.
_Avoid_: Tab, tooth, prong

**Body**:
The yoke less its fingers: everything outside the fuse panel's edge, which carries the
electronics and the output nuts.

**Comb**:
One arm's outline: six fingers joined by the body.

**Sensor**:
One finger's current sensor, numbered S1–S12 after the way it reads.
_Avoid_: Channel

**Parts face**:
The face of a yoke that carries every assembled part. It faces down, towards the bulkhead.
_Avoid_: Top, bottom (tscircuit's "top" is the parts face)

**Ring face**:
The face of a yoke opposite the parts face. It is bare copper where ring terminals land, and
faces up.
_Avoid_: Top, bottom

**Ring keepout**:
The area of the ring face that a way's fitted ring and its tongue can cover, including as they
swing. Only that way's own copper may sit there; every other net, ground included, stays out.
_Avoid_: Ring zone, danger zone

## Rev A

**Strip**:
The rev A board: one 6-way Blade Reader, fitted along one long side of a fuse panel, two to a
12-way panel. Shelved at the tag `rev-a-strip` and never ordered. The older research notes
describe it.
