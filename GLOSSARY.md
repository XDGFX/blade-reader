# Blade Reader

A board that measures the current on every way of a blade fuse panel. These are the words for
the panel it fits and the parts of the board itself.

## The fuse panel

**Fuse panel**:
The blade fuse block a strip fits, such as the Blue Sea ST Blade.
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
_Avoid_: U board, frame

**Arm**:
One side of a yoke, along one long side of the fuse panel, with six fingers.

**Chin**:
The part of a yoke that joins the two arms past the fuse panel's positive end, and carries the
ESP32, the supply and the ground nut.

## The strip

**Strip**:
One 6-way Blade Reader board, fitted along one long side of a fuse panel.
_Avoid_: Board (when the fitted unit is meant), module

**Finger**:
The part of a strip that reaches into one way's pocket and is clamped under that way's screw.
One finger per way.
_Avoid_: Tab, tooth, prong

**Body**:
The part of a strip outboard of the fuse panel's edge, which carries the electronics and the
output nuts.

**Sensor**:
One finger's current sensor, numbered S1–S6 from the ESP32 end of the strip. A sensor's
number is the strip's own; which way it reads depends on the side of the panel the strip fits.
_Avoid_: Channel, way (for the strip's own numbering)

**Comb**:
The strip's outline: six fingers joined by the body.

**Parts face**:
The face of a strip that carries every assembled part. It faces down, towards the bulkhead.
_Avoid_: Top, bottom (tscircuit's "top" is the parts face)

**Ring face**:
The face of a strip opposite the parts face. It is bare copper where ring terminals land, and
faces up.
_Avoid_: Top, bottom

**Ring keepout**:
The area of the ring face that a way's fitted ring and its tongue can cover, including as they
swing. Only that way's own copper may sit there; every other net, ground included, stays out.
_Avoid_: Ring zone, danger zone
