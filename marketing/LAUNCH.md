# 30 天上线与获客计划

产品已经有了，**赚钱的分界线在分发**：90% 的人做完了工具，然后没有一个人知道它存在。
下面这份是按"一个人、零预算、每天 1–2 小时"写的。

---

## 先把预期说清楚

- 第一个月卖 0–5 单是**正常**的。这类小工具不是暴富路径，是"睡后收入的地板"。
- 真正决定成败的不是功能，是**你能不能持续把链接放到目标人群眼前 30 天**。
- 唯一能保证的负结果：东西做完不上线，或者发 3 条帖就放弃。
- 单量跑起来后的现实天花板：$300–2000/月（靠 SEO 长尾 + 一次爆帖），做得好可以再往上。

---

## 第 0 步：三个必做的前置（1–2 小时）

1. 域名或 Netlify 子域名上线（`app.netlify.com/drop` 拖进去就有）
2. Gumroad 商品建好，**先自己买一单**，确认邮件里能拿到 zip 和授权码
3. 落地页 `CHECKOUT` 链接替换成真实链接，重新 `build.ps1`

> 上线前唯一要额外加的：一个**不用注册就能马上玩**的入口（现有免费版已经满足）。
> 这类工具靠"我试了一下真的有用"成交，不靠文案。

---

## 第 1 周：先让 10 个真人用上（不要发 Product Hunt）

目标：拿到 10 个真实使用反馈，修掉 3 个最蠢的问题。

| 天 | 动作 |
|---|---|
| D1 | 发 3 条 X/Twitter（见下方文案 A），带 15 秒录屏 |
| D2 | r/privacy、r/sysadmin 各发 1 条（文案 B），**先读版规**，只发"免费工具"，不要提钱 |
| D3 | 知乎回答 2 个"如何安全使用 ChatGPT 处理公司数据"类问题（文案 C） |
| D4 | 小红书发 2 篇（文案 D），封面用截图 |
| D5 | V2EX「分享创造」节点发 1 帖（中文圈转化最高的免费渠道之一） |
| D6 | 给 20 家小律所/诊所/财税公司发邮件（文案 E），每天 10 封别群发 |
| D7 | 看数据：谁来了、卡在哪一步，改落地页第一屏 |

---

## 文案 A｜X / Twitter（英文）

> Companies want to use ChatGPT on customer data. Legal says no.
>
> So I built a redactor that runs **entirely in your browser** — one HTML file, no upload, works offline.
>
> Paste → strip emails/phones/ID numbers/cards/keys → keep the mapping → restore afterwards.
>
> Free, no signup: [link]

## 文案 B｜Reddit（英文，禁止硬广的语气）

> Title: I made a browser-local PII redactor so I could paste tickets into Claude without leaking them
>
> My team wanted to use an LLM for support triage, but our DPO (reasonably) refused to let customer
> data go to a third party. Online redaction tools all upload the file, which defeats the purpose.
>
> So it's a single HTML file that does it in the tab: regex + Luhn as a confidence signal for cards, plus context rules for
> Chinese names/addresses. No network calls at all — you can check the Network tab.
>
> Placeholders are reversible ([EMAIL_1] → real address), so you can re-personalise the LLM answer.
>
> Free version is here if it's useful to anyone: [link] — happy to hear what it misses, false
> negatives are the part I care about.

## 文案 C｜知乎 / 公众号（中文）

标题：**把客户数据喂给 ChatGPT 之前，先把这几类信息抹掉**

> 先说结论：直接粘客户工单给大模型，等于把姓名、手机号、身份证号、订单号一起交出去。
> 三种处理方式：① 干脆不用（业务吃亏）② 上企业级 DLP（贵、重、推不动）③ 本地脱敏后再发。
>
> 我做了第三种：一个 13 KB 的网页文件，双击打开就能用，断网也能用，全程不上传。
> 手机号、身份证、银行卡（Luhn 只作参考，宁可多抹）、邮箱、IP、API Key 都能识别；
> 中文姓名和地址靠"姓名：/客户/地址："这类上下文抓。
> 关键是可以**还原**：脱敏后的文本给 AI，AI 的回答再把占位符换回真名真号。
>
> 免费版够用：[link]

## 文案 D｜小红书

> 标题：别再直接把客户信息粘进 ChatGPT 了‼️
> 正文：3 张图 —— ① 原图（打码前） ② 脱敏后 ③ 一键还原
> 「公司不让传数据给 AI？这个离线小工具做完脱敏再发，全程不上传、断网能用。
> 手机号身份证银行卡都能抹，还能一键还原回来。评论区自取🔗」

## 文案 E｜冷邮件（小律所/诊所/财税，每天 10 封）

> Subject: 客户信息交给 AI 前的脱敏小工具
>
> 您好，冒昧打扰。很多同行想用 AI 整理咨询记录，但客户信息不能外传。
> 我们做了一个本地脱敏工具：在浏览器里把姓名、手机、身份证、卡号替换成占位符，
> 数据不出本机（断网可用），处理完还能一键还原。
> 附免费版链接，不收费，如果您觉得有用再考虑专业版。[link]

---

## 第 2–4 周：把一次性流量变成搜索流量

工具类产品真正的复利在 SEO——但关键词必须选**有人搜、竞争小**的长尾。

| 关键词（低竞争，优先写） | 意图 |
|---|---|
| redact pii before chatgpt | 极强 |
| offline pdf/text redaction tool | 强 |
| anonymize customer data for AI | 强 |
| 脱敏 后 再 用 ChatGPT / 身份证 脱敏 工具 | 强 |
| csv pii scrubber | 中 |
| gdpr safe chatgpt prompts | 中 |

**写 3 篇就够，每篇一个关键词，2000 字，结尾放免费版链接：**
1. `How to safely use ChatGPT with customer data (without uploading it)`
2. `Redacting Chinese PII: 身份证 / 手机号 / 地址 detection rules that actually work`
3. `CSV PII scrubbing before LLM analysis: a spreadsheet-safe workflow`

每篇发在：自己的站（主）+ Medium / dev.to（同步）+ 知乎（中文改写）。

---

## 第 3–4 周：放大一次

- **Product Hunt**：等有 20+ 真实用户、3 条好评后再发，标题
  `RedactLocal – Redact PII before it reaches ChatGPT, 100% offline`
- **Show HN**：`Show HN: Browser-local PII redactor for AI workflows (single HTML file)`
  ——单文件、无依赖、隐私，是 HN 喜欢的叙事，一天内发，8:00 ET 左右
- **Hacker News 之外**：IndieHackers、r/SideProject、r/privacy 二次跟进（有更新再发，别刷）

---

## 转化率参考（用来判断哪里坏了）

| 指标 | 健康值 | 不达标意味着 |
|---|---|---|
| 落地页 → 试用 | 25–40% | 第一屏没说清"解决什么" |
| 试用 → 撞到 5000 字上限 | 15–25% | 上限太低或用户只是路过 |
| 撞上限 → 付费 | 3–8% | 价格/信任问题，加退款承诺和"断网可验" |

一个月 1000 访问 ≈ 300 试用 ≈ 40 撞墙 ≈ **1–3 单**。这就是为什么必须持续发内容，而不是发一次。

---

## 每周只做三件事（守住精力）

1. 发 5 条内容（2 英文 + 3 中文）
2. 回所有评论和邮件（前 20 个用户是产品经理）
3. 修 1 个真实用户提出的漏检规则

**不要做的事**：加功能、做 App、做订阅体系、等"完美了再发"。这四件事是这类项目最常见的死法。

---

## 配图与收款（已经做好了）

**小红书图卡**：`promo/xhs-1.png` ~ `xhs-4.png`，1080×1440，顺序别乱：

| 张 | 内容 | 作用 |
|---|---|---|
| 1 | 别再把客户信息粘进 ChatGPT | 钩子，决定点不点开 |
| 2 | 12 类信息一次命中（原文 vs 脱敏） | 证明有用 |
| 3 | 抹掉 ≠ 用不了（可还原） | 打消"脱敏后 AI 就没法用"的疑虑 |
| 4 | 三步 + 13 KB + ¥129 | 转化 + 筛掉白嫖党 |

文案里不要再写"评论区自取"如果会限流——改成"主页简介"或让对方私信关键词，按你账号的实际情况选。

**国内收款**：别用微信个人收款码收经营款（违反微信支付规则，被风控钱和客户一起丢）。
用爱发电 / 面包多 / 知识星球（个人可注册、平台代收、能开票），把收款码截图丢进
`cn/assets/wechat-qr.png`，落地页会自动显示。

**英文 SEO 长文**：`content/` 下三篇，直接发自己站，再同步到 Medium / dev.to。
中文对应版本建议改写而不是直译——中文读者更吃"踩坑 + 具体规则"的写法。

---

## 如果只能做一件事

去发 10 条帖子，而不是再改一行代码。产品的边际收益已经很低了，
分发才是现在唯一还有杠杆的地方。
