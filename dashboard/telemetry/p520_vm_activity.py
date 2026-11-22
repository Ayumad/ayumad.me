"""Normalize running QEMU guests' resource readings from Proxmox."""

import json
import math


PVE_VM_ACTIVITY_COMMAND = """
echo "---VM-ACTIVITY---"
pvesh get /cluster/resources --type vm --output-format json 2>/dev/null
"""


def percent(value):
    if type(value) in (int, float) and math.isfinite(value) and 0 <= value <= 1:
        return round(value * 100, 1)
    return None


def pve_vm_activity(lines, checked_at):
    marker = "---VM-ACTIVITY---"
    if marker not in lines:
        return {}
    try:
        rows = json.loads("\n".join(lines[lines.index(marker) + 1:]))
    except ValueError:
        return {}
    if not isinstance(rows, list):
        return {}
    activity = {}
    for vm in rows:
        if not isinstance(vm, dict) or vm.get("type") != "qemu" or vm.get("status") != "running":
            continue
        vm_id, used, capacity = vm.get("vmid"), vm.get("mem"), vm.get("maxmem")
        if type(vm_id) is not int:
            continue
        ram = percent(used / capacity) if type(used) is int and type(capacity) is int and capacity > 0 else None
        cpu = percent(vm.get("cpu"))
        if cpu is not None or ram is not None:
            activity[vm_id] = {"source": "proxmox", "checked_at": checked_at, "cpu_pct": cpu, "mem_pct": ram}
    return activity
