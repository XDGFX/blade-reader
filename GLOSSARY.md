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

**Pocket**:
The space between two barriers of the fuse panel where a way's output screw sits on its pad.

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
12-way panel. Shelved at the tag `rev-a-strip` and never ordered. Its sensors were numbered
S1–S6 from its ESP32 end, whichever ways they read.
