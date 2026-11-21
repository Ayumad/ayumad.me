"""Read aggregate metrics and input recency from a Mac user session."""

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path


def run(*args):
    try:
        return subprocess.check_output(args, text=True, timeout=5, env={**os.environ, "LC_ALL": "C"})
    except (OSError, subprocess.SubprocessError):
        return ""


def sample():
    cpu = re.findall(r"CPU usage:.*?([\d.]+)% idle", run("/usr/bin/top", "-l", "2", "-s", "1", "-n", "0"))
    stats = run("/usr/bin/vm_stat")
    page_size = re.search(r"page size of (\d+) bytes", stats)
    memory_pages = re.findall(r"^Pages (?:active|wired down|occupied by compressor):\s+(\d+)", stats, re.M)
    total = run("/usr/sbin/sysctl", "-n", "hw.memsize").strip()
    memory = sum(map(int, memory_pages)) * int(page_size[1]) / int(total) * 100 if page_size and len(memory_pages) == 3 and total.isdigit() and int(total) > 0 else None
    gpu = re.findall(r'"Device Utilization %"\s*=\s*(\d+)', run("/usr/sbin/ioreg", "-r", "-c", "IOAccelerator", "-d", "1", "-w", "0"))
    idle = re.search(r'"HIDIdleTime"\s*=\s*(\d+)', run("/usr/sbin/ioreg", "-l", "-r", "-c", "IOHIDSystem", "-d", "2", "-w", "0"))
    console = run("/usr/sbin/ioreg", "-l", "-d", "1", "-w", "0")
    users = next((line for line in console.splitlines() if '"IOConsoleUsers"' in line), "")
    login = next((entry for entry in re.findall(r"\{[^{}]+\}", users)
                  if re.search(r'"kCGSSessionUserIDKey"\s*=\s*' + str(os.getuid()) + r'(?!\d)', entry)
                  and re.search(r'"kCGSSessionOnConsoleKey"\s*=\s*Yes', entry)), None)
    now = time.time_ns() // 1000000
    return {
        "sampled_at": now,
        "cpu_pct": 100 - float(cpu[-1]) if cpu else None,
        "gpu_pct": max(map(int, gpu)) if gpu else None,
        "memory_pct": memory,
        "last_input_at": now - int(idle[1]) // 1000000 if idle and login else None,
        "unlocked": not bool(re.search(r'"CGSSessionScreenIsLocked"\s*=\s*Yes', login)) if login else None,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("machine", choices=("mac-mini", "ayumacpro"))
    parser.add_argument("--hub", help="SSH destination when sampling on a separate Mac.")
    options = parser.parse_args()
    if options.hub:
        if not re.fullmatch(r"[\w.][\w.-]*@[\w.][\w.-]*", options.hub):
            parser.error("Expected an SSH user and hostname.")
        command = ["/usr/bin/ssh", "-T", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes",
                   "-o", "ConnectTimeout=6", options.hub,
                   'python3 "$HOME/.hermes/scripts/machine_resource_feed.py" ' + options.machine]
    else:
        command = [sys.executable, str(Path(__file__).with_name("machine_resource_feed.py")), options.machine]
    subprocess.run(command, input=json.dumps(sample(), allow_nan=False), text=True, check=True, timeout=24)
