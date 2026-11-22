param(
    [Parameter(Mandatory)]
    [ValidatePattern('^[\w.][\w.-]*@[\w.][\w.-]*$')]
    [string]$Hub,
    [ValidateRange(1, 2)]
    [int]$Samples = 1
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'read-spotify-windows.ps1')

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class DashboardDesktopActivity {
    [StructLayout(LayoutKind.Sequential)]
    struct InputInfo { public uint size; public uint tick; }

    [DllImport("user32.dll")]
    static extern bool GetLastInputInfo(ref InputInfo value);

    [DllImport("kernel32.dll")]
    static extern uint GetTickCount();

    [DllImport("user32.dll")]
    static extern IntPtr OpenInputDesktop(uint flags, bool inherit, uint access);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    static extern bool GetUserObjectInformation(IntPtr handle, int index, StringBuilder name, uint size, out uint needed);

    [DllImport("user32.dll")]
    static extern bool CloseDesktop(IntPtr handle);

    public static long? IdleMilliseconds() {
        var value = new InputInfo { size = (uint)Marshal.SizeOf(typeof(InputInfo)) };
        return GetLastInputInfo(ref value) ? (long?)unchecked(GetTickCount() - value.tick) : null;
    }

    public static bool IsUnlocked() {
        const uint readObjects = 1;
        const int nameIndex = 2;
        var desktop = OpenInputDesktop(0, false, readObjects);
        if (desktop == IntPtr.Zero) return false;
        try {
            var name = new StringBuilder(128);
            uint needed;
            return GetUserObjectInformation(desktop, nameIndex, name, 256, out needed)
                && string.Equals(name.ToString(), "Default", StringComparison.OrdinalIgnoreCase);
        } finally {
            CloseDesktop(desktop);
        }
    }
}
'@

function Send-MachineSample([bool]$IncludePlayback) {
    $processors = @(Get-CimInstance Win32_Processor -OperationTimeoutSec 4)
    $load = ($processors | Measure-Object -Property LoadPercentage -Average).Average
    $memory = Get-CimInstance Win32_OperatingSystem -OperationTimeoutSec 4
    $gpu = $null
    $nvidia = Get-Command nvidia-smi.exe -ErrorAction SilentlyContinue
    if ($nvidia) {
        $readings = @(& $nvidia.Source --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>$null)
        $valid = @($readings | ForEach-Object { if ($_.Trim() -match '^\d+$') { [int]$_.Trim() } })
        if ($valid.Count -gt 0) { $gpu = ($valid | Measure-Object -Maximum).Maximum }
    }
    $now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $idle = [DashboardDesktopActivity]::IdleMilliseconds()
    $sample = @{
        sampled_at = $now
        last_input_at = if ($null -ne $idle) { $now - $idle } else { $null }
        unlocked = [DashboardDesktopActivity]::IsUnlocked()
        cpu_pct = $load
        gpu_pct = $gpu
        memory_pct = if ($memory.TotalVisibleMemorySize -gt 0) {
            [Math]::Round(100 * (1 - $memory.FreePhysicalMemory / $memory.TotalVisibleMemorySize), 1)
        } else { $null }
    }
    if ($IncludePlayback) {
        try { $sample.spotify = Get-DesktopSpotifyPlayback } catch {
            Write-Verbose 'Spotify desktop metadata could not be read.'
        }
    }
    $sample | ConvertTo-Json -Compress | & ssh.exe -T -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=6 -o ServerAliveInterval=4 -o ServerAliveCountMax=2 $Hub 'python3 "$HOME/.hermes/scripts/machine_resource_feed.py" creekwood'
    if ($LASTEXITCODE -ne 0) { throw "Hermes could not receive the workstation sample (SSH exit $LASTEXITCODE)." }
}

$cycle = [Diagnostics.Stopwatch]::StartNew()
$failed = $false
for ($index = 0; $index -lt $Samples; $index++) {
    $wait = 30 * $index - $cycle.Elapsed.TotalSeconds
    if ($wait -gt 0) { Start-Sleep -Milliseconds ([int]($wait * 1000)) }
    try { Send-MachineSample ($index -eq 0) } catch {
        Write-Error -ErrorRecord $_ -ErrorAction Continue
        $failed = $true
    }
}
if ($failed) { exit 1 }
