"""Translate measured Proxmox resources and confirmed jobs into dashboard samples."""

from math import isfinite


def percentage(used, total):
    if not all(isinstance(value, (int, float)) and isfinite(value) for value in (used, total)):
        return None
    if not 0 <= used <= total or total <= 0:
        return None
    return round(100 * used / total, 1)


def attach_activity(homelab, resources, tasks, stack, checked_at, media_vm_id):
    if not isinstance(resources, list) or not isinstance(tasks, list):
        return

    usage = {
        str(vm["vmid"]): vm
        for vm in resources
        if vm.get("vmid") is not None and vm.get("type") == "qemu"
        and vm.get("status") == "running" and not vm.get("template")
    }
    job_labels = {
        "vzdump": "Proxmox backup",
        "qmigrate": "VM migration",
        "qmsnapshot": "VM snapshot",
        "qmdelsnapshot": "Removing VM snapshot",
        "qmclone": "Cloning VM",
        "qmmove": "Moving VM disk",
    }
    jobs = {
        str(task["id"]): job_labels[task["type"]]
        for task in sorted(tasks, key=lambda task: task.get("starttime", 0))
        if task.get("id") is not None and task.get("type") in job_labels
        and not task.get("endtime")
    }
    media = homelab.get("media", {})
    if media.get("torrents_active", 0) and media.get("down_mbps", 0) > 0:
        jobs.setdefault(str(media_vm_id), "Downloading torrents")

    gpu = stack.get("gpu") or {}
    for guest in homelab.get("guests", []):
        vmid = guest.get("id")
        resource = usage.get(str(vmid))
        if guest.get("type") != "qemu" or guest.get("status") != "running" or resource is None:
            continue

        cpu = percentage(resource.get("cpu"), 1)
        memory = percentage(resource.get("mem"), resource.get("maxmem"))
        gpu_pct = None
        if vmid == media_vm_id == homelab.get("gpu_owner_vm"):
            gpu_pct = percentage(gpu.get("util_pct"), 100)
        label = jobs.get(str(vmid))
        guest["activity"] = {
            "checked_at": checked_at,
            "cpu_pct": cpu,
            "mem_pct": memory,
            "gpu_pct": gpu_pct,
            "job": {"status": "running", "label": label} if label else None,
        }
