# Pawmpt agent approval bridge

Pawmpt can host an approval card for a custom agent adapter. The adapter owns the vendor's
permission protocol and translates it to these JSON Lines messages. The bridges for opencode,
Claude Code and Codex in this folder are such adapters, and `bridge_common.py` has what they
share.

Enable **Approval bridge** in Agent settings. Pawmpt starts the command with stdin open and sends
one line:

```json
{"pawmpt":"request","prompt":"the user's prompt","secrets":["*/.ssh/*","*.env"]}
```

`secrets` are Pawmpt's patterns for files that hold keys and passwords (shell-style, on the whole
path). An adapter should keep the agent from reading them where its agent can be told to.

When the agent needs approval, write this event to stdout:

```json
{"pawmpt":"permission","id":"request-id","title":"Run command?","detail":"git push origin main"}
```

Add `"allowAll":true` to offer **Allow all this run** as well; leave it out for a request that
should always be answered on its own. Pawmpt shows the title and detail as plain text, without
control and direction characters, and says so when a detail was too long to show in full. It then
sends one of these to the adapter's stdin:

```json
{"pawmpt":"permission_reply","id":"request-id","allow":true}
{"pawmpt":"permission_reply","id":"request-id","allow":false}
```

When **Allow all this run** was pressed, the first reply also has `"allowAll":true`, and every
waiting request that offered it gets an allow of its own. More than twelve requests waiting at
once are denied as they come.

The adapter should match replies by `id`, ignore a reply for an id it didn't ask about or already
has an answer for, keep the agent paused until the reply arrives, and translate the choice using
the agent's official API. Do not infer permission requests from ordinary assistant prose. Read
stdin in a thread or with non-blocking reads of your own: two replies can arrive in one write.

The adapter can also send:

```json
{"pawmpt":"text","text":"part of the answer"}
{"pawmpt":"activity","text":"› shell: git status"}
{"pawmpt":"usage","tokens":1234,"cost":0.0021}
{"pawmpt":"error","text":"what went wrong"}
```

`text` is added to the answer, `activity` is a step shown above it, `usage` is the tokens and
cost under it, and `error` ends the answer as a failure. Any other line on stdout is shown as part
of the answer.

Pawmpt keeps stdin open for replies. It stops the adapter with SIGTERM when you press Stop or the
time limit is reached, and closes stdin when it goes away itself: in both cases stop the agent and
everything it started, and treat every request still waiting as denied.
