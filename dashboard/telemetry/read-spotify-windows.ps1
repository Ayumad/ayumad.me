param(
    [Parameter(Mandatory)]
    [ValidatePattern('^[\w.][\w.-]*@[\w.][\w.-]*$')]
    [string]$Hub
)

$ErrorActionPreference = 'Stop'

function Get-DesktopSpotifyPlayback {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime
    $managerType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType=WindowsRuntime]
    $metadataType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType=WindowsRuntime]
    $asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and
            $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
    } | Select-Object -First 1

    function Wait-MediaOperation($operation, $type) {
        $task = $asTask.MakeGenericMethod($type).Invoke($null, @($operation))
        if (-not $task.Wait(2500)) { throw 'Windows media session query timed out.' }
        $task.Result
    }

    $manager = Wait-MediaOperation ($managerType::RequestAsync()) $managerType
    foreach ($session in $manager.GetSessions()) {
        if ($session.SourceAppUserModelId -notmatch 'Spotify') { continue }
        $status = $session.GetPlaybackInfo().PlaybackStatus.ToString()
        if ($status -notin @('Playing', 'Paused')) { continue }
        $media = Wait-MediaOperation ($session.TryGetMediaPropertiesAsync()) $metadataType
        if (-not $media.Title) { continue }
        return @{
            title = $media.Title
            artist = $media.Artist
            album = $media.AlbumTitle
            playing = $status -eq 'Playing'
        }
    }
}

$playback = Get-DesktopSpotifyPlayback
$sample = @{
    sampled_at = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    spotify = $playback
}
$sample | ConvertTo-Json -Compress | & ssh.exe -T -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=6 -o ServerAliveInterval=4 -o ServerAliveCountMax=2 $Hub 'python3 "$HOME/.hermes/scripts/machine_resource_feed.py" creekwood --playback-only'
exit $LASTEXITCODE
