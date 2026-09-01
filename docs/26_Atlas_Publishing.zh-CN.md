# Atlas 一键发布与多地区视频源

## 目标流程

每日 YouTube 入库完成、中文文案经人工确认后，`daily-finalize.ps1` 会生成
`atlas/publish-package.json`，并把 intake 状态标记为 `ready_for_atlas`。Publisher
在后台 `/admin/stories/import` 粘贴该文件，完成 MFA 后使用 **Publish package to
Atlas** 一次性导入结构化数据并发布。

导入操作复用现有 Story、Source、Place、Theme 和关系表，不创建平行内容系统。
系统会按 `source_type + external_id` 或 URL 复用 Source，按 slug 复用 Place 与
Theme。新内容以 Approved 状态写入；随后仍由现有 `transition_story_status` RPC
完成 `approved → published`。若最终发布检查失败，Story 保留为 Approved，便于
编辑后从原 Story 页面执行 **Publish to Atlas**，不会出现半公开页面。

## 发布前强制检查

- 中英文标题、摘要和正文分别保存，均不能为空；
- 至少一个 tag；
- 一个主 Place，并通过 Place 层级表达国家、城市、行政区/街区和店铺；
- 至少一个 Theme；`theme_group` 用于 `cuisine`、`food`、`content_topic` 分类；
- 至少一个 Source；原始 YouTube Source 必须同时有 canonical URL 和视频 ID；
- 店铺 Place 可保存街道地址、邮编、经纬度和公开精度；
- 发布仍要求 Publisher + AAL2，并继续使用现有 RLS、revision 和乐观锁边界。

## 中英文页面

公开 Story 右上角提供 `EN / 中文`。英文默认地址为 `/stories/[slug]`，中文为
`/stories/[slug]?lang=zh`。两者均由服务器直接输出独立标题、摘要、正文和 SEO
字段，不从嵌入视频即时生成，也不依赖浏览器 JavaScript 才能读取正文。

## 地区与视频 fallback

地区只读取服务器或 CDN 请求头，优先级为：

1. `x-vercel-ip-country`
2. `cf-ipcountry`
3. `cloudfront-viewer-country`
4. `x-country-code`

不读取浏览器 GPS。中文页面（`?lang=zh`）始终优先 Bilibili → Weibo → YouTube，
使中文阅读与播放器保持一致；英文页面则按地区选择：大陆 (`CN`) 是 Bilibili →
Weibo → YouTube，其他地区是 YouTube → Bilibili → Weibo。YouTube 与 Bilibili
有可验证视频 ID 时使用
隐私增强或官方播放器；Weibo 以及不能安全构造播放器的来源显示原站链接。
所有可用 fallback 始终可见，因此首选平台失效时页面仍有封面、独立正文和其他
来源入口。
