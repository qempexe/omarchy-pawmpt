# Changelog

All notable changes to Pawmpt. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [1.0.4] - 2026-11-06

### Security

- Cancelling voice while Hex was still starting up could let that start begin recording
  afterwards, with Pawmpt idle and not counting down to stop it. Cancel now stops the
  pending start, and Hex is told to cancel only once that start is gone, so nothing is
  left recording. Voice can't be started again until the cancel is done.
- Pawmpt's settings and characters folders are made private again at every start, also
  when they are left over from an older version with looser permissions.

## [1.0.3] - 2026-11-05

### Security

- **Let it act** off holds on opencode 2 while its background service is running. `opencode
  run` handed the question to that service, which never saw the read-only rules, so the
  agent could still edit files and run commands. Each run now gets a private server that
  has them.
- An `opencode.json` or `.opencode` folder in the work folder, a repository you cloned for
  example, can no longer give the agent back what Let it act off takes away: the rules are
  set for its agents too, and opencode applies an agent's own rules last.
- With Let it act off nothing goes online, unless **Look things up online** is on, so what
  it read can't leave in a page's address.
- With Let it act off, keys and passwords can't be read: `~/.ssh`, `~/.gnupg`,
  `~/.password-store`, `~/.aws`, `~/.kube`, `.netrc`, `.git-credentials`, `*.pem`, `*.key`
  and opencode's own `auth.json`, as well as `.env` files.
- Only a session id that looks like one is kept and passed on.

### Added

- **Look things up online** (Agent): lets it search the web and open pages with Let it act
  off.

### Fixed

- Thinking effort works on opencode 2, which takes it on the model.

## [1.0.2] - 2026-11-05

### Fixed

- On Omarchy 4.5, where the bar's window spans the screen, the panel didn't open, or
  opened over the bar. It now opens off the bar's outer edge, on any edge and with any
  bar size.

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

[1.0.4]: https://github.com/qempexe/omarchy-pawmpt/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/qempexe/omarchy-pawmpt/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/qempexe/omarchy-pawmpt/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/qempexe/omarchy-pawmpt/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/qempexe/omarchy-pawmpt/releases/tag/v1.0.0
