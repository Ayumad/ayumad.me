"""Collect workstation resource histories on Hermes and mirror them to the wall."""

import argparse
import datetime as dt
import fcntl
import json
import math
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

STATE = Path.home() / ".hermes" / "state"
FEED = STATE / "machine-resources.json"
MACHINES = {"creekwood": "Creekwood", "mac-mini": "Mac mini", "ayumacpro": "Ayumacpro"}
METRICS = ("cpu_pct", "gpu_pct", "memory_pct")
HISTORY_MS = 15 * 60000
MIRROR_COMMAND = """
set -eu
dir="$HOME/dashboard-wall"
temp="$(mktemp "$dir/.machine-resources.XXXXXX")"
trap 'rm -f "$temp"' EXIT
cat > "$temp"
python3 -m json.tool "$temp" > /dev/null
chmod 644 "$temp"
mv -f "$temp" "$dir/machine-resources.json"
"""


def clean_sample(sample, now):
    if not isinstance(sample, dict):
        raise ValueError("Expected a workstation sample.")
    stamp = sample.get("sampled_at")
    if type(stamp) is not int or not now - 120000 <= stamp <= now + 10000:
        raise ValueError("Workstation sample time is outside the accepted window.")
    result = {"sampled_at": stamp}
    for metric in METRICS:
        value = sample.get(metric)
        result[metric] = round(value, 1) if type(value) in (int, float) and math.isfinite(value) and 0 <= value <= 100 else None
    last_input = sample.get("last_input_at")
    result["last_input_at"] = last_input if type(last_input) is int and 0 < last_input <= stamp else None
    unlocked = sample.get("unlocked")
    result["unlocked"] = unlocked if isinstance(unlocked, bool) else None
    return result


def read_feed():
    try:
        data = json.loads(FEED.read_text())
        if isinstance(data, dict) and isinstance(data.get("machines"), list):
            return data
    except (OSError, ValueError):
        pass
    return None


def clean_spotify(item, stamp):
    if not isinstance(item, dict):
        return None
    def label(key):
        value = item.get(key)
        return " ".join(value.split())[:180] if isinstance(value, str) else ""
    title = label("title")
    if not title or not isinstance(item.get("playing"), bool):
        return None
    playing = item["playing"]
    artist = label("artist")
    return {
        "configured": True, "state": "playing" if playing else "recent", "isPlaying": playing,
        "title": title, "artists": [artist] if artist else [], "album": label("album"),
        "source": "desktop", "updatedAt": dt.datetime.fromtimestamp(stamp / 1000, dt.timezone.utc).isoformat(),
    }


def record(machine_id, sample):
    now = time.time_ns() // 1000000
    desktop_sent = machine_id == "creekwood" and isinstance(sample, dict) and "spotify" in sample
    desktop = sample.get("spotify") if desktop_sent else None
    sample = clean_sample(sample, now)
    with (STATE / "machine-resources.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        data = read_feed() or {"machines": []}
        current = next((entry for entry in data["machines"] if entry["id"] == machine_id), None)
        if current is None:
            current = {"id": machine_id, "name": MACHINES[machine_id], "samples": []}
            data["machines"].append(current)
        if desktop_sent and (not current["samples"] or sample["sampled_at"] >= current["samples"][-1]["sampled_at"]):
            data["desktop_spotify"] = clean_spotify(desktop, sample["sampled_at"])
        history = {entry["sampled_at"]: entry for entry in current["samples"]}
        history[sample["sampled_at"]] = sample
        current["samples"] = [history[stamp] for stamp in sorted(history) if stamp >= now - HISTORY_MS][-61:]
        for entry in data["machines"]:
            if entry["id"] != machine_id:
                kept = [point for point in entry["samples"] if point["sampled_at"] >= now - HISTORY_MS]
                entry["samples"] = kept or entry["samples"][-1:]
        encoded = json.dumps(data, separators=(",", ":"), allow_nan=False)
        with tempfile.NamedTemporaryFile(dir=STATE, mode="w", encoding="utf-8", delete=False) as temp:
            path = Path(temp.name)
            try:
                temp.write(encoded)
                temp.close()
                os.replace(path, FEED)
            finally:
                path.unlink(missing_ok=True)
        subprocess.run(
            ["/usr/bin/ssh", "-T", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes",
             "-o", "ConnectTimeout=5", "ayumad@10.0.0.54", MIRROR_COMMAND],
            input=encoded, text=True, check=True, timeout=12,
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("machine", choices=MACHINES)
    args = parser.parse_args()
    record(args.machine, json.loads(sys.stdin.buffer.read(4097)))
