---
title: Redacting Chinese PII: 身份证 / 手机号 / 地址 detection rules that actually work
slug: chinese-pii-redaction-regex
description: Concrete detection rules for Chinese personal data — 18-digit ID numbers, mobile numbers, bank cards, names and addresses — including the false positives that break naive regexes.
keywords: 身份证 正则, 手机号 正则, chinese pii redaction, redact chinese id number, 中文姓名 脱敏
target: 1600 words
---

# Redacting Chinese PII: 身份证 / 手机号 / 地址 detection rules that actually work

Most "PII redaction" advice assumes Latin text with spaces between words. Chinese has no word
delimiters, IDs have their own checksum system, and the numbers that look most like personal data
are frequently order numbers. This is the field guide I wish existed when I built a redactor:
the patterns, the traps, and the tradeoffs you have to choose deliberately.

All snippets are JavaScript, but the logic ports to Python/Rust in a few minutes.

---

## 1. 身份证 (18-digit resident ID)

Structure is fixed:

```
1 1 0 1 0 5   1 9 9 0 0 3 0 7   1 2 3   4
└─ region ─┘  └── birthdate ──┘  seq   check
   6 digits        8 digits      3+1
```

A tight pattern, using lookarounds so you don't slice 11 digits out of a 20-digit serial:

```js
const ID_CN = /(?<!\d)[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx](?!\d)/g;
```

Note what each piece is doing:

- `(?<!\d)` / `(?!\d)` — the single most important part. Without them, `110105199003071234` inside
  a longer numeric string gets half-matched, and you corrupt the surrounding data.
- `[1-9]\d{5}` — region code never starts with 0
- `(?:18|19|20)\d{2}` — plausible birth year. Restricting this kills most false positives from
  random 18-digit hashes.
- Month/day ranges are checked structurally (01–12, 01–31).

### The checksum, and why you should *not* enforce it

The last character is an ISO 7064 MOD 11-2 check digit:

```js
function idChecksumOk(id) {
  const W = [7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2];
  const C = "10X98765432";
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += Number(id[i]) * W[i];
  return C[sum % 11] === id[17].toUpperCase();
}
```

It works, and every tutorial tells you to use it. **For a redaction tool, don't.**

Redaction is asymmetric: a false positive costs you a mangled sentence, a false negative costs you a
leaked identity card number. Test data, synthetic records, typos and half-typed IDs all fail the
checksum — and those are exactly the rows a customer will paste into an AI. Validating the checksum
converts a safe over-match into a silent leak.

Use the checksum for **detection** (flagging likely-real IDs in a database audit), not for
**filtering** in a redactor.

---

## 2. 手机号 (mobile numbers)

```js
const PHONE_CN = /(?<!\d)(?:\+?86[\s-]?)?1[3-9]\d{9}(?!\d)/g;
```

- `1[3-9]` — real mobile prefixes. `12`/`10`/`11` are not allocated to consumers.
- The `+86` branch must be inside the same pattern, otherwise `+8613812345678` gets matched as
  `8613812345678` and you leave a stray `+`.
- Separators: real-world text contains `138-1234-5678`, `138 1234 5678`. Either normalise before
  matching, or allow `[\s-]?` between groups — but beware, allowing separators freely makes the
  pattern match dates like `2024-01-15`.

A safer variant that accepts separators only in mobile-group positions:

```js
const PHONE_CN_SEP = /(?<!\d)(?:\+?86[\s-]?)?1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}(?!\d)/g;
```

### Landlines and 400 numbers

`010-12345678`, `0755-1234567`, `400-123-4567` are business contact data. Whether they count as PII
depends on context — a company switchboard isn't personal, an extension is. Most teams redact them
only in customer-facing exports.

---

## 3. 银行卡 (bank cards)

Card digits are 16–19 long, often grouped in 4s. But so are invoice numbers, tracking numbers and
timestamps. The obvious move is to require a checksum — and the obvious move is wrong.

```js
function luhn(num) {
  const d = num.replace(/\D/g, "");
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0, alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = +d[i];
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}

const CARD = /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g;
```

### Don't use the checksum as a filter

The tempting design is `if (!luhn(m[0])) continue;` — drop every candidate that fails Luhn. I shipped
exactly that, and a user found the bug in about ninety seconds: change one digit of a card number and
the whole thing silently stops being redacted.

That is the worst class of bug in a redaction tool, because it fails **silently in the dangerous
direction**. UnionPay test data, half-typed numbers, cards written with a typo, and any number that
happens to violate the check digit all vanish from the output — and nothing tells you.

Use Luhn as a **confidence signal**, not a gate:

```js
const weak = !luhn(m[0]);          // low confidence, still a candidate
hits.push({ ...m, weak });          // redact it, but flag it
```

Then surface the flag in the UI: *"1 × card-like number without a valid Luhn check — redacted
anyway."* The user learns that something was uncertain *and* stays protected. Nobody has to choose
between "leaks" and "useless output".

If someone genuinely needs to avoid eating order numbers, expose a strict toggle — but make it
opt-in, and never make it the default.

### The asymmetry is real, but it's about **how loud** the check is

| Data type | Format alone | Role of the checksum |
|---|---|---|
| 身份证 | structurally strong (date ranges) | Not needed at all |
| 银行卡 | structurally weak (any 16 digits) | Confidence signal — flag, don't drop |
| 手机号 | structurally strong (prefix + length) | N/A |

There is no universal rule, but there is a universal bias: **when a check fails, degrade confidence —
never degrade coverage.** A redaction engine that errs toward "keep it" will occasionally put an
asterisk where a digit could have stayed. One that errs toward "drop it" will lose a card number, and
you will not find out.


---

## 4. 中文姓名 — the hard one

There are no word boundaries and no case signals. Two viable strategies, neither complete.

**A. Context keywords (high precision, low recall)**

```js
const NAME_CTX = /(?<=(?:姓名|联系人|客户|收件人|法人|申请人|用户)[：:\s]{0,3})[\u4e00-\u9fa5]{2,4}/g;
```

Catches `姓名：张伟`, `客户李娜`. Quietly misses `张伟打电话过来说…` — which is most real prose.

**B. Honorifics (medium precision)**

```js
const NAME_HONOR = /[\u4e00-\u9fa5]{2,3}(?=(?:先生|女士|小姐|老师|经理|总监))/g;
```

`张先生` / `李女士` are frequent in business text. Watch out for `王经理` where 王 is also a common
surname character appearing in words — the honorific suffix makes it safe enough.

**C. Surname dictionary (low precision, high recall)**

The 百家姓 list covers ~85% of Han surnames in 2 characters or fewer. Matching
`[surname][1-2 chars]` in isolation produces noise (`张` in `扩张`, `李` in `行李`) — so constrain it:
require the candidate to be followed by a punctuation, verb, or honorific, and to be preceded by a
boundary like `，`, `。`, ` `, or a line start.

If you need real accuracy on free-form names, use a Chinese NER model (HanLP, jieba+CRF, or a small
BERT). Regex alone will not get you past ~70% recall on prose.

---

## 5. 地址 (addresses)

Chinese addresses are hierarchical, which makes partial matching useful:

```js
const ADDR_CTX = /(?<=(?:地址|住址|收货地址)[：:\s]{0,3})[^\s：:,;，；][^\n,;，；]{5,59}/g;
```

Two refinements that matter in practice:

1. **Stop at punctuation.** Without `[^\n,;，；]{5,59}` you will swallow the next clause of the
   sentence (and with it, unrelated content).
2. **Strip the leading separator from the match.** If your lookbehind allows zero separators, the
   match starts at the `：` itself and the address keeps a leading colon. Require the first character
   to be a non-punctuation character.

Optionally detect bare administrative chains without context:

```js
const ADDR_BARE = /(?:北京|上海|天津|重庆|[\u4e00-\u9fa5]{2,8}省)?[\u4e00-\u9fa5]{2,10}(?:市|区|县)[\u4e00-\u9fa5\d]{4,40}(?:路|街|道|巷|号|弄|栋|单元|室)/g;
```

Useful for spreadsheets where the column header says `地址` but the cells don't repeat the word.

---

## 6. Overlaps: resolve them before replacing

Multiple detectors *will* match the same span — a `Bearer eyJ…` token matches both an auth-header
pattern and a JWT pattern. If you replace blindly you get nested placeholders like
`[API_KEY_[JWT_1]]`.

Resolve greedily before substitution:

```js
hits.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
const kept = [];
let lastEnd = -1;
for (const h of hits) {
  if (h.start >= lastEnd) { kept.push(h); lastEnd = h.end; }
}
```

Earliest start wins; on a tie, the longer match wins. Then build the output in one pass and apply the
replacement mode (placeholder / mask / hash / delete).

---

## 7. Build a test set before you trust it

Redaction bugs are silent. Keep a fixture file of ~40 real-shaped strings with expected results,
and run it on every change:

```
110105199003071234   → 身份证  ✔
11010519900307123    → 17 digits, must NOT match ✔
4111 1111 1111 1111  → card (Luhn ok) ✔
4111 1111 1111 1112  → Luhn fail, still redact + warn ⚠
A1002                → order number, must NOT match ✔
2024-01-15 10:24:07  → timestamp, must NOT match ✔
+8613812345678       → phone ✔
13812345678          → phone ✔
订单号 202401150001234567  → must NOT match as card/ID ✔
```

The last four are the ones that break naive patterns, and the ones users notice immediately.

---

## Try it

[RedactLocal](/) implements all of the above — with the deliberate choices spelled out here:
lookaround boundaries, no hard checksum gates (身份证 and 银行卡 both degrade to a warning instead), context-based names and addresses,
greedy overlap resolution. It is a single HTML file, runs entirely in the browser, and never
uploads the text you paste.

Free version: 5,000 characters, all detectors. Pro: unlimited, batch CSV, custom regex rules
(for your own employee IDs, invoice prefixes, internal codes).
