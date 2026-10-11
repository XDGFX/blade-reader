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
- Work on `main` and push to `main` while the project is pre-release and private. There are no
  other contributors yet.
- Issues live in this repo's GitHub Issues, driven with `gh`.
- No raster images except generated board renders under `docs/assets/`.
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

## Issue tracker

GitHub Issues on this repo. Conventions, including how `/wayfinder` maps and tickets work here, are in `docs/agents/issue-tracker.md`.
