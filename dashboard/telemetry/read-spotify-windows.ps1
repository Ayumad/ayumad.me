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
