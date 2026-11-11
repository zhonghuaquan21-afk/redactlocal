# 从这里开始

这个压缩包里是 **RedactLocal** 的全部资源：产品本体、两个版本的落地页、可直接上架的付费交付包、
推广素材和文档。解压后照着下面走，大约 40 分钟可以上线。

---

## 一、先看这 3 个文件

| 顺序 | 文件 | 你会知道什么 |
|---|---|---|
| 1 | `README.md` | 产品是什么、为什么能卖、完整上线清单、授权码流程 |
| 2 | `LAUNCH.md` | 30 天获客计划：渠道、节奏、可直接复制的中英文文案 |
| 3 | `START-HERE.md` | 就是本文件，全局地图 |

---

## 二、上线只要三步

### 第 1 步：改链接（3 处）

| 文件 | 改什么 |
|---|---|
| `index.html` | 顶部 `const BUY_URL = "...";` → 你的收款链接 |
| `landing.html` | 底部 `const CHECKOUT = { pro, team }` → 你的收款链接 |
| `cn/landing.html` | 底部 `const CHECKOUT_URL = "...";` → 你的收款链接 |

> 国内版还有一个隐藏依赖：`cn/index.html` 是从 `index.html` **生成**的。
> 改完源文件要重新跑 `node build-cn.js`。

### 第 2 步：部署免费版（引流用，必须有）

把 `index.html`、`landing.html`、`shots/`、`cn/` 整个拖到 <https://app.netlify.com/drop>，
30 秒得到一个网址。免费版本身是引流入口，别锁起来。

### 第 3 步：上架付费版

- **海外**：Gumroad / Lemon Squeezy，上传 `dist/RedactLocal-Pro-v1.0.0.zip`，定价 $29
- **国内**：爱发电 / 面包多 / 知识星球，上传 `dist/RedactLocal-CN-Pro-v1.0.0.zip`，定价 ¥129

**上架前必须自己买一单**，确认能收到 zip、能生成授权码、授权码能激活。

---

## 三、文件地图

```
redactlocal/
│
├─ START-HERE.md          本文件
├─ README.md              产品说明 + 上线清单 + 授权码 + 已知边界
├─ LAUNCH.md              30 天获客计划（含现成文案）
│
├─ index.html             ★ 产品主体（英文，免费+Pro 同一份文件）
├─ landing.html             英文销售页（定价 / FAQ / 落地转化）
│
├─ cn/
│   ├─ index.html         ★ 国内版产品（生成物，勿手改）
│   ├─ landing.html         中文销售页（微信发码流程）
│   └─ assets/              收款码占位 + 截图
│
├─ dist/
│   ├─ RedactLocal-Pro-v1.0.0.zip        英文付费交付包  $29
│   └─ RedactLocal-CN-Pro-v1.0.0.zip     国内付费交付包  ¥129
│
├─ content/               长文（发自己站 / 知乎 / 公众号）
│   ├─ 01-safely-use-chatgpt-with-customer-data.md   英文主关键词
│   ├─ 01-zh-safely-use-chatgpt-with-customer-data.md 中文改写版（非直译）
│   ├─ 02-chinese-pii-redaction-regex.md             技术长尾
│   └─ 03-csv-pii-scrubbing-before-llm.md            表格场景
│
├─ promo/                 小红书素材
│   ├─ xhs-1.png ~ xhs-5.png   1080×1440 竖屏图卡
│   ├─ xhs-copy.md             发布包：标题 / 3 版正文 / 评论区话术 / 节奏
│   └─ xhs.html                图卡源码（改字改色重新截图）
│
├─ shots/                 截图（落地页在引用，别删）
├─ samples/               测试数据
├─ tools/genkey.js        ★ 授权码生成器（自己留着，别公开）
├─ build.ps1              打包两个付费交付包
├─ build-cn.js            从 index.html 生成国内版
└─ server.js              本地预览：node server.js → 127.0.0.1:8123
```

---

## 四、授权码怎么发

```bash
node tools/genkey.js          # 生成 1 个
node tools/genkey.js 20       # 批量生成 20 个
node tools/genkey.js --check RL-MCKZ-FU9B-0QHF   # 校验
```

格式 `RL-AAAA-BBBB-CCCC`，**离线校验、不联网、不建库**。一个买家用一个码即可。

⚠️ 这是"防君子"级别，扒开 JS 能绕过。$29 的产品不值得上服务端验证。

---

## 五、几个容易踩的坑

1. **微信个人收款码不能收经营款。** 违反微信支付规则，被风控会连收款功能一起限制。
   用爱发电 / 面包多 / 知识星球（个人可注册、平台代收、能开票）。
2. **别手改 `cn/index.html`。** 它是 `node build-cn.js` 生成的，改了会被覆盖。
3. **`build.ps1` 必须保存为 UTF-8 带 BOM**，否则 PowerShell 5.1 会按 ANSI 读成乱码。
4. **改完链接要重新打包**，否则卖出去的 zip 里还是旧链接。
5. **`shots/` 别删**，落地页在引用这些图片。

---

## 六、产品边界（对外也这么说，别吹过头）

- 正则规则**不可能 100%** 覆盖；散文里没上下文的姓名会漏
- 中文姓名 / 地址依赖「姓名：/客户/地址：」这类上下文关键词；JSON 里改为按 key 识别
- 故意**不校验身份证校验位**：会漏掉测试数据和手打错号，而漏一个比多抹一个贵得多
- 银行卡按形态识别，Luhn 只作置信度参考、不作过滤器：校验不过也照样遮蔽，并在界面提示（宁可多抹）
- JSON 只认带引号的 `"key": "value"`；YAML / `key=value` 无引号形式不生效
- 不构成合规承诺，不是法律意见

---

## 七、本地预览

```
node server.js
```

然后打开：
- <http://127.0.0.1:8123/>            英文版产品
- <http://127.0.0.1:8123/landing.html> 英文落地页
- <http://127.0.0.1:8123/cn/index.html> 国内版产品
- <http://127.0.0.1:8123/promo/xhs.html> 图卡源文件
