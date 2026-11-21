"""Receive the latest desktop Codex title for the private Hermes dashboard."""

import datetime as dt
import json
import os
import sys
import tempfile
from pathlib import Path


FEED = Path.home() / ".hermes" / "state" / "dashboard_codex_desktop.json"
MAX_BYTES = 4096


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


def receive():
    item = parse_thread(sys.stdin.buffer.read(MAX_BYTES + 1))
    with tempfile.NamedTemporaryFile(dir=FEED.parent, mode="w", encoding="utf-8", delete=False) as handle:
        temporary = Path(handle.name)
        try:
            json.dump(item, handle, ensure_ascii=False)
            handle.close()
            os.replace(temporary, FEED)
        finally:
            temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    receive()
