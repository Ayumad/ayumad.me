"""Receive the latest desktop Codex title for the private Hermes dashboard."""

import datetime as dt
import fcntl
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path


FEED = Path.home() / ".hermes" / "state" / "dashboard_codex_desktop.json"
LIVE = FEED.with_name("dashboard_live.json")
PUBLISHED = FEED.with_name("dashboard_codex_published.json")
PUBLISHER = FEED.parent.parent / "scripts" / "dashboard_refresh.sh"
MAX_BYTES = 4096
MAX_DAILY_PUBLISHES = 24


def parse_thread(raw):
    if len(raw) > MAX_BYTES:
        raise ValueError("Oversized desktop Codex update.")
    item = json.loads(raw)
    if item is None:
        return None
    if not isinstance(item, dict) or item.keys() != {"title", "updated_at"}:
        raise ValueError("Invalid desktop Codex update.")
    title, updated_at = item["title"], item["updated_at"]
    if not isinstance(title, str) or not 0 < len(title.strip()) <= 180 or not isinstance(updated_at, str):
        raise ValueError("Invalid desktop Codex metadata.")
    stamp = dt.datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
    if stamp.tzinfo is None:
        raise ValueError("Desktop Codex update needs a time zone.")
    return {"title": title.strip(), "updated_at": stamp.astimezone(dt.timezone.utc).isoformat(timespec="seconds")}


def read_desktop_thread():
    try:
        with FEED.open("rb") as handle:
            return parse_thread(handle.read(MAX_BYTES + 1))
    except (OSError, ValueError):
        return None


def replace_json(path, item):
    with tempfile.NamedTemporaryFile(dir=path.parent, mode="w", encoding="utf-8", delete=False) as handle:
        temporary = Path(handle.name)
        try:
            json.dump(item, handle, ensure_ascii=False)
            handle.close()
            os.replace(temporary, path)
        finally:
            temporary.unlink(missing_ok=True)


def publish_if_changed():
    with PUBLISHED.with_suffix(".lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return
        with LIVE.open(encoding="utf-8") as handle:
            snapshot = json.load(handle)
        latest = next((item for item in snapshot.get("codex", {}).get("recent", []) if item.get("source") == "desktop"), None)
        digest = hashlib.sha256(latest["title"].encode("utf-8")).hexdigest() if latest else None
        state = json.loads(PUBLISHED.read_text()) if PUBLISHED.exists() else {}
        if state.get("digest") == digest:
            return
        now = dt.datetime.now(dt.timezone.utc).timestamp()
        recent_publishes = [when for when in state.get("publishes", []) if now - when < 86400]
        if len(recent_publishes) >= MAX_DAILY_PUBLISHES:
            return
        subprocess.run([str(PUBLISHER)], check=True, timeout=60)
        replace_json(PUBLISHED, {"digest": digest, "publishes": [*recent_publishes, now]})


if __name__ == "__main__":
    if sys.argv[1:] == ["--publish-if-changed"]:
        publish_if_changed()
    else:
        replace_json(FEED, parse_thread(sys.stdin.buffer.read(MAX_BYTES + 1)))
