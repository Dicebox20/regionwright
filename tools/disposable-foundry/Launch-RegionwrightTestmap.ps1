$ErrorActionPreference = 'Stop'

$foundryExe = 'C:\Program Files\Foundry Virtual Tabletop\Foundry Virtual Tabletop.exe'
$dataPath = 'C:\Users\rujie\AppData\Local\Temp\RegionwrightPointBoardDisposable-20261018-GMFlow'
$worldId = 'regionwright-testmap'
$hostName = '127.0.0.1'
$port = 30002
$chromeDevShortcutPath = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Chrome for Testing Dev\Chrome DevTools.lnk'

$worldManifestPath = Join-Path $dataPath "Data\worlds\$worldId\world.json"
if (-not (Test-Path -LiteralPath $foundryExe)) { throw "Foundry executable not found: $foundryExe" }
if (-not (Test-Path -LiteralPath $worldManifestPath)) { throw "Disposable world not found: $worldManifestPath" }
if (-not (Test-Path -LiteralPath $chromeDevShortcutPath)) { throw "Chrome DevTools shortcut not found: $chromeDevShortcutPath" }

$worldManifest = Get-Content -LiteralPath $worldManifestPath -Raw | ConvertFrom-Json
if ($worldManifest.id -ne $worldId) { throw "World manifest ID mismatch: expected $worldId, found $($worldManifest.id)" }

$shell = New-Object -ComObject WScript.Shell
$chromeShortcut = $shell.CreateShortcut($chromeDevShortcutPath)
if (-not (Test-Path -LiteralPath $chromeShortcut.TargetPath)) { throw "Chrome for Testing Dev executable not found: $($chromeShortcut.TargetPath)" }
$profileMatch = [regex]::Match($chromeShortcut.Arguments, '--user-data-dir=(?:"([^"]+)"|(\S+))')
if (-not $profileMatch.Success) { throw 'Chrome DevTools shortcut does not identify its existing browser profile.' }
$chromeProfile = if ($profileMatch.Groups[1].Success) { $profileMatch.Groups[1].Value } else { $profileMatch.Groups[2].Value }
if (-not (Test-Path -LiteralPath $chromeProfile)) { throw "Chrome Dev profile not found: $chromeProfile" }

function Test-DisposableFoundryProcess {
    param([object]$ProcessInfo)
    if (-not $ProcessInfo) { return $false }
    return $ProcessInfo.CommandLine.Replace('/', '\').Contains($dataPath)
}

$listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
$existingCloneProcesses = Get-CimInstance Win32_Process -Filter "Name = 'Foundry Virtual Tabletop.exe'" | Where-Object { Test-DisposableFoundryProcess $_ }
$foundryPid = $null

if ($listener) {
    $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
    if (-not $owner -or $owner.Name -ne 'Foundry Virtual Tabletop.exe' -or -not (Test-DisposableFoundryProcess $owner)) {
        throw "Port $port is occupied by a process other than this disposable Foundry clone; refusing to attach."
    }
    $foundryPid = $owner.ProcessId
} elseif ($existingCloneProcesses) {
    $foundryPid = ($existingCloneProcesses | Select-Object -First 1).ProcessId
} else {
    $foundryArgs = @(
        "--dataPath=$($dataPath -replace '\\','/')"
        "--port=$port"
        "--world=$worldId"
        '--noupnp'
        "--hostname=$hostName"
    )
    $started = Start-Process -FilePath $foundryExe -ArgumentList $foundryArgs -PassThru
    $foundryPid = $started.Id
    Write-Host "Started disposable Foundry process $foundryPid for $worldId."
}

$deadline = (Get-Date).AddSeconds(90)
do {
    Start-Sleep -Milliseconds 500
    $listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    $foundryProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $foundryPid" -ErrorAction SilentlyContinue
    if ($listener) {
        $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
        if (-not $owner -or $owner.Name -ne 'Foundry Virtual Tabletop.exe' -or -not (Test-DisposableFoundryProcess $owner)) {
            throw "Port $port was claimed by a process other than this disposable Foundry clone."
        }
        $foundryPid = $owner.ProcessId
        break
    }
    if (-not $foundryProcess) { throw 'The disposable Foundry process exited before the server became ready.' }
} while ((Get-Date) -lt $deadline)

if (-not $listener) { throw "Disposable Foundry did not begin listening on port $port within 90 seconds." }

Start-Sleep -Seconds 2
$url = "http://${hostName}:$port/"
# Keep Chrome for Testing Dev and its existing profile, but do not inherit the
# Start Menu shortcut's auto-open-DevTools flag. Docked DevTools reduced the
# Foundry viewport below its 1024px minimum during the last launch.
$chromeShortcutArgs = [regex]::Replace(
    $chromeShortcut.Arguments,
    '(?i)(^|\s)--auto-open-devtools-for-tabs(?=\s|$)',
    '$1'
).Trim()
$chromeArgs = "$chromeShortcutArgs --new-window $url"
Start-Process -FilePath $chromeShortcut.TargetPath -ArgumentList $chromeArgs | Out-Null

Write-Host "Foundry is listening for $worldId at $url (PID $foundryPid)."
Write-Host 'Opened the existing Chrome for Testing Dev profile with DevTools enabled.'
