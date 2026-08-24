param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$VideoFolder,

    [string]$CodexPath = "codex"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if (-not (Test-Path -LiteralPath $VideoFolder)) {
    throw "Video folder not found: $VideoFolder"
}

$VideoFolder = (Resolve-Path -LiteralPath $VideoFolder).Path
$inputPath = Join-Path $VideoFolder "transcript\copy-input.md"
$copyPath = Join-Path $VideoFolder "copy\social-cn.md"
$weiboPath = Join-Path $VideoFolder "copy\weibo-cn.md"
$xiaohongshuBilibiliPath = Join-Path $VideoFolder "copy\xiaohongshu-bilibili-cn.md"
$extractedPath = Join-Path $VideoFolder "atlas\extracted.json"
$atlasPath = Join-Path $VideoFolder "atlas\atlas-entry.md"
$promptPath = Join-Path $VideoFolder "metadata\codex-prompt.tmp"
$thumbnail = Get-ChildItem -LiteralPath (Join-Path $VideoFolder "metadata") -File -Filter "*.jpg" | Select-Object -First 1
$thumbnailRelative = if ($thumbnail) { "../metadata/$($thumbnail.Name)" } else { "" }
$markdownBreak = "  "

if (-not (Test-Path -LiteralPath $inputPath)) {
    throw "Generation input not found: $inputPath"
}

$inputText = [System.IO.File]::ReadAllText(
    $inputPath,
    [System.Text.Encoding]::UTF8
)

if ([string]::IsNullOrWhiteSpace($inputText)) {
    throw "Generation input is empty."
}

$prompt = @"
You are running the FoodForFun Daily YouTube Intake v2 editorial step.

Use ONLY the supplied source material. Never invent or silently infer facts.
Unknown or ambiguous values must remain empty and be listed under items_to_verify.
Preserve names, addresses, dates, prices, quantities, food names, and meaningful human details exactly.
When SOURCE MATERIAL contains user-confirmed editorial corrections, treat those
corrections as authoritative and prefer them over conflicting metadata or subtitles.

SOURCE MATERIAL
============================================================
$inputText
============================================================

Create exactly these FIVE UTF-8 files relative to the current working directory:

1. atlas/extracted.json
2. copy/social-cn.md
3. atlas/atlas-entry.md
4. copy/weibo-cn.md
5. copy/xiaohongshu-bilibili-cn.md

Do not modify any source asset.

FILE 1: atlas/extracted.json
------------------------------------------------------------
Write valid JSON using this schema:
{
  "youtube_id": "",
  "youtube_url": "",
  "source_title": "",
  "source_channel": "",
  "published_at": "",
  "original_language": "",
  "places": [
    {
      "name": "",
      "address": "",
      "city": "",
      "region": "",
      "country": "",
      "notes": ""
    }
  ],
  "people": [
    { "name": "", "role": "", "notes": "" }
  ],
  "foods": [
    { "name": "", "price": "", "notes": "" }
  ],
  "shop_history": "",
  "local_context": "",
  "story_points": [],
  "items_to_verify": [],
  "status": "draft"
}

Use empty strings or empty arrays for unknown fields. status must be "draft".
Create one places item for every distinct shop or location supported by the source.

FILE 2: copy/social-cn.md
------------------------------------------------------------
Write one finished master FoodForFun post in natural Simplified Chinese. It must
closely follow this layout and be ready to copy, edit, or publish:

# 地区 | 菜品或故事亮点、菜品或故事亮点、菜品或故事亮点

Write one compact paragraph for each shop or story stop. Start them naturally
as “第一站在……”, “第二站是……”, and “最后一站到了……” when there are three stops.
Prioritize the food's preparation, texture, people, history, useful quantities,
and local meaning. Include seating or operating details only when they materially
help the story; do not turn the post into a chronological shift log. Bold only one
key fact or technique per stop. Close with a short comparison that connects the stops.

频道：$markdownBreak
频道名

店名：$markdownBreak
每行一个店名

地址：$markdownBreak
每行一个 fully supported address, in the same order as the shops

文案整理：ChatGPT

如果你喜欢世界各地真实的小店故事，欢迎关注 FoodForFun。

通过食物了解人，通过人了解世界。

小红书 / Bilibili：$markdownBreak
#标签 #标签

微博：$markdownBreak
#标签# #标签#

Style rules:
- FoodForFun theme: 通过食物了解人，通过人了解世界。
- Story-driven, informative, restrained, and culturally respectful.
- Prefer concrete facts to generic adjectives.
- Do not write a mechanical video summary or translate subtitles line by line.
- Avoid exaggerated marketing language.
- Avoid “让我们一起”, “不容错过”, and “绝对值得一试”.
- Do not repeatedly say “视频中”.
- Use exact, appetizing food names. Never turn “半只炸鸡” into the vague or
  inaccurate “一只鸡”.
- Match the reference layout above exactly; do not add title alternatives, an
  information card, review notes, a source URL, or any other section.
- Keep the ENTIRE file, including title, shop information, credit, closing lines,
  and hashtags, between approximately 550 and 750 Chinese characters.
- Choose only the strongest facts. Remove secondary menu items, routine operating
  details, repeated explanations, and decorative conclusions.
- Omit any uncertain address entirely rather than printing a placeholder.
- Include any address explicitly supplied under user-confirmed editorial corrections.
- Do not copy example facts into another video's post; the layout and voice are
  the template, while every fact must come from SOURCE MATERIAL.

FILE 3: atlas/atlas-entry.md
------------------------------------------------------------
Create an editorial draft suitable for manual entry into FoodForFun Atlas.
Start with YAML front matter containing:

title, slug, subtitle, summary, seo_title, seo_description, tags, status,
source_type, source_title, source_channel, source_url, source_published_at,
original_language, cover_image, primary_place, address, city, region, country

Rules:
- status must be draft.
- source_type must be youtube_video.
- cover_image must be $thumbnailRelative.
- tags must be a YAML list.
- Quote YAML string values safely.
- Keep seo_title concise and factual.
- Keep seo_description factual and useful; do not keyword-stuff.

After the front matter, use these sections:

# Summary
# Story
# Atlas Insight
# People
# Foods
# Local Context
# Source
# Editorial Review

The Source section must include the canonical YouTube URL and channel.
The Editorial Review section must list items that need human verification.

FILE 4: copy/weibo-cn.md
------------------------------------------------------------
Write a finished Simplified Chinese Weibo post that can be copied and published as-is.
Use the same title, condensed narrative, shop/channel/address block, ChatGPT credit,
FoodForFun follow line, and closing slogan as copy/social-cn.md.

Requirements:
- Preserve the '# 地区 | ...' title and limited bold emphasis from the master copy.
- Keep the ENTIRE file between approximately 550 and 750 Chinese characters.
- Preserve the most useful shop, person, food, number, and local-context facts.
- If the source covers multiple shops, name each shop clearly.
- Do not include facts listed as uncertain or unsupported.
- Any value that appears in items_to_verify must be omitted from this publishable file.
- Do not include the Xiaohongshu/Bilibili label or tags.
- End with 8 to 12 relevant Weibo hashtags using #话题# syntax, including #FoodForFun#.

FILE 5: copy/xiaohongshu-bilibili-cn.md
------------------------------------------------------------
Write one finished Simplified Chinese version suitable for both a Xiaohongshu post
and a Bilibili description. It must be ready to copy and publish as-is.

Use the same '# 地区 | ...' title, condensed narrative, shop/channel/address block,
ChatGPT credit, FoodForFun follow line, and closing slogan as copy/social-cn.md.

Requirements:
- Keep the ENTIRE file between approximately 550 and 750 Chinese characters.
- Story-driven but restrained; no exaggerated marketing language.
- Preserve concrete preparation details, people, history, prices, and quantities when supported.
- If the source covers multiple shops, include all of them.
- Do not expose editorial uncertainty inside the publishing copy; simply omit unsupported facts.
- Any value that appears in items_to_verify must be omitted from this publishable file.
- If an address contains a conflict, duplication, or suspected transcription error, include the shop name but omit that address entirely.
- Do not write calls to action such as “快去打卡” or “一定要去”.
- Do not include the Weibo label or tags.
- End with 8 to 12 relevant hashtags using normal #话题 format, including #FoodForFun.

Actually write all five files now.
"@

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($promptPath, $prompt, $utf8NoBom)

foreach ($outputPath in @(
    $copyPath,
    $weiboPath,
    $xiaohongshuBilibiliPath,
    $extractedPath,
    $atlasPath
)) {
    if (Test-Path -LiteralPath $outputPath) {
        Remove-Item -LiteralPath $outputPath -Force
    }
}

Push-Location -LiteralPath $VideoFolder

try {
    $command = '"{0}" exec --skip-git-repo-check --approve-for-me --ephemeral - < "metadata\codex-prompt.tmp"' -f $CodexPath
    & cmd.exe /d /s /c $command
    $codexExitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}

if ($codexExitCode -ne 0) {
    throw "Codex failed with exit code: $codexExitCode. Prompt kept at $promptPath"
}

foreach ($outputPath in @(
    $copyPath,
    $weiboPath,
    $xiaohongshuBilibiliPath,
    $extractedPath,
    $atlasPath
)) {
    if (
        -not (Test-Path -LiteralPath $outputPath) -or
        (Get-Item -LiteralPath $outputPath).Length -eq 0
    ) {
        throw "Codex did not create a usable output: $outputPath"
    }
}

try {
    $extractedText = [System.IO.File]::ReadAllText(
        $extractedPath,
        [System.Text.Encoding]::UTF8
    )
    $extracted = $extractedText | ConvertFrom-Json

    if ($extracted.status -ne "draft") {
        throw "status must be draft"
    }

    if ($null -eq $extracted.places) {
        throw "places must be an array"
    }
}
catch {
    throw "atlas/extracted.json is invalid: $($_.Exception.Message)"
}

$copyText = [System.IO.File]::ReadAllText(
    $copyPath,
    [System.Text.Encoding]::UTF8
)
$atlasText = [System.IO.File]::ReadAllText(
    $atlasPath,
    [System.Text.Encoding]::UTF8
)

foreach ($publishPath in @($copyPath, $weiboPath, $xiaohongshuBilibiliPath)) {
    $publishText = [System.IO.File]::ReadAllText(
        $publishPath,
        [System.Text.Encoding]::UTF8
    )

    if ($publishText.Length -lt 500 -or $publishText.Length -gt 850) {
        throw "Publish copy must stay near 600 characters: $publishPath ($($publishText.Length))"
    }
}

foreach ($requiredText in @(
    "# ",
    "频道：",
    "店名：",
    "地址：",
    "文案整理：ChatGPT",
    "如果你喜欢世界各地真实的小店故事，欢迎关注 FoodForFun。",
    "通过食物了解人，通过人了解世界。",
    "小红书 / Bilibili：",
    "微博："
)) {
    if (-not $copyText.Contains($requiredText)) {
        throw "copy/social-cn.md is missing: $requiredText"
    }
}

if (
    -not $atlasText.StartsWith("---") -or
    -not $atlasText.Contains("# Story") -or
    -not $atlasText.Contains("# Source") -or
    -not $atlasText.Contains("# Editorial Review")
) {
    throw "atlas/atlas-entry.md is missing required front matter or sections."
}

Remove-Item -LiteralPath $promptPath -Force

Write-Host "Generated:"
Write-Host $copyPath
Write-Host $weiboPath
Write-Host $xiaohongshuBilibiliPath
Write-Host $extractedPath
Write-Host $atlasPath
