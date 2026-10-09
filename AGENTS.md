# AGENTS.md

Blade Reader is a circuit board that measures the current on every way of a blade fuse panel.
Read `README.md` for what it is, then `docs/design.md` for what has been decided and why. Don't
reopen a decision there without saying so explicitly.

## Vocabulary

- **Fuse panel**: the blade fuse block the strip fits. Not "fuse box" or "fuse block".
- **Way**: one numbered fuse position, and the circuit it feeds. Not "channel" or "slot".
- **Strip**: one 6-way Blade Reader board, fitted along one long side of a fuse panel.

## Conventions

- British English.
- Work on `main` and push to `main` while the project is pre-release and private. There are no
  other contributors yet.
- Issues live in this repo's GitHub Issues, driven with `gh`.
- No raster images except generated board renders under `docs/assets/`.
- Prices are USD, with the LCSC part code and the date checked. JLC basic, preferred and
  extended status matters: every extended part type costs about $3 per order.
- Choices for Cal open with an executive summary holding everything needed to decide: options,
  costs, trade-offs and a recommendation.

## Tooling

The board is designed in [tscircuit](https://tscircuit.com), installed with Bun
(`bun add -g tscircuit`), with the version pinned. Known caveats are in `docs/design.md` under
Tooling.
