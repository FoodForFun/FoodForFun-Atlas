# FoodForFun 每日 YouTube 入库工具

这个工具把每日 YouTube 内容采集和编辑初稿合并成一次运行。它复用项目现有的 `yt-dlp`、FFmpeg 和 Codex CLI，不引入新的项目依赖。文案生成分成“预览确认”和“定稿输出”两个阶段。

脚本会在自己的 `yt-dlp` 调用中禁用用户目录里的第三方插件，避免失效的本地 PO Token/bgutil 服务阻塞日常下载；这不会修改或删除用户安装的插件。

## 日常使用

在项目根目录运行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\daily-youtube.ps1 "https://www.youtube.com/watch?v=VIDEO_ID"
```

也可以双击 `scripts\daily-youtube.cmd`，然后粘贴一个 YouTube URL。第一阶段会在标题和正文预览生成后停止，不会提前生成发布文件。

## 自动完成的工作

1. 读取 YouTube metadata；
2. 下载最高不超过 4K 的视频；
3. 优先下载简体或繁体中文字幕，并额外保留日文/原文字幕；
4. 下载最高质量封面并转换为 JPG；
5. 清洗主字幕，移除时间码、标签和相邻重复行；
6. 提取地点、人物、食物、价格、店铺历史和当地背景；
7. 只生成标题和约 600 字正文的编辑预览，等待人工确认；
8. 确认后生成 FoodForFun 中文社交媒体文案；
9. 确认后生成可直接复制发布的微博版与小红书/B站共用版；
10. 确认后生成 Atlas Markdown 草稿和结构化 JSON，所有不确定信息留空或进入待核实列表。

## 标题与内容确认

第一阶段完成后，先检查：

```text
review\editorial-preview.md
```

它只包含“待确认标题”和“待确认正文”。需要修改时，先讨论并直接修订这个文件；只有在标题和正文明确确认后，才运行定稿脚本：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\daily-finalize.ps1 -VideoFolder "E:\FoodForFun\Daily\<视频目录>"
```

日常协作时，用户只需回复“确认”或“定稿”，由 Codex 完成定稿步骤，不需要手工复制多段命令。

## 输出目录

每个视频固定输出到 `E:\FoodForFun\Daily\<生成日期>_<简略原视频名>_<video_id>\`。例如：

```text
2026-08-22_無限に続く超絶揚げ物ラッシュ_lyqp0M9FC1A\
```

同一视频以后再次运行时会继续使用首次创建的目录，不会因日期变化重复下载。完整结构为：

```text
<生成日期>_<简略原视频名>_<video_id>\
├── intake.json
├── video\
│   └── <简略原视频名>.mkv
├── subtitles\
│   ├── subtitle.zh-Hans.srt
│   └── subtitle.ja.srt
├── metadata\
│   ├── info.json
│   ├── description.txt
│   ├── source-url.txt
│   ├── editorial-overrides.md（可选，保存人工确认的修正）
│   └── <简略原视频名>.jpg
├── transcript\
│   ├── transcript.txt
│   └── copy-input.md
├── review\
│   └── editorial-preview.md（先确认标题和正文）
├── copy\
│   ├── social-cn.md
│   ├── weibo-cn.md
│   └── xiaohongshu-bilibili-cn.md
└── atlas\
    ├── extracted.json
    └── atlas-entry.md
```

同一个 URL 再次运行时会复用已存在的视频、封面和字幕，并重新生成编辑预览。下载中断后可以直接运行同一条命令续传。未经确认，不会生成或覆盖 `copy` 与 `atlas` 下的最终文案文件。

如果人工确认了原始简介或字幕中的错误，可以把修正写入 `metadata\editorial-overrides.md`。后续重跑会优先采用这些修正，不会被原始 metadata 覆盖。

## 依赖

- `yt-dlp`
- FFmpeg（支持 PATH，或 WinGet 的 `yt-dlp.FFmpeg` 安装位置）
- 已登录的 Codex CLI

如只想下载并准备素材、暂时不生成文案，可以添加 `-SkipGeneration`。

## 编辑边界

所有 AI 生成内容都保持 `draft` 状态。发布前需要人工核对店名、地址、人物姓名、价格、历史信息、地点公开精度和来源权利状态。
