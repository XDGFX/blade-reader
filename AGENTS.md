# AGENTS.md

Blade Reader is a circuit board that measures the current on every way of a blade fuse panel.
Read `README.md` for what it is, then `docs/design.md` for what has been decided and why. Don't
reopen a decision there without saying so explicitly.

## Vocabulary

Use the terms in `GLOSSARY.md` (fuse panel, way, yoke, arm, chin, finger, body, parts face, ring
face), and none of the words it says to avoid. The board is the yoke, rev B. The strip is rev A,
shelved at the tag `rev-a-strip`: read it there, don't bring it back into `board/`.

## Conventions

- British English.
- Issues live in this repo's GitHub Issues, driven with `gh`. Work lands as a PR, one issue per
  piece of work; docs and small safe changes go straight to `main`.
- No raster images except generated board renders under `docs/assets/`.
- A change to how a yoke is flashed, zeroed, installed or recovered updates the manual,
  `manual/index.html`, in the same PR. Its drawings are generated from the board by
  `board/manual/`; `bun run manual` in `board/` builds the site into `manual/dist/`, and
  `.github/workflows/manual.yml` publishes it from `main`.
- Prices are USD, with the LCSC part code and the date checked. JLC basic, preferred and
  extended status matters: every extended part type costs about $3 per order. That is under $1 a
  board at 4 boards, so weigh it against what avoiding it costs (board area, routing, accuracy,
  a harder install or first flash) and say both sides; don't let the fee decide on its own.
- Soft targets give way: the moment one blocks placement or routing, drop it there and say so.
  Don't treat a figure from an earlier iteration as a limit unless `docs/design.md` gives a
  reason it still holds.
- Choices for Cal open with an executive summary holding everything needed to decide: options,
  costs, trade-offs and a recommendation.

## Tooling

The board is designed in [tscircuit](https://tscircuit.com), in `board/`, with the version pinned
by `board/bun.lock`. Run it through `bun run` or `bunx tsci` in `board/`, so the pinned copy is
used: read every bare `tsci` in the `tscircuit` skill that way. Known caveats are in
`docs/design.md` under Tooling.

The firmware is ESPHome with one external component, `blade_reader`, in
`firmware/components/blade_reader/`. Its hardware-free core (`core.*`, `constants.h`) holds every
calculation and takes no ESPHome or ESP-IDF include; the rest is glue. Firmware gates, both run
from the repo root:

- `make -C firmware test`: the core's tests and the web page's model tests (with Node), on the Mac.
- `esphome compile firmware/blade-reader.yaml`: the glue builds. It needs a
  `firmware/secrets.yaml`; a copy of `secrets.example.yaml` with any base64 `api_key` will do.

## Issue tracker

GitHub Issues on this repo. Conventions, including how `/wayfinder` maps and tickets work here, are in `docs/agents/issue-tracker.md`.
