"""PROTOTYPE, throwaway: 1:1 body arrangement plates for "Strip body arrangement" (issue #15).

Writes two printable plates (STL) and a 1:1 drawing (SVG) of the same two arrangements:

  A  one nut row at 13.36 mm pitch, with through slots for a printed barrier between nuts
  B  two staggered rows: odd ways 15 mm out, even ways 30 mm out

Run:  uv run --with manifold3d --with numpy python board/prototype-body/make.py

Coordinates: x along the panel (way 1 at the left), y outboard from the panel edge, z up.
The ring face is z = 1.6. Fingers are 1.6 thick as on the real strip; the body is thickened
downwards to 3.2 so it survives a torqued M4. Print ring face down (the script flips it),
then drop real M4 nuts (7 mm across flats) into the hex pockets on the parts face.
Engraved on the ring face: copper pads, the ESP32 module and its antenna, the M3 zones and
a dot count for each way number.
"""

import math
import pathlib

import numpy as np
from manifold3d import CrossSection, Manifold, OpType

OUT = pathlib.Path(__file__).parent
PITCH = 13.36
WAYS = 6
LENGTH = PITCH * WAYS  # 80.16
FINGER_W = 9.5
TIP = 13.0  # finger tip inset into the panel
HOLE_Y = -8.52
HOLE_D = 5.4
WASHER_D = 8.13
PAD_D = 9.3  # SMT nut copper pad
NUT_AF = 7.2  # pocket for a 7.0 AF M4 nut
BOLT_D = 4.4
M3_D = 3.2
M3_ZONE = 12.0  # square, parts face
M3_RING = 8.0  # round, ring face
MOD_W, MOD_L, ANT_L = 13.2, 16.6, 5.0  # ESP32-C3-MINI-1; antenna end length is approximate
T_FINGER, T_BODY = 1.6, 3.2
ENGRAVE = 0.4
LINE = 0.6
SEG = 64


def way_x(i):  # i = 0..5 for ways 1..6
    return PITCH / 2 + PITCH * i


VARIANTS = {
    "A": dict(
        title="A: one row, barrier slots",
        depth=40.0,
        nuts=[(way_x(i), 16.0) for i in range(WAYS)],
        slots=[(PITCH * k, 16.0, 1.7, 11.0) for k in range(1, WAYS)],
        m3=[(7.0, 33.0), (LENGTH - 7.0, 33.0)],
        # module centred behind the row, antenna at the outboard edge, board notched under it
        module=(LENGTH / 2, 40.0 - MOD_L / 2, "+y"),
        notch=(LENGTH / 2 - MOD_W / 2, 40.0 - ANT_L, MOD_W, ANT_L),
    ),
    "B": dict(
        title="B: staggered rows 15 / 30",
        depth=48.0,
        nuts=[(way_x(i), 15.0 if i % 2 == 0 else 30.0) for i in range(WAYS)],
        slots=[],
        # the far corner is taken by way 6's nut until the body is 48 deep
        m3=[(7.0, 41.0), (LENGTH - 7.0, 41.0)],
        # module in the gap behind way 3, between the nuts of ways 2 and 4
        module=(way_x(2), 48.0 - MOD_L / 2, "+y"),
        notch=(way_x(2) - MOD_W / 2, 48.0 - ANT_L, MOD_W, ANT_L),
    ),
}


def rect(x, y, w, h):
    return CrossSection.square([w, h]).translate([x, y])


def circle(x, y, d):
    return CrossSection.circle(d / 2, SEG).translate([x, y])


def ring(x, y, d, w=LINE):
    return circle(x, y, d + w) - circle(x, y, d - w)


def rect_line(x, y, w, h, t=LINE):
    return rect(x - t / 2, y - t / 2, w + t, h + t) - rect(x + t / 2, y + t / 2, w - t, h - t)


def hexagon(x, y, af):
    r = af / math.sqrt(3)
    return CrossSection.circle(r, 6).rotate(30).translate([x, y])


def plate(v):
    d = v["depth"]
    fingers = CrossSection()
    for i in range(WAYS):
        x = way_x(i)
        fingers += rect(x - FINGER_W / 2, -TIP, FINGER_W, TIP + 1.5)
    body2d = rect(0, 0, LENGTH, d)
    thick2d = rect(0, 1.5, LENGTH, d - 1.5)  # keeps the thickening clear of the panel wall

    holes = CrossSection()
    for i in range(WAYS):
        holes += circle(way_x(i), HOLE_Y, HOLE_D)
    for x, y in v["nuts"]:
        holes += circle(x, y, BOLT_D)
    for x, y in v["m3"]:
        holes += circle(x, y, M3_D)
    for x, y, w, h in v["slots"]:
        holes += rect(x - w / 2, y - h / 2, w, h)
    nx, ny, nw, nh = v["notch"]
    holes += rect(nx, ny, nw, nh + 1)

    solid = (fingers + body2d).extrude(T_FINGER) + thick2d.extrude(T_BODY).translate([0, 0, -1.6])
    solid -= holes.extrude(10).translate([0, 0, -5])

    pockets = CrossSection()
    for x, y in v["nuts"]:
        pockets += hexagon(x, y, NUT_AF)
    solid -= pockets.extrude(1.6 + 0.01).translate([0, 0, -1.6 - 0.01])

    marks = CrossSection()
    for i in range(WAYS):
        marks += ring(way_x(i), HOLE_Y, WASHER_D)
    for n, (x, y) in enumerate(v["nuts"]):
        marks += ring(x, y, PAD_D)
        for k in range(n + 1):  # way number as dots, inboard of the pad
            marks += circle(x - (n * 1.6) / 2 + k * 1.6, y - PAD_D / 2 - 1.6, 1.0)
    for x, y in v["m3"]:
        marks += ring(x, y, M3_RING)
    mx, my, _ = v["module"]
    marks += rect_line(mx - MOD_W / 2, my - MOD_L / 2, MOD_W, MOD_L)
    marks += rect_line(mx - MOD_W / 2, my + MOD_L / 2 - ANT_L, MOD_W, ANT_L)
    marks = CrossSection.batch_boolean([marks, body2d + fingers], OpType.Intersect)
    solid -= marks.extrude(ENGRAVE + 0.01).translate([0, 0, T_FINGER - ENGRAVE])
    return solid


def write_stl(m, path):
    mesh = m.to_mesh()
    v = np.asarray(mesh.vert_properties)[:, :3]
    t = np.asarray(mesh.tri_verts)
    tri = v[t]
    n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-12
    rec = np.zeros(len(t), dtype=[("n", "<f4", 3), ("v", "<f4", (3, 3)), ("a", "<u2")])
    rec["n"], rec["v"] = n, tri
    with open(path, "wb") as f:
        f.write(b"PROTOTYPE body arrangement".ljust(80, b" "))
        f.write(np.uint32(len(t)).tobytes())
        f.write(rec.tobytes())


def svg(variants):
    # 1:1 in mm, looking down on the ring face. Panel inboard at the top.
    pad, gap = 12, 30
    w = LENGTH + 2 * pad + 60
    rows = []
    y0 = pad + TIP
    for key, v in variants.items():
        d = v["depth"]
        g = [f'<g transform="translate({pad},{y0})">']
        g.append(f'<text x="0" y="{-TIP - 3}" font-size="4" font-weight="bold">{v["title"]} ({d:g} deep)</text>')
        g.append(f'<line x1="-6" y1="0" x2="{LENGTH + 6}" y2="0" stroke="#2a5db0" stroke-width="0.3" stroke-dasharray="2 1"/>')
        outline = [f"M 0 0"]
        for i in range(WAYS):
            x = way_x(i)
            outline.append(f"L {x - FINGER_W / 2} 0 L {x - FINGER_W / 2} {-TIP} L {x + FINGER_W / 2} {-TIP} L {x + FINGER_W / 2} 0")
        nx, ny, nw, nh = v["notch"]
        outline.append(f"L {LENGTH} 0 L {LENGTH} {d} L {nx + nw} {d} L {nx + nw} {ny} L {nx} {ny} L {nx} {d} L 0 {d} Z")
        g.append(f'<path d="{" ".join(outline)}" fill="#e6f2e6" stroke="#1d6b2a" stroke-width="0.35"/>')
        g.append(f'<rect x="0.5" y="1.5" width="{LENGTH - 1}" height="7.5" fill="#fde8c8" stroke="#c77d00" stroke-width="0.2"/>')
        for i in range(WAYS):
            x = way_x(i)
            g.append(f'<circle cx="{x}" cy="{HOLE_Y}" r="{HOLE_D / 2}" fill="#fff" stroke="#1d6b2a" stroke-width="0.3"/>')
        for n, (x, y) in enumerate(v["nuts"]):
            g.append(f'<circle cx="{x}" cy="{y}" r="{PAD_D / 2}" fill="#f1c27d" stroke="#8a5600" stroke-width="0.25"/>')
            g.append(f'<circle cx="{x}" cy="{y}" r="{BOLT_D / 2}" fill="#fff" stroke="#8a5600" stroke-width="0.2"/>')
            # ring terminal ghost: 9.4 wide tongue, barrel running outboard, 28 long overall
            g.append(f'<rect x="{x - 4.7}" y="{y - 4.7}" width="9.4" height="28" rx="4.7" fill="none" stroke="#b03a2e" stroke-width="0.25" stroke-dasharray="1 0.6"/>')
            g.append(f'<text x="{x}" y="{y + 1.2}" font-size="3" text-anchor="middle">{n + 1}</text>')
        for x, y, sw, sh in v["slots"]:
            g.append(f'<rect x="{x - sw / 2}" y="{y - sh / 2}" width="{sw}" height="{sh}" fill="#fff" stroke="#1d6b2a" stroke-width="0.2"/>')
        for x, y in v["m3"]:
            g.append(f'<rect x="{x - M3_ZONE / 2}" y="{y - M3_ZONE / 2}" width="{M3_ZONE}" height="{M3_ZONE}" fill="none" stroke="#777" stroke-width="0.2" stroke-dasharray="1 0.6"/>')
            g.append(f'<circle cx="{x}" cy="{y}" r="{M3_D / 2}" fill="#fff" stroke="#1d6b2a" stroke-width="0.25"/>')
        mx, my, _ = v["module"]
        g.append(f'<rect x="{mx - MOD_W / 2}" y="{my - MOD_L / 2}" width="{MOD_W}" height="{MOD_L}" fill="#dfe7f5" fill-opacity="0.7" stroke="#2a5db0" stroke-width="0.3"/>')
        g.append(f'<text x="{mx}" y="{my - 1}" font-size="2.4" text-anchor="middle">ESP32-C3</text>')
        g.append(f'<rect x="{mx - MOD_W / 2 - 15}" y="{my + MOD_L / 2 - ANT_L - 15}" width="{MOD_W + 30}" height="{ANT_L + 30}" fill="none" stroke="#2a5db0" stroke-width="0.2" stroke-dasharray="0.8 0.8"/>')
        g.append(f'<text x="{LENGTH + 4}" y="4" font-size="2.6" fill="#555">sensor band</text>')
        g.append(f'<text x="{LENGTH + 4}" y="{d}" font-size="2.6" fill="#555">{d:g} mm</text>')
        g.append("</g>")
        rows.append("\n".join(g))
        y0 += TIP + d + 28 + gap
    h = y0
    legend = (f'<text x="{pad}" y="{h - 12}" font-size="2.8" fill="#555">PROTOTYPE, 1:1 in mm, ring face up. Red dashed: a 9.4 × 28 ring terminal.</text>'
              f'<text x="{pad}" y="{h - 7}" font-size="2.8" fill="#555">Blue dotted: 15 mm antenna clearance. Grey dashed: 12 × 12 M3 zone (parts face). Orange: sensor band.</text>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}mm" height="{h}mm" viewBox="0 0 {w} {h}" '
            f'font-family="Helvetica,Arial,sans-serif">\n<rect width="{w}" height="{h}" fill="#fff"/>\n'
            + "\n".join(rows) + "\n" + legend + "\n</svg>\n")


def barrier():
    # push-in barrier for plate A's slots: 1.5 thick, 10.6 long tab, standing 8 above the ring face
    body = Manifold.cube([10.6, 1.5, 3.2 + 8.0])
    shoulder = Manifold.cube([13.0, 1.5, 8.0]).translate([-1.2, 0, 3.2])
    return body + shoulder


if __name__ == "__main__":
    for key, v in VARIANTS.items():
        m = plate(v).rotate([180, 0, 0])  # ring face down on the bed, not mirrored
        write_stl(m, OUT / f"plate-{key}.stl")
        bb = m.bounding_box()
        print(key, v["title"], "bbox", [round(b, 1) for b in bb])
    write_stl(barrier(), OUT / "barrier.stl")
    (OUT / "body-arrangement.svg").write_text(svg(VARIANTS))
