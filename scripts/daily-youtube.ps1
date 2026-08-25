param(
    [Parameter(Position = 0)]
    [string]$Url,

    [string]$OutputRoot = "E:\FoodForFun\Daily",

    [switch]$SkipGeneration
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
    param([string]$Title)

    Write-Host ""
    Write-Host "============================================================"
    Write-Host $Title
    Write-Host "============================================================"
}

function Resolve-Tool {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    if ($Name -eq "codex") {
        $command = Get-Command "codex.cmd" -ErrorAction SilentlyContinue
    }
    else {
        $command = Get-Command $Name -ErrorAction SilentlyContinue
    }

    if ($command) {
        return $command.Source
    }

    if ($Name -eq "ffmpeg") {
        $wingetRoot = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"

        if (Test-Path -LiteralPath $wingetRoot) {
            $ffmpeg = Get-ChildItem `
                -LiteralPath $wingetRoot `
                -Directory `
                -Filter "yt-dlp.FFmpeg_*" `
                -ErrorAction SilentlyContinue |
                ForEach-Object {
                    Get-ChildItem `
                        -LiteralPath $_.FullName `
                        -Recurse `
                        -Filter "ffmpeg.exe" `
                        -File `
                        -ErrorAction SilentlyContinue
                } |
                Select-Object -First 1

            if ($ffmpeg) {
                return $ffmpeg.FullName
            }
        }
    }

    throw "Required tool not found: $Name"
}

function Add-UniqueLanguage {
    param(
        [System.Collections.Generic.List[string]]$Languages,
        [string]$Language
    )

    if (
        -not [string]::IsNullOrWhiteSpace($Language) -and
        -not $Languages.Contains($Language)
    ) {
        $Languages.Add($Language)
    }
}

function Find-FirstLanguage {
    param(
        [string[]]$Candidates,
        [hashtable]$Manual,
        [hashtable]$Automatic
    )

    foreach ($candidate in $Candidates) {
        if ($Manual.ContainsKey($candidate)) {
            return [pscustomobject]@{
                Language = $candidate
                Source = "manual"
            }
        }
    }

    foreach ($candidate in $Candidates) {
        if ($Automatic.ContainsKey($candidate)) {
            return [pscustomobject]@{
                Language = $candidate
                Source = "automatic"
            }
        }
    }

    return $null
}

function Convert-SrtToTranscript {
    param(
        [Parameter(Mandatory = $true)]
        [string]$InputPath,

        [Parameter(Mandatory = $true)]
        [string]$OutputPath
    )

    $cleanLines = New-Object System.Collections.Generic.List[string]

    foreach ($line in Get-Content -LiteralPath $InputPath -Encoding UTF8) {
        $text = $line.Trim()

        if (
            [string]::IsNullOrWhiteSpace($text) -or
            $text -match '^\d+$' -or
            $text -match '^\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,.]\d{3}'
        ) {
            continue
        }

        $text = $text -replace '<[^>]+>', ''
        $text = $text -replace '\{\\[^}]+\}', ''
        $text = [System.Net.WebUtility]::HtmlDecode($text).Trim()

        if ([string]::IsNullOrWhiteSpace($text)) {
            continue
        }

        if (
            $cleanLines.Count -eq 0 -or
            $cleanLines[$cleanLines.Count - 1] -ne $text
        ) {
            $cleanLines.Add($text)
        }
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines($OutputPath, $cleanLines, $utf8NoBom)
}

function Get-SafeShortTitle {
    param([string]$Title)

    $shortTitle = ([string]$Title).Normalize([Text.NormalizationForm]::FormKC).Trim()
    $parts = $shortTitle -split '[!！?？|｜【】\[\]]'
    $firstPart = $parts | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -First 1

    if ($firstPart) {
        $shortTitle = $firstPart.Trim()
    }

    foreach ($character in [System.IO.Path]::GetInvalidFileNameChars()) {
        $shortTitle = $shortTitle.Replace([string]$character, "-")
    }

    $shortTitle = $shortTitle -replace '_', '-'
    $shortTitle = $shortTitle -replace '\s+', ' '
    $shortTitle = $shortTitle.Trim(' ', '.', '-')

    if ($shortTitle.Length -gt 32) {
        $shortTitle = $shortTitle.Substring(0, 32).Trim(' ', '.', '-')
    }

    if ([string]::IsNullOrWhiteSpace($shortTitle)) {
        return "youtube-video"
    }

    return $shortTitle
}

if ([string]::IsNullOrWhiteSpace($Url)) {
    $Url = Read-Host "Paste one YouTube URL"
}

if ($Url -notmatch '^https?://') {
    throw "Please provide a valid YouTube URL."
}

Write-Step "FoodForFun Daily YouTube Intake v2"
Write-Host "URL: $Url"
Write-Host "Output root: $OutputRoot"

$ytDlp = Resolve-Tool -Name "yt-dlp"
$ffmpeg = Resolve-Tool -Name "ffmpeg"
$codex = $null

if (-not $SkipGeneration) {
    $codex = Resolve-Tool -Name "codex"
}

$ytBaseArgs = @(
    "--no-plugin-dirs",
    "--remote-components", "ejs:github",
    "--no-playlist"
)

Write-Step "[1/7] Reading YouTube metadata"

$metaJson = & $ytDlp @ytBaseArgs `
    --skip-download `
    --dump-single-json `
    $Url

if ($LASTEXITCODE -ne 0) {
    throw "Failed to read YouTube metadata."
}

$meta = $metaJson | ConvertFrom-Json
$videoId = $meta.id

if ([string]::IsNullOrWhiteSpace($videoId)) {
    throw "Unable to detect the YouTube video ID."
}

$canonicalUrl = "https://www.youtube.com/watch?v=$videoId"
$shortTitle = Get-SafeShortTitle -Title ([string]$meta.title)
$generationDate = (Get-Date).ToString("yyyy-MM-dd")
$folderName = "{0}_{1}_{2}" -f $generationDate, $shortTitle, $videoId
$newVideoFolder = Join-Path $OutputRoot $folderName
$legacyVideoFolder = Join-Path $OutputRoot $videoId

New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null

$existingVideoFolder = Get-ChildItem `
    -LiteralPath $OutputRoot `
    -Directory `
    -ErrorAction SilentlyContinue |
    Where-Object { $_.Name.EndsWith("_$videoId") } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if ($existingVideoFolder) {
    $videoFolder = $existingVideoFolder.FullName

    if ($existingVideoFolder.Name -match '^\d{4}-\d{2}-\d{2}_') {
        $generationDate = $existingVideoFolder.Name.Substring(0, 10)
    }
}
elseif (Test-Path -LiteralPath $legacyVideoFolder) {
    Move-Item -LiteralPath $legacyVideoFolder -Destination $newVideoFolder
    $videoFolder = $newVideoFolder
}
else {
    $videoFolder = $newVideoFolder
}

$videoDir = Join-Path $videoFolder "video"
$subtitleDir = Join-Path $videoFolder "subtitles"
$metadataDir = Join-Path $videoFolder "metadata"
$transcriptDir = Join-Path $videoFolder "transcript"
$copyDir = Join-Path $videoFolder "copy"
$atlasDir = Join-Path $videoFolder "atlas"

foreach ($directory in @(
    $videoDir,
    $subtitleDir,
    $metadataDir,
    $transcriptDir,
    $copyDir,
    $atlasDir
)) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$uploadDate = $meta.upload_date
$publishedAt = ""

if ($uploadDate -and $uploadDate.Length -eq 8) {
    $publishedAt = "{0}-{1}-{2}" -f `
        $uploadDate.Substring(0, 4),
        $uploadDate.Substring(4, 2),
        $uploadDate.Substring(6, 2)
}

[System.IO.File]::WriteAllText(
    (Join-Path $metadataDir "info.json"),
    $metaJson,
    $utf8NoBom
)
[System.IO.File]::WriteAllText(
    (Join-Path $metadataDir "description.txt"),
    [string]$meta.description,
    $utf8NoBom
)
[System.IO.File]::WriteAllText(
    (Join-Path $metadataDir "source-url.txt"),
    $canonicalUrl,
    $utf8NoBom
)

Write-Host "Video ID: $videoId"
Write-Host "Title: $($meta.title)"
Write-Host "Short title: $shortTitle"
Write-Host "Channel: $($meta.channel)"
Write-Host "Folder: $videoFolder"

Write-Step "[2/7] Selecting Chinese and original subtitles"

$manualSubs = @{}
$autoSubs = @{}

if ($meta.subtitles) {
    foreach ($property in $meta.subtitles.PSObject.Properties) {
        $manualSubs[$property.Name] = $true
    }
}

if ($meta.automatic_captions) {
    foreach ($property in $meta.automatic_captions.PSObject.Properties) {
        $autoSubs[$property.Name] = $true
    }
}

$selected = New-Object System.Collections.Generic.List[string]
$subtitleSources = @{}
$primary = Find-FirstLanguage `
    -Candidates @("zh-Hans", "zh-CN", "zh-SG", "zh", "zh-Hant", "zh-TW", "zh-HK") `
    -Manual $manualSubs `
    -Automatic $autoSubs

if ($primary) {
    Add-UniqueLanguage -Languages $selected -Language $primary.Language
    $subtitleSources[$primary.Language] = $primary.Source
}

$originalCandidates = New-Object System.Collections.Generic.List[string]
Add-UniqueLanguage -Languages $originalCandidates -Language ([string]$meta.language)

if (
    $manualSubs.ContainsKey("ja") -or
    $autoSubs.ContainsKey("ja")
) {
    Add-UniqueLanguage -Languages $originalCandidates -Language "ja"
}

foreach ($language in $originalCandidates) {
    if ($manualSubs.ContainsKey($language)) {
        Add-UniqueLanguage -Languages $selected -Language $language
        $subtitleSources[$language] = "manual"
    }
    elseif ($autoSubs.ContainsKey($language)) {
        Add-UniqueLanguage -Languages $selected -Language $language
        $subtitleSources[$language] = "automatic"
    }
}

if ($selected.Count -eq 0) {
    $fallback = Find-FirstLanguage `
        -Candidates @("en", "en-US", "en-GB") `
        -Manual $manualSubs `
        -Automatic $autoSubs

    if ($fallback) {
        Add-UniqueLanguage -Languages $selected -Language $fallback.Language
        $subtitleSources[$fallback.Language] = $fallback.Source
        $primary = $fallback
    }
}

if ($selected.Count -gt 0) {
    Write-Host "Subtitles: $($selected -join ', ')"
}
else {
    Write-Warning "No usable subtitles were found. Generation will use metadata only."
}

Write-Step "[3/7] Downloading video (best quality up to 4K)"

$videoPath = Get-ChildItem `
    -LiteralPath $videoDir `
    -File `
    -ErrorAction SilentlyContinue |
    Where-Object { $_.BaseName -in @($shortTitle, "video") -and $_.Extension -in @(".mkv", ".mp4", ".webm", ".mov") } |
    Select-Object -First 1

if ($videoPath -and $videoPath.BaseName -eq "video") {
    $renamedVideo = "{0}{1}" -f $shortTitle, $videoPath.Extension
    Rename-Item -LiteralPath $videoPath.FullName -NewName $renamedVideo
    $videoPath = Get-Item -LiteralPath (Join-Path $videoDir $renamedVideo)
}

if (-not $videoPath) {
    & $ytDlp @ytBaseArgs `
        --ffmpeg-location $ffmpeg `
        --format "bestvideo*[height<=2160]+bestaudio/best[height<=2160]" `
        --merge-output-format mkv `
        --embed-metadata `
        --output (Join-Path $videoDir "$shortTitle.%(ext)s") `
        $Url

    if ($LASTEXITCODE -ne 0) {
        throw "Video download failed."
    }

    $videoPath = Get-ChildItem `
        -LiteralPath $videoDir `
        -File |
        Where-Object { $_.BaseName -eq $shortTitle -and $_.Extension -in @(".mkv", ".mp4", ".webm", ".mov") } |
        Select-Object -First 1
}

if (-not $videoPath) {
    throw "The final video file was not found."
}

Write-Host "Video: $($videoPath.FullName)"

Write-Step "[4/7] Downloading thumbnail and subtitles"

$thumbnailPath = Join-Path $metadataDir "$shortTitle.jpg"
$legacyThumbnailPath = Join-Path $metadataDir "thumbnail.jpg"

if (
    -not (Test-Path -LiteralPath $thumbnailPath) -and
    (Test-Path -LiteralPath $legacyThumbnailPath)
) {
    Rename-Item -LiteralPath $legacyThumbnailPath -NewName "$shortTitle.jpg"
}

if (-not (Test-Path -LiteralPath $thumbnailPath)) {
    & $ytDlp @ytBaseArgs `
        --ffmpeg-location $ffmpeg `
        --skip-download `
        --write-thumbnail `
        --convert-thumbnails jpg `
        --output (Join-Path $metadataDir "$shortTitle.%(ext)s") `
        $Url

    if ($LASTEXITCODE -ne 0) {
        throw "Thumbnail download failed."
    }
}

$subtitleFiles = New-Object System.Collections.Generic.List[string]

foreach ($language in $selected) {
    $expectedSubtitle = Join-Path $subtitleDir "subtitle.$language.srt"

    if (-not (Test-Path -LiteralPath $expectedSubtitle)) {
        $subtitleArgs = @(
            "--skip-download",
            "--sub-langs", $language,
            "--sub-format", "srt/best",
            "--convert-subs", "srt",
            "--output", (Join-Path $subtitleDir "subtitle.%(ext)s")
        )

        if ($subtitleSources[$language] -eq "manual") {
            $subtitleArgs += "--write-subs"
        }
        else {
            $subtitleArgs += "--write-auto-subs"
        }

        & $ytDlp @ytBaseArgs `
            --ffmpeg-location $ffmpeg `
            @subtitleArgs `
            $Url

        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Subtitle download failed for $language."
        }
    }

    if (Test-Path -LiteralPath $expectedSubtitle) {
        $subtitleFiles.Add($expectedSubtitle)
    }
}

$hasChineseSubtitle = $false

foreach ($language in $selected) {
    if ($language -match '^zh(?:-|$)') {
        $hasChineseSubtitle = $true
        break
    }
}

if (-not $hasChineseSubtitle -and $primary) {
    $sourceSubtitle = Join-Path $subtitleDir "subtitle.$($primary.Language).srt"
    $translatedSubtitle = Join-Path $subtitleDir "subtitle.zh-Hans.srt"
    $translationScript = Join-Path $PSScriptRoot "daily-translate-subtitle.ps1"

    if (
        (Test-Path -LiteralPath $sourceSubtitle) -and
        ((Test-Path -LiteralPath $translatedSubtitle) -or -not $SkipGeneration)
    ) {
        Write-Host "No Chinese subtitle supplied by YouTube; translating $($primary.Language) to zh-Hans..."

        try {
            & $translationScript `
                -InputPath $sourceSubtitle `
                -OutputPath $translatedSubtitle `
                -CodexPath ([string]$codex)

            if (Test-Path -LiteralPath $translatedSubtitle) {
                Add-UniqueLanguage -Languages $selected -Language "zh-Hans"
                $subtitleSources["zh-Hans"] = "generated_translation"
                $subtitleFiles.Add($translatedSubtitle)
                $primary = [pscustomobject]@{
                    Language = "zh-Hans"
                    Source = "generated_translation"
                }
            }
        }
        catch {
            Write-Warning "Chinese subtitle translation failed; keeping the original subtitle. $($_.Exception.Message)"
        }
    }
}

Write-Step "[5/7] Cleaning the primary transcript"

$transcriptPath = Join-Path $transcriptDir "transcript.txt"
$primarySubtitlePath = $null

if ($primary) {
    $primarySubtitlePath = Join-Path $subtitleDir "subtitle.$($primary.Language).srt"
}

if ($primarySubtitlePath -and (Test-Path -LiteralPath $primarySubtitlePath)) {
    Convert-SrtToTranscript `
        -InputPath $primarySubtitlePath `
        -OutputPath $transcriptPath
}
else {
    [System.IO.File]::WriteAllText($transcriptPath, "", $utf8NoBom)
}

$copyInputPath = Join-Path $transcriptDir "copy-input.md"
$editorialOverridesPath = Join-Path $metadataDir "editorial-overrides.md"
$transcript = [System.IO.File]::ReadAllText(
    $transcriptPath,
    [System.Text.Encoding]::UTF8
)
$editorialOverrides = if (Test-Path -LiteralPath $editorialOverridesPath) {
    [System.IO.File]::ReadAllText($editorialOverridesPath, [System.Text.Encoding]::UTF8)
}
else {
    "无"
}
$copyInput = @"
# FoodForFun Daily Copy Input

## YouTube URL

$canonicalUrl

## YouTube ID

$videoId

## Source title

$($meta.title)

## Short title

$shortTitle

## Thumbnail asset

metadata/$shortTitle.jpg

## Channel

$($meta.channel)

## Published

$publishedAt

## Original language

$($meta.language)

## Downloaded subtitle languages

$($selected -join ", ")

## Description

$($meta.description)

## User-confirmed editorial corrections

$editorialOverrides

## Cleaned transcript

$transcript
"@
[System.IO.File]::WriteAllText($copyInputPath, $copyInput, $utf8NoBom)

Write-Step "[6/7] Writing intake manifest"

$subtitleAssets = @()

foreach ($subtitleFile in $subtitleFiles) {
    $subtitleAssets += "subtitles/$([System.IO.Path]::GetFileName($subtitleFile))"
}

$intake = [ordered]@{
    version = "2.0"
    source = "youtube"
    youtube_id = $videoId
    youtube_url = $canonicalUrl
    title = $meta.title
    short_title = $shortTitle
    generated_date = $generationDate
    channel = $meta.channel
    channel_id = $meta.channel_id
    published_at = $publishedAt
    original_language = $meta.language
    duration_seconds = $meta.duration
    assets = [ordered]@{
        video = "video/$($videoPath.Name)"
        thumbnail = if (Test-Path -LiteralPath $thumbnailPath) { "metadata/$shortTitle.jpg" } else { $null }
        metadata = "metadata/info.json"
        description = "metadata/description.txt"
        source_url = "metadata/source-url.txt"
        editorial_overrides = if (Test-Path -LiteralPath $editorialOverridesPath) { "metadata/editorial-overrides.md" } else { $null }
        transcript = "transcript/transcript.txt"
        copy_input = "transcript/copy-input.md"
        social_copy = "copy/social-cn.md"
        weibo_copy = "copy/weibo-cn.md"
        xiaohongshu_bilibili_copy = "copy/xiaohongshu-bilibili-cn.md"
        extracted = "atlas/extracted.json"
        atlas_draft = "atlas/atlas-entry.md"
        subtitles = $subtitleAssets
    }
    subtitle = [ordered]@{
        primary_language = if ($primary) { $primary.Language } else { $null }
        languages = @($selected)
        sources = $subtitleSources
    }
    workflow = [ordered]@{
        download = "complete"
        generation = if ($SkipGeneration) { "skipped" } else { "pending" }
    }
    status = if ($SkipGeneration) { "download_complete" } else { "ready_for_generation" }
    updated_at = (Get-Date).ToString("o")
}

$intakePath = Join-Path $videoFolder "intake.json"
[System.IO.File]::WriteAllText(
    $intakePath,
    ($intake | ConvertTo-Json -Depth 10),
    $utf8NoBom
)

if (-not $SkipGeneration) {
    Write-Step "[7/7] Extracting facts and generating both drafts"
    $generatorPath = Join-Path $PSScriptRoot "daily-generate.ps1"

    if (-not (Test-Path -LiteralPath $generatorPath)) {
        throw "Generator not found: $generatorPath"
    }

    & $generatorPath -VideoFolder $videoFolder -CodexPath $codex

    if ($LASTEXITCODE -ne 0) {
        throw "Content generation failed."
    }

    $intake.workflow.generation = "complete"
    $intake.status = "complete"
    $intake.updated_at = (Get-Date).ToString("o")
    [System.IO.File]::WriteAllText(
        $intakePath,
        ($intake | ConvertTo-Json -Depth 10),
        $utf8NoBom
    )
}

Write-Step "DONE"
Write-Host "Everything is in:"
Write-Host $videoFolder
Write-Host ""
Write-Host "Daily use:"
Write-Host "  .\scripts\daily-youtube.ps1 `"$canonicalUrl`""
