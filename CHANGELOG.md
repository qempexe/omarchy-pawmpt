# Changelog

All notable changes to Pawmpt. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [1.1.1] - 2026-11-11

### Security

- Claude Code can no longer read the files that hold keys and passwords: it gets deny rules
  for them, and Pawmpt turns down any request for one. In 1.1.0 it could read a `.env` file
  in the work folder without asking.
- Codex runs in a permissions profile that can't read those files, by a command either. In
  1.1.0 an approved command could read `~/.ssh`.
- A command that names one of those files is always asked on its own, with a warning.
  **Allow all this run** never covers it, and with opencode it asks with **Let it act** on too.
- More files are kept out of reach: `.npmrc`, `.pypirc`, the GitHub CLI's `hosts.yml`,
  `rclone.conf`, the keyrings, and Codex's and Claude Code's own sign-in files.
- The approval card shows a request as plain text without control and direction characters,
  says how much of a long one isn't shown, and ignores a click in the first moment after it
  appears. More than twelve requests waiting at once are denied.
- A request that can't reach Pawmpt is denied, and a reply for a request that wasn't asked is
  ignored.

### Fixed

- opencode 1.x works again; 1.1.0 stopped with "server did not become ready".
- An opencode answer is no longer cut short while a permission card is open or the model is
  slow, and "Agent action" lines no longer show up in it.
- A second Allow or Deny sent right after the first is no longer lost.
- Stop, the time limit, turning the plugin off and a shell restart stop the agent and
  everything it started. Before, the bridge could wait forever and leave `opencode serve`,
  Claude Code or Codex running.
- Claude Code shows its steps and its answer as they come, and the tokens and cost under it.
- Codex shows its steps and the tokens, and says so when it stops before answering.
- A missing agent says which one to install instead of failing silently.
- The About tab shows the right version.

## [1.1.0] - 2026-11-08

### Added

- OpenCode permission requests now appear in Pawmpt with Allow once and Deny buttons.
- Native Claude Code and Codex adapters route their permission requests through Pawmpt.
- Custom agents can use the documented JSON Lines approval bridge.
- Codex can ask before starting an allowlisted desktop app when its sandbox cannot reach
  the display; it does not rerun the agent outside its sandbox.

### Changed

- Hex dictation now goes to the question box for review before sending by default.
- Selected text, clipboard contents, window context and prior answers are tagged as
  untrusted reference data in the composed prompt. Direct questions are normalized and
  length-limited before they are sent.
- OpenCode's **Let it act** setting now uses its permission prompts when off and automatic
  approval when on. The documentation describes these as app-level permissions, not an OS
  sandbox.

## [1.0.6] - 2026-11-06

### Security

- Cancel works on Hex 3.3, which has no `hex dictation cancel`: the recording went on
  after Cancel, with Pawmpt idle. It is now stopped with `hex dictation stop --print`,
  which never pastes, and the words are thrown away. A Hex with cancel still uses it.
- A drop that fails is no longer ignored: Pawmpt says Hex may still be recording, and how
  to stop it.
- Only a recording Pawmpt may have started is dropped. Cancel while transcribing, or
  before a start could reach Hex, drops nothing, so it can't end a dictation of your own.
- A dictation of your own that is already recording is left alone, instead of Pawmpt
  taking it over and asking the agent with your words.
- Turning voice off, or hiding Pawmpt, drops the recording, so it never goes on where you
  can't see it.
- While listening, Pawmpt notices when Hex's shortcut ends the recording (Hex then pastes
  the words where you are) or when Hex stops, and says so instead of showing it listens.

### Fixed

- Starting voice while the last recording is still being stopped says so, instead of
  doing nothing.
- Stopping and dropping a recording use the Hex command it was started with, even if the
  setting changed in between.

## [1.0.5] - 2026-11-06

### Security

- Cancel while voice was starting could still leave Hex's first `hex dictation start`
  running: it was a child of the step Pawmpt stopped, and outlived it. If it was slow to
  get through, it could begin recording after the cancel, with Pawmpt idle. Each step of
  starting to record is now its own process, and that process is hex itself, so stopping
  a step stops hex, and Hex is told to cancel only once it is gone.
- When the shell reloads while asking by voice, Hex is told to cancel a moment later, in
  case the step that was running got the start through.

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

- **Let it act** off passes restrictive opencode permission rules and starts a private
  server for each run. These are app-level rules, not an operating system sandbox; they
  cannot guarantee isolation from extensions, MCP servers, provider behavior, or changes
  in opencode.
- The rules deny common credential paths and file types, editing, command execution and
  network tools by default. Pattern matching is best effort and cannot guarantee that
  credentials are inaccessible or that nothing reaches the network.
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

[1.1.1]: https://github.com/qempexe/omarchy-pawmpt/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/qempexe/omarchy-pawmpt/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/qempexe/omarchy-pawmpt/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/qempexe/omarchy-pawmpt/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/qempexe/omarchy-pawmpt/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/qempexe/omarchy-pawmpt/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/qempexe/omarchy-pawmpt/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/qempexe/omarchy-pawmpt/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/qempexe/omarchy-pawmpt/releases/tag/v1.0.0
