param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [string]$CodexPath
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$source = Get-Item -LiteralPath $InputPath
$outputDirectory = Split-Path -Parent $OutputPath
$outputName = Split-Path -Leaf $OutputPath
$promptPath = Join-Path $outputDirectory "subtitle-translation-prompt.tmp"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Get-SrtTimings {
    param([string]$Path)

    $text = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    $matches = [regex]::Matches(
        $text,
        '(?m)^\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,.]\d{3}\s*$'
    )

    return @($matches | ForEach-Object { $_.Value.Trim() })
}

function Test-TranslatedSrt {
    param(
        [string]$SourcePath,
        [string]$TargetPath
    )

    if (-not (Test-Path -LiteralPath $TargetPath)) {
        return $false
    }

    $targetText = [System.IO.File]::ReadAllText($TargetPath, [System.Text.Encoding]::UTF8)

    if ($targetText -notmatch '[\u3400-\u9fff]') {
        return $false
    }

    $sourceTimings = @(Get-SrtTimings -Path $SourcePath)
    $targetTimings = @(Get-SrtTimings -Path $TargetPath)

    if ($sourceTimings.Count -eq 0 -or $sourceTimings.Count -ne $targetTimings.Count) {
        return $false
    }

    for ($index = 0; $index -lt $sourceTimings.Count; $index++) {
        if ($sourceTimings[$index] -ne $targetTimings[$index]) {
            return $false
        }
    }

    return $true
}

if (Test-TranslatedSrt -SourcePath $source.FullName -TargetPath $OutputPath) {
    Write-Host "Chinese subtitle already exists: $OutputPath"
    exit 0
}

if ([string]::IsNullOrWhiteSpace($CodexPath)) {
    throw "Codex is required to create a missing or invalid Chinese subtitle."
}

$prompt = @"
Translate the SRT subtitle file "$($source.Name)" into natural Simplified Chinese.

Requirements:
- Write the completed translation to "$outputName" in this directory.
- Preserve every cue number and timestamp exactly and in the original order.
- Keep a one-to-one cue structure; do not merge, split, delete, or add cues.
- Translate dialogue and meaningful on-screen text only.
- Keep names, place names, shop names, and food names accurate. On first occurrence,
  retain a useful original spelling when it prevents ambiguity.
- Use concise Chinese suitable for subtitles, not an essay or commentary.
- Output a valid UTF-8 SRT file with no Markdown fences or explanatory text.
- Do not modify any other file.

Read the full source file, write the target file, and verify its cue count and timestamps.
"@

[System.IO.File]::WriteAllText($promptPath, $prompt, $utf8NoBom)

if (Test-Path -LiteralPath $OutputPath) {
    Remove-Item -LiteralPath $OutputPath -Force
}

Push-Location -LiteralPath $outputDirectory

try {
    $command = '"{0}" exec --skip-git-repo-check --approve-for-me --ephemeral - < "{1}"' -f `
        $CodexPath,
        (Split-Path -Leaf $promptPath)
    & cmd.exe /d /s /c $command
    $codexExitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}

if ($codexExitCode -ne 0) {
    throw "Codex subtitle translation failed with exit code: $codexExitCode"
}

if (-not (Test-TranslatedSrt -SourcePath $source.FullName -TargetPath $OutputPath)) {
    throw "Translated subtitle failed SRT timing or Chinese-text validation: $OutputPath"
}

Remove-Item -LiteralPath $promptPath -Force -ErrorAction SilentlyContinue
Write-Host "Chinese subtitle: $OutputPath"
