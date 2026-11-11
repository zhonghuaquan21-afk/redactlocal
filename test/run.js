#!/usr/bin/env node
/**
 * RedactLocal 回归测试
 *
 * 直接从 index.html 里取出 <script> 代码，在最小 DOM 桩里运行，
 * 因此测的就是真正发布的那份逻辑，不存在"测试代码和产品代码两份"的漂移。
 *
 * 用法：
 *   node test/run.js          # 测英文版
 *   node test/run.js cn       # 测国内版（cn/index.html）
 *   node test/run.js all      # 两个都测
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

/* ------------------------- 最小 DOM 桩 ------------------------- */
function makeEl() {
  const el = {
    value: "", checked: false, textContent: "", innerHTML: "", placeholder: "",
    title: "", href: "", className: "", innerText: "",
    style: {}, dataset: {}, children: [],
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); },
      contains(c) { return this._s.has(c); }
    },
    addEventListener() {}, removeEventListener() {}, click() {}, focus() {},
    appendChild() {}, scrollIntoView() {},
    querySelector() { return makeEl(); }, querySelectorAll() { return []; }
  };
  return el;
}

function makeSandbox() {
  const els = Object.create(null);
  const document = {
    getElementById(id) { return els[id] || (els[id] = makeEl()); },
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    createElement() { return makeEl(); },
    addEventListener() {},
    documentElement: { lang: "" },
    body: { innerText: "" }
  };
  const store = Object.create(null);
  const localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
  const window = { addEventListener() {}, location: { href: "" } };
  const navigator = { clipboard: { writeText: async () => {} } };
  const URL = { createObjectURL: () => "blob:x", revokeObjectURL() {} };
  const Blob = function () {};
  return { els, document, localStorage, window, navigator, URL, Blob };
}

/* ------------------------- 载入引擎 ------------------------- */
function loadEngine(file) {
  const html = fs.readFileSync(file, "utf8");
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const code = blocks.find(b => b.includes("const DETECTORS")) || blocks[blocks.length - 1];
  if (!code) throw new Error("没有找到 script 块：" + file);

  const box = makeSandbox();

  // 浏览器会把 id="xxx" 的元素挂到 window 上，代码里存在 planBadge 这类裸引用。
  // 测试里照做，否则行为与线上不一致。
  for (const m of html.matchAll(/\sid="([\w-]+)"/g)) {
    if (!(m[1] in globalThis)) globalThis[m[1]] = box.document.getElementById(m[1]);
  }

  const factory = new Function(
    "document", "window", "localStorage", "navigator", "URL", "Blob", "setTimeout",
    code + "\n;return { redact, restore, parseCsv, toCsvRows, collect, collectKeyed, DETECTORS, KEY_RULES, typeLabel };"
  );
  const api = factory(box.document, box.window, box.localStorage, box.navigator, box.URL, box.Blob, setTimeout);
  api.__els = box.els;
  api.__setMode = m => { box.els.mode = box.els.mode || makeEl(); box.els.mode.value = m; };
  api.__setStrictCard = v => { box.els.cardStrict = box.els.cardStrict || makeEl(); box.els.cardStrict.checked = v; };
  api.__setMode("placeholder");
  return api;
}

/* ------------------------- 断言框架 ------------------------- */
let pass = 0, failed = [];
function t(name, fn) {
  try {
    const r = fn();
    if (r === true || r === undefined) { pass++; return; }
    failed.push({ name, detail: r });
  } catch (e) {
    failed.push({ name, detail: "THROW: " + e.message });
  }
}
const gone = (out, arr) => arr.filter(s => out.includes(s));
const kept = (out, arr) => arr.filter(s => !out.includes(s));

/* ------------------------- 用例 ------------------------- */
function runSuite(api, label) {
  const out = (text) => api.redact(text).text;
  const rowsOf = (text) => api.redact(text).rows;

  /* ===== 一、你给的 5 段样例 ===== */
  const S1 = `用户姓名：张泽宇
用户编号：U202601190087
注册时间：2026-05-12 14:30:22
会员等级：VIP5
余额：1862.75
备注：该用户偏好线上订阅，收货地址为虚拟测试地址`;
  t("[样例1] 姓名/编号被抹，偏好与金额保留", () => {
    const o = out(S1);
    const leak = gone(o, ["张泽宇", "U202601190087"]);
    const lost = kept(o, ["该用户偏好线上订阅", "注册时间：2026-05-12", "会员等级：VIP5", "余额：1862.75", "线上订阅"]);
    return leak.length === 0 && lost.length === 0 ? true : { leak, lost, o };
  });

  const S2 = `{
    "userId": "TST-9527-0041",
    "userName": "林晓桐",
    "idCardMock": "36040119920815472X",
    "phoneMock": "13870229541",
    "email": "test_encrypt_001@fake-domain-demo.com",
    "address": "江西省九江市濂溪区虚拟测试街道88号加密实验室A栋",
    "orderList": [
        {"orderId":"ORD20261111001","amount":299.00,"payTime":"2026-11-10 09:12:44"},
        {"orderId":"ORD20261111002","amount":156.50,"payTime":"2026-11-10 16:45:10"}
    ],
    "tags": ["加密测试","边界数据","保密校验"],
    "secretNote": "内部测试标记：密文不可直接还原明文，禁止明文落盘日志"
}`;
  t("[样例2] JSON 全字段命中，订单与标签保留", () => {
    const o = out(S2);
    const leak = gone(o, ["TST-9527-0041", "林晓桐", "36040119920815472X", "13870229541",
      "test_encrypt_001@", "江西省九江市", "内部测试标记"]);
    const lost = kept(o, ["ORD20261111001", "ORD20261111002", "299.00", "156.50",
      "2026-11-10 09:12:44", "加密测试", "边界数据", "保密校验"]);
    return leak.length === 0 && lost.length === 0 ? true : { leak, lost, o };
  });

  const S3 = "符号集：!@#$%^&*()_+-=[]{}|;':\",./<>?\\`~\n" +
    "换行\t制表符\r回车\n换行\n" +
    "中文+emoji：测试加密😊🚀✅ 符号【】「」，、。；：\n" +
    "单引号：' 双引号：\" 反斜杠：\\\n" +
    "零宽字符：\u200B\u200B（零宽空格）\n" +
    "脚本片段：<script>alert(\"test\")</script>";
  t("[样例3] 特殊字符逐字保真（除浏览器级 CR 归一化）", () => {
    const o = out(S3);
    const strip = s => s.replace(/[\r\n]/g, "");
    if (strip(o) !== strip(S3)) {
      let i = 0; while (strip(o)[i] === strip(S3)[i]) i++;
      return { diffAt: i, in: strip(S3).slice(i, i + 24), out: strip(o).slice(i, i + 24) };
    }
    return o.includes("😊🚀✅") && o.includes("\u200B\u200B") && o.includes("<script>alert") ? true : { o };
  });

  const S4 = `POST /api/user/secure/submit HTTP/1.1
Host: demo-encrypt.test.local
Content-Type: application/json
X-Token: FAKE-TOKEN-8A7B6C5D4E3F2G1H
X-Timestamp: 1762813422

{
    "action": "save_secure_data",
    "dataPayload": "【待加密主体】",
    "checkSum": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}`;
  t("[样例4] HTTP 报文只抹 token 值，保留 header 名", () => {
    const o = out(S4);
    const leak = gone(o, ["FAKE-TOKEN-8A7B6C5D4E3F2G1H"]);
    const lost = kept(o, ["X-Token:", "Host: demo-encrypt.test.local", "f47ac10b-58cc-4372-a567-0e02b2c3d479", "【待加密主体】", "X-Timestamp: 1762813422"]);
    return leak.length === 0 && lost.length === 0 ? true : { leak, lost, o };
  });

  const head5 = `测试流水日志：
2026-11-10 08:00:01 [INFO] 加密服务启动成功，版本v2.4.1
2026-11-10 08:00:05 [DEBUG] 加载密钥套件：suite_test_003
2026-11-10 08:01:22 [INFO] 接收用户U202601190087上传保密表单
2026-11-10 08:01:23 [DEBUG] 进入AES加密流程，块大小128bit
2026-11-10 08:01:24 [INFO] 密文写入缓存，禁止明文持久化
2026-11-10 08:02:10 [WARN] 测试告警：如果此处明文出现在日志，代表保密失效
2026-11-10 08:03:00 [INFO] 解密校验任务启动，校验摘要一致性
重复填充文本用于扩容：`;
  const tail5 = "保密测试".repeat(3000);
  t("[样例5] 1.2 万字长文本：零截断、零丢字", () => {
    const src = head5 + tail5;
    const o = out(src);
    const leak = gone(o, ["suite_test_003", "U202601190087"]);
    const truncated = !o.endsWith(tail5.slice(-12));
    return leak.length === 0 && !truncated && o.length === src.length ? true : { leak, truncated, lenIn: src.length, lenOut: o.length };
  });

  /* ===== 二、13 类识别覆盖 ===== */
  const types = [
    ["email", "a.b@corp-mail.com"],
    ["phone_cn", "13762948501"],
    ["phone_intl", "+1 415 555 0132"],
    ["id_cn", "110105199003071234"],
    ["card", "4111 1111 1111 1111"],
    ["ipv4", "10.24.7.91"],
    ["api_key", "ghp_1234567890abcdefghijklmnopqrstuvwx"],
    ["jwt", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.abc123XYZsecret"],
    ["cn_name", "客户张伟（身份证）"],
    ["cn_name_honor", "王女士来电反馈"],
    ["cn_addr", "地址：北京市朝阳区建国路88号"],
    ["identifier", "用户编号：U202601190087"],
    ["secret_kv", "password: Hunter2!q"]
  ];
  for (const [type, sample] of types) {
    t(`[类型] ${type} 可命中`, () => {
      const rows = rowsOf(sample);
      return rows.some(r => r.type === type) ? true : { sample, got: rows.map(r => r.type) };
    });
  }

  /* ===== 三、过度脱敏守卫 ===== */
  const guards = [
    ["该用户偏好线上订阅", "偏好"],
    ["商品名为商用加密安全模块V2", "商用加密安全模块V2"],
    ["订单号 ORD20261111007429", "ORD20261111007429"],
    ["金额 2890.50 元", "2890.50"],
    ["时间 2026-05-12 14:30:22", "2026-05-12 14:30:22"],
    ["会员等级 VIP5", "VIP5"],
    ["号码 11010519900307123", "11010519900307123"],
    ["用户VIP5 余额 1862.75", "1862.75"],
    ["{\"goods_name\":\"商用加密安全模块V2\"}", "商用加密安全模块V2"]
  ];
  for (const [input, mustKeep] of guards) {
    t(`[守卫] 不得误伤「${mustKeep}」`, () => {
      const o = out(input);
      return o.includes(mustKeep) ? true : { input, o };
    });
  }

  t("[尊称] 「该女士」「一位女士」不得被当成人名", () => {
    const a = out("该女士来电投诉"), b = out("一位女士到店");
    return (a === "该女士来电投诉" && b === "一位女士到店") ? true : { a, b };
  });

  t("[尊称] 「王女士」「欧阳女士」可命中", () => {
    const a = out("王女士来电"), b = out("欧阳女士来电");
    return (!a.includes("王女") && !b.includes("欧阳")) ? true : { a, b };
  });

  /* ===== 四、一致性与幂等 ===== */
  t("[一致性] 同值同占位符，异值异占位符", () => {
    const o = out("a@x.com b@y.com 再次 a@x.com");
    const ph = [...o.matchAll(/\[EMAIL_(\d+)\]/g)].map(m => m[1]);
    return ph.length === 3 && ph[0] === ph[2] && ph[0] !== ph[1] ? true : { o, ph };
  });

  t("[幂等] 二次脱敏不再改变结果", () => {
    const once = out(S2);
    const twice = out(once);
    return once === twice ? true : { once, twice };
  });

  /* ===== 五、映射表还原往返 ===== */
  t("[还原] 映射表可逐字符还原原文", () => {
    const src = S1 + "\n" + S2;
    const r = api.redact(src);
    const csv = "placeholder,type,original\n" + r.rows
      .map(x => [x.placeholder, x.type, x.original].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n");
    const els = api.__els;
    els.rSrc = els.rSrc || makeEl(); els.rMap = els.rMap || makeEl(); els.rOut = els.rOut || makeEl();
    els.rSrc.value = r.text; els.rMap.value = csv; els.rOut.value = "";
    api.restore();
    return els.rOut.value === src ? true : { ok: false, lenIn: src.length, lenOut: els.rOut.value.length };
  });

  /* ===== 六、三种替换模式 ===== */
  t("[模式] mask 不含原值", () => {
    api.__setMode("mask");
    const o = out("卡号 4111 1111 1111 1111 手机 13762948501");
    api.__setMode("placeholder");
    return (!o.includes("4111 1111 1111 1111") && !o.includes("13762948501")) ? true : { o };
  });
  t("[模式] hash 稳定且不可逆", () => {
    api.__setMode("hash");
    const a = out("x a@b.com"), b = out("y a@b.com");
    api.__setMode("placeholder");
    const ha = (a.match(/EMAIL_[0-9a-f]{8}/) || [])[0];
    const hb = (b.match(/EMAIL_[0-9a-f]{8}/) || [])[0];
    return ha && ha === hb && !a.includes("a@b.com") ? true : { a, b, ha, hb };
  });
  t("[模式] remove 直接删除", () => {
    api.__setMode("remove");
    const o = out("联系 13762948501 即可");
    api.__setMode("placeholder");
    return (!o.includes("13762948501") && !o.includes("[")) ? true : { o };
  });

  /* ===== 七、CSV 解析 ===== */
  t("[CSV] 引号内逗号与换行不破坏结构", () => {
    const csv = 'name,note\n张伟,"地址：北京, 已付款"\n李四,"两行\n内容"';
    const rows = api.parseCsv(csv);
    const round = api.parseCsv(api.toCsvRows(rows));
    return rows.length === 3 && rows[1][1] === "地址：北京, 已付款" && rows[2][1] === "两行\n内容"
      && round.length === rows.length ? true : { rows };
  });

  /* ===== 十一、还原的前缀冲突 ===== */
  t("[还原] [EMAIL_1] 不会被 [EMAIL_10] 提前吃掉", () => {
    const many = Array.from({ length: 12 }, (_, i) => `u${i}@mail-${i}.com`).join(" ");
    const r = api.redact(many);
    const csv = "placeholder,type,original\n" + r.rows
      .map(x => [x.placeholder, x.type, x.original].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n");
    const els = api.__els;
    els.rSrc = els.rSrc || makeEl(); els.rMap = els.rMap || makeEl(); els.rOut = els.rOut || makeEl();
    els.rSrc.value = r.text; els.rMap.value = csv; els.rOut.value = "";
    api.restore();
    return els.rOut.value === many ? true : { got: els.rOut.value.slice(0, 120), want: many.slice(0, 120) };
  });

  /* ===== 十二、幂等（JSON 场景） ===== */
  t("[幂等] JSON 二次脱敏不变", () => {
    const once = out(S2);
    return out(once) === once ? true : { once };
  });

  /* ===== 十三、性能 ===== */
  t("[性能] 20 万字 < 3 秒", () => {
    const big = ("2026-11-10 [INFO] 用户U202601190087 手机 13812345678 邮箱 a@b.com 保密测试\n").repeat(3000);
    const t0 = Date.now();
    const r = api.redact(big);
    const ms = Date.now() - t0;
    return ms < 3000 && r.count > 5000 ? true : { ms, chars: big.length, count: r.count };
  });

  t("[卡号] 打错一位仍遮蔽并标记 weak", () => {
    const r = api.redact("卡号 4111 1111 1111 1112");
    return r.text.includes("[CARD_1]") && r.weak === 1 ? true : { r };
  });
  t("[卡号] 18 位订单号不被误判", () => {
    const o = out("订单号 202401150001234567");
    return o.includes("202401150001234567") ? true : { o };
  });

  /* ===== 九、真实数据变体（专门找漏） ===== */
  const variants = [
    ["手机带空格", "手机 138 1234 5678", ["138 1234 5678"]],
    ["手机带短横", "手机 138-1234-5678", ["138-1234-5678"]],
    ["手机带+86空格", "+86 138 1234 5678", ["138 1234 5678"]],
    ["身份证小写x", "身份证 11010519900307123x", ["11010519900307123x"]],
    ["邮箱大写", "邮箱 A.B@Corp.COM", ["A.B@Corp.COM"]],
    ["IP带端口", "服务 192.168.1.1:8080 异常", ["192.168.1.1"]],
    ["OpenAI key", "sk-proj-AbCdEfGhIjKlMnOpQrStUvWx", ["sk-proj-AbCdEfGhIjKlMnOpQrStUvWx"]],
    ["AWS key", "AKIAIOSFODNN7EXAMPLE", ["AKIAIOSFODNN7EXAMPLE"]],
    ["Bearer 头", "Authorization: Bearer abcdef1234567890abcdef", ["abcdef1234567890abcdef"]],
    ["银行卡无分隔19位", "卡号 6222081507003927461", ["6222081507003927461"]],
    ["姓名冒号全角", "姓名：赵一鸣", ["赵一鸣"]],
    ["地址无前缀(已知边界)", null, null]
  ];
  for (const [name, input, mustGone] of variants) {
    if (!input) continue;
    t(`[变体] ${name}`, () => {
      const o = out(input);
      const leak = gone(o, mustGone);
      return leak.length === 0 ? true : { input, o, leak };
    });
  }

  /* ===== 十、空与边界 ===== */
  t("[边界] 空输入不报错", () => { out(""); out("   "); return true; });
  t("[边界] 纯符号不被修改", () => {
    const s = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
    return out(s) === s ? true : { o: out(s) };
  });
}

/* ------------------------- 已知边界（预期会漏，不计入通过率） ------------------------- */
/* 这些是正则方案的天然上限。列出来是为了：1) 不粉饰能力；2) 将来修好后这里会变成失败提示。 */
function knownLimitations(api) {
  const run = t => api.redact(t).text;
  return [
    ["散文中的中文姓名（无上下文）", "张伟昨天打电话说他已经收到了", "张伟"],
    ["无前缀的裸地址", "北京市朝阳区建国路88号SOHO现代城A栋1801", "北京市朝阳区"],
    ["英文人名", "John Smith called about the invoice", "John Smith"],
    ["全角数字手机号", "手机１３８１２３４５６７８", "１３８１２３４５６７８"]
  ].map(([name, input, target]) => ({ name, leaked: run(input).includes(target) }));
}

/* ------------------------- 入口 ------------------------- */
const which = (process.argv[2] || "en").toLowerCase();
const targets = which === "all"
  ? [["英文版", "index.html"], ["国内版", "cn/index.html"]]
  : which === "cn" ? [["国内版", "cn/index.html"]] : [["英文版", "index.html"]];

let anyFail = false;
for (const [label, rel] of targets) {
  pass = 0; failed = [];
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { console.log(`\n✘ 找不到 ${rel}`); anyFail = true; continue; }
  const api = loadEngine(file);
  runSuite(api, label);
  const known = knownLimitations(api);

  console.log(`\n=== ${label} (${rel}) ===`);
  console.log(`通过 ${pass} 项，失败 ${failed.length} 项`);
  if (known.length) {
    console.log(`已知边界（仍会漏，${known.filter(k => k.leaked).length}/${known.length}）：`);
    for (const k of known) console.log(`  ${k.leaked ? "· 漏" : "· 已修"}  ${k.name}`);
  }
  if (failed.length) {
    anyFail = true;
    for (const f of failed) {
      console.log(`\n✘ ${f.name}`);
      console.log("  " + JSON.stringify(f.detail).slice(0, 500));
    }
  }
}
console.log(anyFail ? "\n结果：有失败项" : "\n结果：全部通过");
process.exit(anyFail ? 1 : 0);
