# Contributing

Characters, skins and things to wear are welcome. Everyone taking part is expected to follow the [code of conduct](CODE_OF_CONDUCT.md).

## A new character

1. Add a function to `shapes` in `qml/js/Draw.js`. It gets the canvas, the center, the ground line, the size, the breath and the options (`body`, `eye`, `accent`, `t`, `busy` and the rest listed at the top of the file), draws the body, and returns where the eyes go: `[{ x, y, r, square }]`. The eyes are drawn for you, blinking and looking around.
2. If it is shaped unlike the others, add its parts to `layouts` in the same file, so hats, glasses and patterns land in the right place.
3. Add `{ key, label, category }` to `characters` in `qml/js/Skins.js`.
4. Run `node tools/check.js`. It draws every character in every skin and with every item, at many sizes, and fails on broken numbers or drawings that leave the canvas.

## A new skin

Add `{ name, body, eye, accent }` to `presets` in `qml/js/Skins.js`. Keep the eyes readable on the body.

## Something to wear

Add it to `dressItems` in `qml/js/Skins.js` and its drawing to `dressDraw` in `qml/js/Draw.js`, then run the checks.

## A setting

Every setting lives in `qml/js/Schema.js`: its page, label, options and default. After adding one, run `node tools/gen-manifest.js` to update `manifest.json`.

## Checks

```bash
node tools/check.js            # every character, skin and item; the QML against Schema.js
node tests/test_manifest.js    # manifest.json against the code
node tests/test_prompt.js      # what is sent to the agent
node tests/test_voice.js       # voice input
node tests/test_glow.js        # the glow
```

## Style

Modern JavaScript inside functions (`const`, `let`, arrow functions).
