# FoodForFun Atlas — Story 发布使用说明

本说明面向负责录入、审核和发布内容的管理员。它描述如何通过网站后台完成一篇 Story 的完整发布流程，不需要直接编辑数据库。

## 1. 发布流程概览

```text
登录后台
  → 准备 Source
  → 准备 Place
  → 准备 Theme
  → 创建 Story 草稿
  → 建立三类连接
  → 私密预览
  → 提交审核
  → 批准
  → Publisher 完成 MFA
  → 发布或定时发布
  → 检查公开页面
```

后台入口：`https://food-for-fun-atlas.vercel.app/admin/login`

界面按钮目前使用英文。本说明会同时写出对应的英文按钮名称。

## 2. 开始前需要具备什么

- 一个已经登录的 Supabase Auth 账号。
- 一条有效的 editorial membership。
- 创建或编辑 Place、Theme 需要 Editor 或 Publisher 角色。
- 正式发布需要 Publisher 角色，并且当前会话达到 AAL2。
- 手机上安装可生成六位验证码的 TOTP authenticator。

不要把密码、TOTP 验证码、二维码或 MFA setup secret 发到 GitHub Issue、聊天、截图或日志中。

## 3. 创建并审核 Source

1. 登录后打开 **Sources**。
2. 选择 **Create Source**。
3. 至少填写：
   - **Source type**：使用小写英文和下划线，例如 `youtube_video`；
   - **Original title**：原始资料标题。
4. 建议同时填写 Source URL、Publisher、原始发布时间、语言和简介。
5. **Availability** 不应是 `Unavailable` 或 `Removed`；发布前应确认资料确实可用。
6. 选择 **Create Source**。如果系统提示可能重复，先检查已有记录，再决定是否确认保留为独立 Source。
7. 打开刚创建的 Source，在 private details 中填写或检查：
   - Raw transcript；
   - Cleaned transcript；
   - Transcript quality；
   - Processing status；
   - Rights status；
   - Rights note 和必要的内部说明。
8. 选择 **Save private details**。

Story 发布时，所有已连接 Source 都必须完成 rights review。可接受的 Rights status 是：

- `Permission Granted`
- `Licensed`
- `Public Domain`
- `Fair Use`
- `Cleared`

其中必须有且只能有一个 Source 被连接为 **Primary**。

## 4. 创建并检查 Place

1. 打开 **Places**，选择 **Create Place**。
2. 填写 Place name 和 slug；slug 使用小写英文、数字与单个连字符。
3. 根据需要填写 Place type、两位 Country code 和 Parent Place。
4. 选择 **Public location precision**：
   - `Exact`
   - `Neighborhood`
   - `City`
   - `Region`
   - `Hidden`
5. 只有非 Hidden 精度可以保存坐标；纬度与经度必须同时填写。
6. 如果选择 Exact，发布前必须勾选地点与精度已经过编辑审核。
7. 选择 **Create Place**。

每一个连接到 Story 的 Place 都必须设置经过审查的公开位置精度。Story 必须有且只能有一个 **Primary Place**。

## 5. 创建并检查 Theme

1. 打开 **Themes**，选择 **Create Theme**。
2. 填写 Theme name 和 slug；可选填 Theme group 与 Description。
3. 选择 **Create Theme**。
4. 确认准备用于发布的 Theme 处于 Active 状态。

每篇发布的 Story 至少需要连接一个未删除且处于 Active 状态的 Theme。

## 6. 创建 Story 草稿

1. 打开 **Stories**。
2. 选择 **Create Story draft**。
3. 必填字段是：
   - Title
   - Slug
   - Summary
   - Body
4. Slug 使用小写英文、数字与单个连字符，例如 `why-kfc-stayed-out-of-norway`。
5. Body 使用纯文本；段落之间留一个空行。
6. 可选填写 Subtitle、Atlas insight、Original language、SEO title、SEO description 和公开的 HTTP(S) Cover image URL。
7. 选择 **Create draft**。之后修改内容时使用 **Save Story**。

看到 **Unsaved changes** 时不要直接离开页面。保存成功并重新加载后，页面会显示数据库管理的最新版本号。

## 7. 建立 Source、Place 和 Theme 连接

打开 Story 编辑页中的 **Sources, Places, and Themes**。

### Sources

1. 在 Sources 区域选择已有 Source。
2. 将唯一的主要资料设置为 Source role `Primary`。
3. 其他资料可以使用 Supporting、Context 或 Fact Check。
4. 填写 Display order，然后选择 **Add connection**。

### Places

1. 在 Places 区域选择已有 Place。
2. 选择 Place relationship，例如 Featured、Origin、Setting 或 Mentioned。
3. 对主要地点勾选 **Primary Place**。
4. 填写 Display order，然后选择 **Add connection**。

### Themes

1. 在 Themes 区域选择已有 Theme。
2. 选择 Theme relevance。
3. 填写 Display order，然后选择 **Add connection**。

同一 Story 只能有一个 Primary Source 和一个 Primary Place。若要更换，先编辑旧连接并取消 Primary，再把新连接设为 Primary。

## 8. 私密预览与审核

1. 在 Story 编辑页选择私密 Preview 链接。
2. 检查标题、摘要、正文、图片、Sources、Places、Themes 和相关链接。
3. 返回编辑页修正问题并保存。
4. 草稿完成后选择 **Submit for review**。
5. Editor 或 Publisher 检查内容后选择 **Approve Story**。

状态顺序是：

```text
Draft → Needs Review → Approved → Published
```

需要返工时，可使用 **Return to draft** 或 **Return to review**。

## 9. 完成 MFA 并发布

正式发布只能由 Publisher 在 AAL2 会话中完成。

1. 打开后台的 MFA 状态页。
2. 如果尚未绑定 authenticator，通过 **Enroll** 页面扫描二维码并验证一次六位验证码。
3. 如果已经绑定，通过 **Challenge** 页面输入当前六位验证码，使会话达到 AAL2。
4. 返回状态为 Approved 的 Story。
5. 在 Story transitions 中选择 **Publish or schedule**。
6. 填写 UTC 发布时间：
   - 当前或过去时间：立即公开；
   - 未来时间：定时公开。
7. 阅读并勾选发布确认框。
8. 再次选择 **Publish or schedule**。

发布按钮不会绕过数据库检查。发布前必须同时满足：

- Title、Slug、Summary 和 Body 完整；
- 恰好一个未删除的 Primary Source；
- 每个 Source 都可用并已完成允许发布的 rights review；
- 恰好一个未删除的 Primary Place；
- 每个 Place 都有经过审查的安全 location precision；
- 至少一个 Active、未删除的 Theme；
- 当前账号是 Publisher，当前会话为 AAL2；
- 已填写 UTC 发布时间并明确确认发布。

## 10. 发布后检查

1. 打开 `/stories/<slug>`，确认 Story 可公开访问。
2. 检查 `/stories` 卡片、首页和 Primary Place 链接。
3. 打开相关 Place 与 Theme 页面，确认能返回该 Story。
4. 使用 Search 搜索标题、摘要、Place 或 Theme。
5. 如果地点允许公开并具备地图条件，检查 Map。
6. 用手机和电脑各检查一次正文、导航和外部 Source 链接。

## 11. 常见问题

### 看不到 Publish or schedule

通常表示 Story 尚未 Approved，当前账号不是 Publisher，或当前会话仍为 AAL1。先完成审核和 MFA challenge。

### 系统提示 Story 没有通过 workflow checks

依次检查必填正文、Primary Source、Source rights、Primary Place、Place location precision 和 Active Theme。

### 系统提示内容在打开后已改变

这是并发保护。重新加载页面，核对最新版本，再重新保存；不要尝试覆盖新版本。

### 出现 duplicate warning

先搜索并检查已有 Source、Place 或 Theme。只有确认它确实是不同记录时，才勾选重复确认框继续。

### 已发布 Story 需要暂时撤下

Publisher 在 AAL2 会话中使用 **Unpublish Story**，Story 会回到 Approved。长期移出公开内容可使用 **Archive Story**。不要直接删除数据库记录。

### 已发布内容需要修正

Publisher 必须在 AAL2 会话中编辑，并勾选“修改将立即影响公开内容”的确认框。系统会保留先前修订记录。

## 12. 安全原则

- 永远通过 Admin 后台操作，不直接编辑 Production 数据表。
- 不使用 service-role key，不把密钥放进浏览器或文档。
- 不分享密码、登录链接、MFA QR、setup secret 或验证码。
- 不把未经审核的精确地点公开。
- 不把私人 transcript、rights note 或 internal note 复制到公开 Story。
- 出现不确定的权限、状态或数据问题时先停止，不要反复提交或猜测修复。
