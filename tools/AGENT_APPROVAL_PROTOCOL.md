# Pawmpt agent approval bridge

Pawmpt can host an approval card for a custom agent adapter. The adapter owns the vendor's
permission protocol and translates it to these JSON Lines messages.

Enable **Approval bridge** in Agent settings. Pawmpt starts the command with stdin open and sends:

```json
{"pawmpt":"request","prompt":"the user's prompt"}
```

When the agent needs approval, write this event to stdout:

```json
{"pawmpt":"permission","id":"request-id","title":"Run command?","detail":"git push origin main"}
```

Pawmpt displays the title and detail, then sends one of these to the adapter's stdin:

```json
{"pawmpt":"permission_reply","id":"request-id","allow":true}
{"pawmpt":"permission_reply","id":"request-id","allow":false}
```

The adapter should match replies by `id`, keep the agent paused until the reply arrives, and
translate the choice using the agent's official API. Other stdout lines remain visible as the
answer. Do not infer permission requests from ordinary assistant prose.
