Option Explicit
If WScript.Arguments.Count <> 1 Then WScript.Quit 2

Dim shell, files, script, powershell, quote, command
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
script = files.BuildPath(files.GetParentFolderName(WScript.ScriptFullName), "read-spotify-windows.ps1")
powershell = shell.ExpandEnvironmentStrings("%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe")
quote = Chr(34)
command = quote & powershell & quote & " -NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -File " _
    & quote & script & quote & " -Hub " & quote & WScript.Arguments(0) & quote
WScript.Quit shell.Run(command, 0, True)
