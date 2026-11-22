"""Normalize measured resources and confirmed jobs for running QEMU guests."""

import json
import math


PVE_VM_ACTIVITY_COMMAND = """
echo "---VM-ACTIVITY---"
pvesh get /cluster/resources --type vm --output-format json 2>/dev/null
echo "---VM-JOBS---"
pvesh get "/nodes/$(hostname -s)/tasks" --source active --output-format json 2>/dev/null
"""

JOB_LABELS = {
    "vzdump": "Proxmox backup",
    "qmigrate": "VM migration",
    "qmsnapshot": "VM snapshot",
    "qmdelsnapshot": "Removing VM snapshot",
    "qmclone": "Cloning VM",
    "qmmove": "Moving VM disk",
}


def percent(value):
    if type(value) in (int, float) and math.isfinite(value) and 0 <= value <= 1:
        return round(value * 100, 1)
    return None


def pve_vm_activity(lines, checked_at):
    marker = "---VM-ACTIVITY---"
    if marker not in lines:
        return {}
    readings = lines[lines.index(marker) + 1:]
    jobs = {}
    if "---VM-JOBS---" in readings:
        jobs_start = readings.index("---VM-JOBS---")
        jobs = active_jobs(readings[jobs_start + 1:])
        readings = readings[:jobs_start]
    try:
        rows = json.loads("\n".join(readings))
    except ValueError:
        return {}
    if not isinstance(rows, list):
        return {}
    activity = {}
    for vm in rows:
        if not isinstance(vm, dict) or vm.get("type") != "qemu" or vm.get("status") != "running" or vm.get("template"):
            continue
        vm_id, used, capacity = vm.get("vmid"), vm.get("mem"), vm.get("maxmem")
        if type(vm_id) is not int:
            continue
        ram = percent(used / capacity) if type(used) is int and type(capacity) is int and capacity > 0 else None
        cpu = percent(vm.get("cpu"))
        if cpu is not None or ram is not None:
            activity[vm_id] = {"source": "proxmox", "checked_at": checked_at, "cpu_pct": cpu, "mem_pct": ram}
            if vm_id in jobs:
                activity[vm_id]["job"] = {"status": "running", "label": jobs[vm_id]}
    return activity


def active_jobs(lines):
    try:
        tasks = json.loads("\n".join(lines))
    except ValueError:
        return {}
    if not isinstance(tasks, list):
        return {}

    jobs = {}
    for task in tasks:
        if not isinstance(task, dict):
            continue
        vm_id = str(task.get("id", ""))
        label = JOB_LABELS.get(task.get("type"))
        start = task.get("starttime")
        if vm_id.isdecimal() and label and type(start) is int and not task.get("endtime"):
            vm_id = int(vm_id)
            if vm_id not in jobs or start > jobs[vm_id][0]:
                jobs[vm_id] = (start, label)
    return {vm_id: label for vm_id, (_, label) in jobs.items()}


def add_media_activity(homelab, media_vm_id):
    """Attribute observed media activity only to its configured VM."""
    media = homelab.get("media", {})
    gpu = homelab.get("gpu", {})
    for guest in homelab.get("guests", []):
        activity = guest.get("activity")
        if guest.get("id") != media_vm_id or not activity:
            continue
        utilization = gpu.get("util_pct")
        if gpu.get("owner_vm") == media_vm_id and type(utilization) in (int, float) and 0 <= utilization <= 100:
            activity["gpu_pct"] = utilization
        if media.get("torrents_active", 0) > 0 and media.get("down_mbps", 0) > 0:
            activity.setdefault("job", {"status": "running", "label": "Downloading torrents"})
