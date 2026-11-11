#!/usr/bin/env node
/**
 * build-cn.js — 从单一源文件生成国内版 cn/index.html
 *
 * 为什么用生成而不是复制：index.html 是唯一真相源，国内版只做差异化替换。
 * 任何一处替换失败会直接报错，避免"改了源文件但国内版悄悄过期"。
 *
 * 用法：node build-cn.js
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "index.html");
const OUT_DIR = path.join(__dirname, "cn");
const OUT = path.join(OUT_DIR, "index.html");

let html = fs.readFileSync(SRC, "utf8");
let applied = 0;

function must(from, to, label) {
  if (!html.includes(from)) {
    console.error(`\n❌ 替换失败：${label}\n   找不到片段：${JSON.stringify(from.slice(0, 80))}`);
    console.error("   源文件可能改过结构，请同步更新 build-cn.js 后重试。\n");
    process.exit(1);
  }
  html = html.split(from).join(to);
  applied++;
}

/* ---------- 1. 标题与语言 ---------- */
must(
  "<title>RedactLocal — Redact PII before you paste it into AI</title>",
  "<title>RedactLocal — 把客户信息抹掉再交给 AI｜本地脱敏工具</title>",
  "页面标题"
);

must(
  'let LANG = localStorage.getItem("rl_lang") || "en";',
  'let LANG = "zh";  /* 国内版锁定中文 */',
  "锁定中文语言"
);

// 隐藏语言切换器（保留代码路径，避免报错）
must("</style>", "  #lang{display:none!important}\n</style>", "隐藏语言切换器");

/* ---------- 2. 价格与购买入口 ---------- */
must(
  'const BUY_URL = "https://redactlocal.gumroad.com/l/pro";',
  'const BUY_URL = "https://YOUR-STORE.afdian.net/a/redactlocal";',
  "购买链接（改成你的爱发电/面包多链接）"
);

must('const PRICE = "$29";', 'const PRICE = "¥129";', "价格");

/* ---------- 3. 授权码说明改成微信发码 ---------- */
must(
  "licNote:\"粘贴购买邮件里的授权码，离线校验，无需注册账号。\"",
  "licNote:\"微信付款后把订单号发给我，30 分钟内发授权码。离线校验，不用注册账号。\"",
  "授权码说明"
);

must(
  'bl.textContent = T("buy") + " " + PRICE;',
  'bl.textContent = "微信购买 " + PRICE + " →";',
  "购买按钮文案"
);

/* ---------- 4. 静态兜底文案（防止 JS 加载前闪英文） ---------- */
[
  ['id="btnUnlock" data-i18n="unlock">Unlock Pro</button>', 'id="btnUnlock" data-i18n="unlock">解锁专业版</button>'],
  ['<div style="font-weight:600" data-i18n="licTitle">Unlock Pro</div>', '<div style="font-weight:600" data-i18n="licTitle">解锁专业版</div>'],
  ['data-i18n="buy">Buy Pro →</a>', 'data-i18n="buy">微信购买 →</a>'],
  ['data-i18n="sample">Load sample</button>', 'data-i18n="sample">载入示例</button>'],
  ['data-i18n="clear">Clear</button>', 'data-i18n="clear">清空</button>'],
  ['data-i18n="copy">Copy</button>', 'data-i18n="copy">复制</button>'],
  ['data-i18n="download">Download</button>', 'data-i18n="download">下载</button>'],
  ['data-i18n="tabText">Text</div>', 'data-i18n="tabText">文本</div>'],
  ['data-i18n="tabFiles">Batch files</div>', 'data-i18n="tabFiles">批量文件</div>'],
  ['data-i18n="tabRestore">Restore</div>', 'data-i18n="tabRestore">还原</div>'],
  ['$("limitMsg").title = "Unlock Pro";', '$("limitMsg").title = "解锁专业版";'],
  ['id="offlineBadge">100% local · no upload</span>', 'id="offlineBadge">100% 本地运行 · 不上传</span>']
].forEach(([from, to]) => must(from, to, "静态文案：" + from.slice(0, 40)));

/* ---------- 5. 页脚补充国内支持信息 ---------- */
must(
  "foot1:\"全程无网络请求、无埋点。文件只在这个浏览器标签页里解析。\"",
  "foot1:\"全程无网络请求、无埋点，文件只在本机解析。授权码微信人工发放。\"",
  "页脚文案"
);

/* ---------- 输出 ---------- */
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, html, "utf8");

const kb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(1);
console.log(`✅ 已生成 ${path.relative(__dirname, OUT)}（${applied} 处替换，${kb} KB）`);
console.log("   ⚠️  上线前记得把 BUY_URL 换成你自己的收款页");
