# FoodForFun 每日 YouTube 入库工具

这个工具把每日 YouTube 内容采集和初稿生成合并成一次运行。它复用项目现有的 `yt-dlp`、FFmpeg 和 Codex CLI，不引入新的项目依赖。

## 日常使用

在项目根目录运行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\daily-youtube.ps1 "https://www.youtube.com/watch?v=VIDEO_ID"
```

也可以双击 `scripts\daily-youtube.cmd`，然后粘贴一个 YouTube URL。运行过程中不需要再复制其他命令。

## 自动完成的工作

1. 读取 YouTube metadata；
2. 下载最高不超过 4K 的视频；
3. 优先下载简体或繁体中文字幕，并额外保留日文/原文字幕；
4. 下载最高质量封面并转换为 JPG；
5. 清洗主字幕，移除时间码、标签和相邻重复行；
6. 提取地点、人物、食物、价格、店铺历史和当地背景；
7. 生成 FoodForFun 中文社交媒体文案；
8. 生成 Atlas Markdown 草稿和结构化 JSON，所有不确定信息留空或进入待核实列表。

## 输出目录

每个视频固定输出到 `E:\FoodForFun\Daily\<video_id>\`：

```text
<video_id>\
├── intake.json
├── video\
│   └── video.mkv
├── subtitles\
│   ├── subtitle.zh-Hans.srt
│   └── subtitle.ja.srt
├── metadata\
│   ├── info.json
│   ├── description.txt
│   ├── source-url.txt
│   └── thumbnail.jpg
├── transcript\
│   ├── transcript.txt
│   └── copy-input.md
├── copy\
│   └── social-cn.md
└── atlas\
    ├── extracted.json
    └── atlas-entry.md
```

同一个 URL 再次运行时会复用已存在的视频、封面和字幕，并重新生成文案草稿。下载中断后可以直接运行同一条命令续传。

## 依赖

- `yt-dlp`
- FFmpeg（支持 PATH，或 WinGet 的 `yt-dlp.FFmpeg` 安装位置）
- 已登录的 Codex CLI

如只想下载并准备素材、暂时不生成文案，可以添加 `-SkipGeneration`。

## 编辑边界

所有 AI 生成内容都保持 `draft` 状态。发布前需要人工核对店名、地址、人物姓名、价格、历史信息、地点公开精度和来源权利状态。
