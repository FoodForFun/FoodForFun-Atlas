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
$inputPath = Join-Path $VideoFolder "transcript\copy-input.md"
$overridesPath = Join-Path $VideoFolder "metadata\editorial-overrides.md"
$reviewDir = Join-Path $VideoFolder "review"
$previewPath = Join-Path $reviewDir "editorial-preview.md"
$promptPath = Join-Path $VideoFolder "metadata\codex-review-prompt.tmp"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

New-Item -ItemType Directory -Force -Path $reviewDir | Out-Null

if (-not (Test-Path -LiteralPath $inputPath)) {
    throw "Generation input not found: $inputPath"
}

$sourceText = [System.IO.File]::ReadAllText($inputPath, [System.Text.Encoding]::UTF8)
$overridesText = if (Test-Path -LiteralPath $overridesPath) {
    [System.IO.File]::ReadAllText($overridesPath, [System.Text.Encoding]::UTF8)
}
else {
    "无"
}

$prompt = @"
Create a FoodForFun title-and-content review draft from the supplied source.
Do not create final publishing files, Atlas files, JSON, SEO, or platform hashtags.

Write exactly one UTF-8 file: review/editorial-preview.md

Use this structure:

# 待确认标题

# 地点 | 具体动作、食物画面或关键数字

# 待确认正文

Three or four concise natural Chinese paragraphs, approximately 450-650 Chinese
characters total. The first paragraph briefly establishes the shop, location, people,
and core food offering. Do not narrate the source channel, filming, or production
process. The remaining paragraphs focus on food, preparation, taste, ingredients,
regional context, and supported quantities. Avoid keyword piles and generic promotion.
Use the FoodForFun title rhythm: a concrete location followed by an action and a vivid
food image, such as “凌晨2点45开工，300日元便当喂饱一群卡车司机”. Do not copy
example facts. Use only facts supported below. Mark no uncertainties in publishing text;
omit them.

SOURCE
============================================================
$sourceText
============================================================

LATEST USER CORRECTIONS
============================================================
$overridesText
============================================================

This is only a review draft. The user must confirm title and content before final files.
"@

[System.IO.File]::WriteAllText($promptPath, $prompt, $utf8NoBom)

if (Test-Path -LiteralPath $previewPath) {
    Remove-Item -LiteralPath $previewPath -Force
}

Push-Location -LiteralPath $VideoFolder
try {
    $command = '"{0}" exec --skip-git-repo-check --approve-for-me --ephemeral - < "metadata\codex-review-prompt.tmp"' -f $CodexPath
    & cmd.exe /d /s /c $command
    $codexExitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}

if ($codexExitCode -ne 0) {
    throw "Codex review drafting failed with exit code: $codexExitCode"
}

if (-not (Test-Path -LiteralPath $previewPath)) {
    throw "Codex did not create editorial preview: $previewPath"
}

$previewText = [System.IO.File]::ReadAllText($previewPath, [System.Text.Encoding]::UTF8)
if (
    $previewText -notmatch '(?m)^# 待确认标题\s*$' -or
    $previewText -notmatch '(?m)^# 待确认正文\s*$'
) {
    throw "Editorial preview has an invalid structure: $previewPath"
}

Write-Host "Editorial approval required: $previewPath"
