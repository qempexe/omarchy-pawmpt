# Changelog

All notable changes to Pawmpt. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-11-03

### Security

- Your question, the context sent with it and the answers no longer appear in command
  arguments, which other users on the computer can list. The agent gets the question on
  stdin, copying goes to `wl-copy` on stdin, the opencode session is titled Pawmpt, and a
  notification only says that an answer is ready.
- Let it act off is now enforced: opencode gets permissions that only let it read, search
  and look things up, so its Build agent can no longer edit files or run commands
  without asking.

### Changed

- The presets for your own command send the question on stdin (`claude -p`, `gemini`,
  `codex exec -`); the old presets are read the new way.

## [1.0.0] - 2026-11-03

### Added

- A pal on the desktop: drag it anywhere and across screens, click to ask, right click
  for the menu, and choose what every click does.
- Ninety characters in eleven categories, and your own pictures and animated GIFs,
  sorted into categories of your own.
- A wardrobe: fifteen skins, your own colors, fills, patterns, outlines, glow, eyes and
  mouths, twenty-seven things to wear, and whole pals saved under a name.
- Sixteen idle moves, blinking, eyes that follow the mouse, falling asleep, and sixteen
  ways to move about the screen.
- An agent: opencode with a searchable model list, Ollama, or a command of your own, with
  live progress, conversations, agent mode, thinking effort, answer style and language,
  letting it act, quick actions, follow-ups, retries, notifications and voice through Hex.
- Context from the desktop: the active window's folder and title, the selection and the
  clipboard, each only when turned on.
- A bar button with a tiny copy of your pal, a panel by the bar or in its own window, a
  search box over every setting, four color schemes, the window outline, and an About page.
- ipc for showing, asking, quick actions, voice, characters, skins, things to wear and pals.
- Checks: `node tools/check.js` and the tests in `tests/`.

[1.0.1]: https://github.com/qempexe/omarchy-pawmpt/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/qempexe/omarchy-pawmpt/releases/tag/v1.0.0
