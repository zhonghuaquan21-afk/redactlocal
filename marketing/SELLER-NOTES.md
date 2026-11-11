# RedactLocal — 一个可以真的卖起来的小产品

> 定位：**把客户隐私从文本/表格里抹掉，再交给 ChatGPT。全部在浏览器本地完成，不上传任何数据。**
> 卖点不是"我有 AI"，而是"你的数据不用离开电脑"——这是大厂工具做不到、也是企业最愿意付钱的那一句话。

已经做完的东西：

| 文件 | 作用 |
|---|---|
| [index.html](index.html) | 完整可用产品（免费版 + Pro 解锁，单文件、零依赖、离线可用） |
| [landing.html](landing.html) | 销售落地页（含定价表、FAQ、转化文案） |
| [build.ps1](build.ps1) | 打包付费交付物 → `dist/RedactLocal-Pro-v1.0.0.zip`（13 KB） |
| [tools/genkey.js](tools/genkey.js) | 离线授权码生成器（自己留着，别公开） |
| [samples/customers.csv](samples/customers.csv) | 测试用样例数据 |

实测通过：12 类敏感信息识别、四种替换模式（占位符 / 打码 / 哈希 / 删除）、
CSV 批量处理、映射表导出、**逐字符精确还原**、离线授权码校验。

---

## 为什么这个能卖

1. **痛点是硬的**：公司想用大模型，法务/合规不让传客户数据。这个矛盾现在到处都是。
2. **竞品结构不利**：在线工具（iLovePDF 之类）要上传文件，正好踩雷；企业 DLP 又贵又重。
   一个 13 KB、断网能用、双击就开的文件，是最容易被"批准"的形态。
3. **成本是零**：没有服务器、没有 API 费、没有数据库。卖出去多少都是毛利。
4. **可复购形态清晰**：$29 一次性买断 + $149 团队包，不需要说服客户订阅。

---

## 30 分钟上线清单

1. **改 3 个 URL**（就这三处，别漏）
   - `index.html` 顶部：`const BUY_URL = "...";` → 你的收款链接
   - `landing.html` 底部：`const CHECKOUT = { pro: "...", team: "..." }`
2. **部署免费版**（用来引流，必须有免费版才有流量）
   - 最快：把 `index.html`、`landing.html`、`shots/` 拖到 <https://app.netlify.com/drop>，30 秒得到一个网址
   - 或者 GitHub Pages / Vercel，都是免费
3. **建商品**
   - 海外：Gumroad / Lemon Squeezy（个人可注册，无需公司，自动发邮件 + 自动发货）
   - 国内：爱发电 / 知识星球 / 独立站 + 微信收款码（￥129，人工发码）
   - 商品文件就传 `dist/RedactLocal-Pro-v1.0.0.zip`
4. **配自动发货**：Gumroad 的 "Content" 里放 zip + 一段说明，付款后自动发送；授权码用 `node tools/genkey.js` 批量生成，粘到邮件模板里
5. **自己走一遍完整流程**：用真实支付买一次 → 收到 zip → 打开 → 粘贴授权码 → 确认 Pro 生效。这一步不能跳。

> 改完 `BUY_URL` 记得重新跑一次 `powershell -ExecutionPolicy Bypass -File build.ps1`，
> 否则卖出去的 zip 里买的还是旧链接。

---

## 授权码怎么发

```bash
node tools/genkey.js        # 生成 1 个： RL-MCKZ-FU9B-0QHF
node tools/genkey.js 20     # 一次生成 20 个，分给一批买家
node tools/genkey.js --check RL-MCKZ-FU9B-0QHF   # 校验
```

- 格式 `RL-AAAA-BBBB-CCCC`，第 3 段是校验位，**离线校验、不联网、不建库**
- 一个买家用一个码即可（没有强制一码一机，别为这个增加支持成本）
- `tools/genkey.js` 里的 `SECRET` 与 `index.html` 里的 `LICENSE_SECRET` 必须一致
- ⚠️ 这是"防君子"级别：有人扒开 JS 就能绕过。$29 的产品不值得上服务端授权，
  真要防盗版就卖"Pro 独立打包版"（把免费限制代码直接删掉单独打包），成本最低效果最好

---

## 定价建议（别卖便宜）

| 档位 | 价格 | 理由 |
|---|---|---|
| Free | $0 | 5000 字符上限，够体验、不够干活 → 制造升级动机 |
| Pro | **$29 一次性** | 一杯咖啡的两倍，B 端报销不需要审批 |
| Team | **$149 / 10 人** | 锚定效应：让 $29 显得便宜 |

国内版建议 ¥129 / ¥499 —— 不要定 9.9，低价吸引来的客户支持成本最高。

---

## 国内版（已做完）

```bash
node build-cn.js        # 从 index.html 生成 cn/index.html（19 处替换，失败会报错）
powershell -ExecutionPolicy Bypass -File build.ps1   # 打包 EN + CN 两个 zip
```

- **单一真相源**：`index.html` 是唯一源文件，国内版是生成出来的，改功能只改一处
- `build-cn.js` 里每一处替换都是「找不到就报错退出」，防止改了源文件而国内版悄悄过期
- 国内版：锁定中文、隐藏语言切换、￥129 定价、授权码说明改成微信发码
- 交付物：`dist/RedactLocal-CN-Pro-v1.0.0.zip`

### ⚠️ 收款方式（这条很重要，别踩坑）

**不要用微信个人收款码收经营款。** 微信支付规则明确禁止个人收款码用于经营性收款，
被风控会限制收款功能，钱和客户一起丢。

个人能立刻用的合规路径，按推荐度排序：

1. **爱发电 / 面包多 / 知识星球**：平台代收，个人可注册，自动或半自动发货，可开发票
2. **个体户 / 公司主体**：接微信支付商户号或支付宝当面付，抽成低但要走注册流程
3. **第三方发卡平台**（如 Lemon Squeezy 国际版）：能吃海外卡，国内体验一般

落地页 `cn/landing.html` 里已经做好了「扫码付款 → 备注微信 → 30 分钟发码」的流程，
把 `cn/assets/wechat-qr.png` 换成你的收款码截图即可（现在没图会自动显示占位提示）。
同时记得改 `cn/landing.html` 底部的 `CHECKOUT_URL` 和 `cn/index.html` 里的 `BUY_URL`。

---

## 推广素材（已做完）

| 素材 | 位置 | 用法 |
|---|---|---|
| 小红书竖屏图卡 ×5 | [promo/xhs-1.png](promo/xhs-1.png) ~ [xhs-5.png](promo/xhs-5.png) | 1080×1440，直接上传；源码 [promo/xhs.html](promo/xhs.html) 可改字 |
| **小红书发布包** | [promo/xhs-copy.md](promo/xhs-copy.md) | 8 个标题备选、3 版正文、评论区话术、首周节奏、避坑清单 |
| 英文 SEO 长文 ×3 | [content/](content/) | 发自己站 + Medium / dev.to 同步 |
| 中文改写长文 | [content/01-zh-…md](content/01-zh-safely-use-chatgpt-with-customer-data.md) | 知乎 / 公众号，不是直译 |
| 产品截图 | [shots/app-en.png](shots/app-en.png)、[shots/app-zh.png](shots/app-zh.png)、[shots/app-cn.png](shots/app-cn.png) | 落地页和帖子配图 |

图卡顺序：① 钩子（别粘客户信息）② 12 类信息命中 ③ 可还原 ④ 怎么用 + ￥129。
第 4 张已经写了价格，能提前筛掉只想要免费的人。

---

## JSON / 结构化数据（key 感知）

当输入是 JSON、接口日志或 API 报文时，语义在 **key** 里，不在 value 里——
`"address": "江西省…"` 里没有「地址：」这个前缀，纯靠 value 形态是抓不到的。

所以除了形态识别，还做了一层 **key 感知**：匹配 `"key": "value"` 后按 key 名归类。

| key 命中 | 按什么处理 |
|---|---|
| `id_card` / `identity` / `身份证` | 身份证 |
| `bank_card` / `card_no` / `account_no` | 银行卡 |
| `phone` / `mobile` / `tel` / `receiver_phone` | 手机号 |
| `email` / `mail` | 邮箱 |
| `password` / `pwd` / `secret` / `token` / `api_key` / `密钥` | 密钥（含 `pay_password_hint` 这类后缀变体） |
| `address` / `addr` / `地址` | 地址 |
| `postcode` / `zip` / `邮编` | 邮编 |
| `name` / `user_name` / `receiver` / `contact` / `姓名` | 姓名 |

**反向排除**：`goods_name`、`product_name`、`file_name`、`company_name` 这类以 `_name` 结尾但与人无关的
字段**不会**被当成姓名——否则商品名会被抹掉，AI 就没法分析业务了。

只认带引号的 `"key": "value"`；YAML / `key=value` 这类无引号形式目前不生效，需要的话加自定义规则。

---

## 测试

```bash
node test/run.js          # 测英文版
node test/run.js cn       # 测国内版
node test/run.js all      # 两个都测（推荐，防止国内版生成物过期）
```

测试直接从 `index.html` 里抽出 `<script>` 代码，在最小 DOM 桩里运行——**测的就是将要发布的那份逻辑**，
不存在“测试代码和产品代码各一份”的漂移。54 项断言，覆盖：

- 用户给的 5 段样例（明文 / JSON / 特殊字符 / HTTP 报文 / 1.2 万字长文本）
- 13 类识别逐类覆盖
- 过度脱敏守卫（偏好、商品名、订单号、金额、时间戳、半截身份证…）
- 一致性（同值同占位符）、幂等（二次脱敏不变）
- 映射表还原往返，含 `[EMAIL_1]` vs `[EMAIL_10]` 前缀冲突
- 三种替换模式、CSV 引号/换行、卡号弱匹配、性能（20 万字 < 3 秒）

末尾单独列出**已知边界**（散文姓名、裸地址、英文人名、全角数字），不计入通过率——
写出来是为了不粉饰能力，也是给将来修好时留一个“翻红”提示。

**改完代码必须跑 `node test/run.js all` 再打包**，否则国内版生成物会和源文件脱节。

---

## 已知边界（诚实写在这里，也写进落地页了）

- 正则/规则引擎**不可能 100%** 覆盖。自由文本里的英文人名、非常规格式抓不到 → 靠"自定义规则"补
- 中文姓名/地址依赖上下文关键词（姓名：/客户/地址：），裸名字会漏
- **校验位一律只做提示，不做过滤**：身份证的校验位能滤掉约 90% 假号码，也会漏掉测试数据和手打错的真实号码。
  银行卡同理——Luhn 不通过只是"置信度低"，仍然会遮蔽并在界面提示。
  理由很硬：脱敏工具漏一个比多抹一个贵得多。曾经的做法是 Luhn 不过就静默丢弃，
  结果改一位数字整段卡号就完全不打码了——这是最坏的一种 bug，因为它不出声。
  现在默认"宁可多抹"，想要严格少误伤的人可以手动勾选「只遮蔽通过 Luhn 校验的卡号」。
- 授权码可被绕过（见上）
- 不构成合规承诺。落地页 FAQ 已经明确写了"这不是法律意见"，别删这一段

---

## 目录

```
redactlocal/
├── index.html          产品主体（免费+Pro 同一份文件，英文）
├── landing.html        英文销售页
├── build.ps1           打包 EN + CN 交付物（需 UTF-8 BOM）
├── build-cn.js         生成国内版 cn/index.html
├── server.js           本地预览（node server.js → 127.0.0.1:8123）
├── cn/
│   ├── index.html      国内版产品（生成物，勿手改）
│   ├── landing.html    中文销售页（微信收款流程）
│   └── assets/         收款码占位 + 截图
├── content/            3 篇英文 SEO 长文
├── promo/              小红书图卡（html 源 + 4 张 png）
├── tools/genkey.js     授权码生成（勿公开）
├── samples/            测试数据
├── shots/              截图（落地页在用）
└── dist/               打包产物（EN + CN 两个 zip）
```

本地预览：`node server.js`，打开 <http://127.0.0.1:8123/>。
