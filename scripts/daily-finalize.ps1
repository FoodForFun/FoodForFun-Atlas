param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$VideoFolder,

    [string]$CodexPath = "codex"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ($CodexPath -eq "codex") {
    $codexCommand = Get-Command codex.cmd -ErrorAction SilentlyContinue
    if ($null -eq $codexCommand) {
        throw "codex.cmd was not found in PATH."
    }
    $CodexPath = $codexCommand.Source
}

$VideoFolder = (Resolve-Path -LiteralPath $VideoFolder).Path
$previewPath = Join-Path $VideoFolder "review\editorial-preview.md"
$generatorPath = Join-Path $PSScriptRoot "daily-generate.ps1"
$intakePath = Join-Path $VideoFolder "intake.json"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path -LiteralPath $previewPath)) {
    throw "Approved editorial preview not found: $previewPath"
}

if (-not (Test-Path -LiteralPath $generatorPath)) {
    throw "Generator not found: $generatorPath"
}

& $generatorPath `
    -VideoFolder $VideoFolder `
    -CodexPath $CodexPath `
    -ApprovedEditorialPath $previewPath

if (Test-Path -LiteralPath $intakePath) {
    $intake = Get-Content -LiteralPath $intakePath -Raw -Encoding UTF8 | ConvertFrom-Json
    $intake.workflow.generation = "complete"
    $intake.workflow.atlas = "ready_to_import"
    $intake.status = "ready_for_atlas"
    $intake.updated_at = (Get-Date).ToString("o")
    [System.IO.File]::WriteAllText(
        $intakePath,
        ($intake | ConvertTo-Json -Depth 10),
        $utf8NoBom
    )
}

Write-Host "Final publishing files and atlas/publish-package.json generated after editorial approval."
