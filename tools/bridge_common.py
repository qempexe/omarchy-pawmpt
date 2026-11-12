"""What Pawmpt's agent bridges share: the JSON lines to Pawmpt, reading its replies,
starting the agent so it can't outlive the bridge, and knowing a key or password file
when one is named."""
import ctypes
import fnmatch
import json
import os
import queue
import re
import shlex
import signal
import subprocess
import sys
import threading
import time

# Files that hold keys and passwords, as shell-style patterns on the whole path. Pawmpt
# sends its own list with each request; this one is used when it doesn't.
SECRET_FILES = [
    "*.env", "*.env.*", "*/.ssh/*", "*/.gnupg/*", "*/.password-store/*", "*/.aws/*", "*/.kube/*",
    "*/.docker/config.json", "*/.netrc", "*/.git-credentials", "*/.npmrc", "*/.pypirc",
    "*/.config/gh/hosts.yml", "*/.config/rclone/rclone.conf", "*/.local/share/opencode/auth.json",
    "*/.codex/auth.json", "*/.claude/.credentials.json", "*/.local/share/keyrings/*", "*.pem", "*.key",
]
NOT_SECRET = ["*.env.example", "*.env.sample", "*.env.template"]

MAX_DETAIL = 2000


def emit(obj):
    """One JSON line to Pawmpt."""
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def clip(text, limit=MAX_DETAIL):
    """Text for a permission card: never silently cut, so what is approved is what was shown."""
    text = str(text)
    if len(text) <= limit:
        return text
    return text[:limit] + "\n… and %d more characters that are not shown. Deny if you can't see what it does." % (len(text) - limit)


def secret_patterns(request):
    """The patterns Pawmpt sent with the request, if they look like patterns; else the built-in ones."""
    sent = request.get("secrets") if isinstance(request, dict) else None
    if isinstance(sent, list) and sent and all(isinstance(p, str) and 0 < len(p) <= 200 for p in sent) and len(sent) <= 200:
        return list(sent)
    return list(SECRET_FILES)


def is_secret_path(path, patterns=None, cwd=None):
    """Is this path one of the key and password files? Checked as written, made absolute,
    and with links followed, so neither `../` nor a link in the work folder gets around it."""
    patterns = patterns or SECRET_FILES
    path = str(path or "").strip()
    if not path:
        return False
    cwd = cwd or os.getcwd()
    path = os.path.expanduser(path)
    seen = {path, os.path.normpath(os.path.join(cwd, path))}
    try:
        seen.add(os.path.realpath(os.path.join(cwd, path)))
    except (OSError, ValueError):
        pass
    for candidate in seen:
        if any(fnmatch.fnmatchcase(candidate, n) for n in NOT_SECRET):
            continue
        for extra in (candidate, candidate + "/x"):      # a folder such as ~/.ssh itself
            if any(fnmatch.fnmatchcase(extra, p) for p in patterns):
                return True
    return False


def mentions_secret(text, patterns=None, cwd=None):
    """Does a command, or any other text, name one of those files? A guess from its words: it
    decides whether to ask again, never whether something is safe."""
    text = str(text or "")
    if not text:
        return False
    try:
        words = shlex.split(text, comments=False, posix=True)
    except ValueError:
        words = text.split()
    for word in words:
        for piece in re.split(r"[=:,;|&<>()`$\s]+", word):
            piece = piece.strip("'\"")
            if piece and is_secret_path(piece, patterns, cwd):
                return True
    return False


def search_reaches_secret(path, patterns=None, cwd=None, limit=20000, seconds=2.0):
    """Could a search from `path`, hidden files included, read one of the key and password files?
    True or False, or None when there are too many files to look through in time.

    A folder is searched whole. For anything else, a file or a path that isn't there, opencode 1
    searches the whole folder it is in (opencode 2 only the file, or nothing), so that folder is
    what is looked through. Both the path as written and with its links followed count. Links
    inside are not followed, as ripgrep doesn't follow them, but one that points at such a file or
    folder counts as one. The .git folder is left out, as the search leaves it out."""
    cwd = cwd or os.getcwd()
    root = os.path.expanduser(str(path or "").strip() or cwd)
    if not os.path.isabs(root):
        root = os.path.join(cwd, root)
    root = os.path.normpath(root)
    if is_secret_path(root, patterns, cwd):
        return True
    folders = []
    for candidate in (root, os.path.realpath(root)):
        folder = candidate if os.path.isdir(candidate) else os.path.dirname(candidate)
        if folder not in folders:
            folders.append(folder)
    deadline = time.monotonic() + seconds
    seen = 0
    for folder in folders:
        if is_secret_path(folder, patterns, cwd):
            return True
        for dirpath, dirnames, filenames in os.walk(folder, followlinks=False):
            dirnames[:] = [d for d in dirnames if d != ".git"]
            for name in dirnames + filenames:
                seen += 1
                if seen > limit or time.monotonic() > deadline:
                    return None
                if is_secret_path(os.path.join(dirpath, name), patterns, cwd):
                    return True
    return False


class Replies:
    """Pawmpt's lines on stdin, read in a thread of their own. Reading stdin with select()
    and readline() loses a line that is already in Python's buffer, which leaves a click on
    Allow unanswered; a queue doesn't."""

    def __init__(self):
        self.lines = queue.Queue()
        self.closed = threading.Event()
        threading.Thread(target=self._read, daemon=True).start()

    def _read(self):
        try:
            for line in sys.stdin:
                self.lines.put(line)
        except (OSError, ValueError):
            pass
        self.closed.set()
        self.lines.put(None)

    def get(self, timeout=0.1):
        """A parsed reply, {} for a line that isn't one, None when nothing came, and
        EOFError when Pawmpt is gone."""
        try:
            line = self.lines.get(timeout=timeout)
        except queue.Empty:
            return None
        if line is None:
            self.lines.put(None)
            raise EOFError
        try:
            value = json.loads(line)
        except ValueError:
            return {}
        return value if isinstance(value, dict) else {}


def read_request():
    """The first line on stdin: Pawmpt's request. Read before Replies takes stdin over."""
    line = sys.stdin.readline()
    request = json.loads(line)
    if not isinstance(request, dict) or not isinstance(request.get("prompt"), str):
        raise ValueError("no prompt")
    return request


try:
    _LIBC = ctypes.CDLL(None)       # loaded here, so nothing has to be loaded between fork and exec
except OSError:
    _LIBC = None


def _die_with_parent():
    # the agent is told to stop when the bridge dies, however it dies (Linux: PR_SET_PDEATHSIG)
    if _LIBC is not None:
        try:
            _LIBC.prctl(1, int(signal.SIGTERM))
        except Exception:
            pass


def spawn(argv, **kwargs):
    """Start the agent in a process group of its own, so everything it starts can be stopped
    with it, and so that it stops if the bridge is killed. Call it from the main thread: the
    agent is tied to the thread that started it."""
    return subprocess.Popen(argv, start_new_session=True, preexec_fn=_die_with_parent, **kwargs)


def stop_tree(proc, grace=2):
    """Stop the agent and everything it started: ask first, then insist."""
    if proc is None:
        return
    for sig in (signal.SIGTERM, signal.SIGKILL):
        try:
            os.killpg(proc.pid, sig)
        except (ProcessLookupError, PermissionError):
            pass
        try:
            proc.wait(timeout=grace)
            break
        except subprocess.TimeoutExpired:
            continue
    # whatever the agent left running in its group goes too
    try:
        os.killpg(proc.pid, signal.SIGKILL)
    except (ProcessLookupError, PermissionError):
        pass


def on_signals():
    """SIGTERM and SIGINT end the bridge through its finally blocks."""
    def stop(signum, _frame):
        raise SystemExit(128 + signum)
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
