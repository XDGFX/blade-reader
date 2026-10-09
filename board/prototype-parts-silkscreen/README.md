# PROTOTYPE: parts-face silkscreen concepts (issue #28)

Throwaway. Open `parts-face-concepts.html` in a browser.

Rebuild from `board/`:

    bunx tsci build index.circuit.tsx --routing-disabled --ignore-errors
    cd prototype-parts-silkscreen
    bun extract-parts.mjs ../dist/index/circuit.json geom-parts.json && bun build-parts.mjs

`geom-parts.json` is the parts face (tscircuit top) at 0719b85, in mm seen from the parts side:
x = X + 52.01, y = 19.25 − Y. `logo.json` is the banner wordmark from `prototype/silkscreen-concepts`.
`shot.mjs` screenshots each concept with Playwright and prints its silk check.
