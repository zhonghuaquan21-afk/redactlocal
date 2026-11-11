---
title: CSV PII scrubbing before LLM analysis: a spreadsheet-safe workflow
slug: csv-pii-scrubbing-before-llm
description: How to redact personal data from CSV exports (CRM, helpdesk, billing) without breaking quoting, encodings or number formats — then feed the clean file to an LLM.
keywords: csv pii scrubbing, anonymize csv for chatgpt, redact spreadsheet personal data, csv redaction tool
target: 1400 words
---

# CSV PII scrubbing before LLM analysis: a spreadsheet-safe workflow

Analysing a support queue with an LLM is one of the highest-value uses of AI in a small company:
cluster the complaints, find the recurring bug, draft the 20 replies. The input is almost always a
CSV export — and that export is a dense table of names, emails, phone numbers and order IDs.

Text redaction is easy to reason about. Spreadsheets are where naive implementations quietly corrupt
data. This is the workflow, plus the six failures that will bite you.

---

## Why CSVs are riskier than they look

1. **Row-level linkage.** A single row ties name + email + phone + address + transaction together.
   That is a much richer profile than any paragraph of prose, and it is exactly what re-identification
   attacks need.
2. **Volume.** 10,000 rows fit in a 2 MB file. Nobody eyeballs those before uploading.
3. **Hidden columns.** `internal_notes`, `support_tags`, `last_ip` — the columns you forgot were in
   the export.
4. **Structure is semantic.** In a table, a phone number is *identified by its column*, not by its
   shape. `col: phone` should be redacted even when the values look ambiguous.

The last point is the leverage: **use the header as a hint.** A column named `手机号` / `phone` /
`email` / `身份证` lets you redact with far higher precision than pattern matching alone.

---

## The workflow

### Step 1 — Export as UTF-8 CSV, not XLSX

Open `.xlsx` files are a zip of XML; parsing them locally is possible but adds 800 KB of library to
your redactor. CSV keeps the tool small enough to audit in one file. In Excel:
`Save As → CSV UTF-8 (Comma delimited)`.

### Step 2 — Redact cell by cell, preserving structure

Do not run a regex over the raw file text. Commas inside quoted fields, escaped quotes (`""`) and
embedded newlines will desynchronise your columns.

```text
name,email,note
张伟,zhangwei@acme.cn,"地址：北京市朝阳区建国路88号, 已付款"
```

The note field contains a comma. A `split(",")` produces five fields instead of four, and every
subsequent column shifts. Parse properly, redact each cell, and re-serialise with correct quoting.

### Step 3 — Number placeholders per file, not per cell

This is the bug that ruins restores. If cell-level redaction resets the counter, three different
addresses all become `[EMAIL_1]`:

```csv
name,email
A,[EMAIL_1]     ← actually a@x.com
B,[EMAIL_1]     ← actually b@y.com   ← collision
```

The mapping then cannot be reversed correctly. Keep one placeholder counter per file (ideally per
batch), so the same original always maps to the same token and different originals never collide:

```csv
name,email
A,[EMAIL_1]
B,[EMAIL_2]
```

Consistency also helps the model: it can see that rows 3 and 17 belong to the same customer without
ever learning who that is.

### Step 4 — Keep the mapping next to the file, then delete it

Export `mapping.csv` with `placeholder,type,original`. Restore maps back by longest-placeholder-first
substitution (important: `[EMAIL_1]` is a prefix of `[EMAIL_10]`).

### Step 5 — Chunk before prompting

Redact, then split. 10,000 rows will not fit in a context window. Chunk on logical boundaries (by
week, by category) and make sure your prompt asks for aggregate findings, not a per-row rewrite —
you do not want 10,000 restored outputs to reconcile.

---

## Six failures that will bite you

### 1. Excel destroys 18-digit IDs

Excel renders `110105199003071234` as `1.10105E+17`, and the moment it is saved, the digits are
gone permanently. If you must open the file in Excel, import it explicitly and set the column to
**Text**. Once mangled, no redactor can recover the original — the data is simply wrong.

### 2. Leading zeros on phone numbers

`0755…` and `0123…` lose their leading zero in numeric columns. Same fix: import as text.

### 3. BOM and encoding

Excel's CSV UTF-8 starts with a byte-order mark (`EF BB BF`). Your parser sees `\uFEFFname` as the
first header and column-based rules silently stop matching. Strip the BOM before parsing:

```js
if (csv.charCodeAt(0) === 0xFEFF) csv = csv.slice(1);
```

GBK/GB18030 exports (common from older Chinese systems) are not UTF-8 at all — they need a decode
step, or the file must be re-exported.

### 4. Quoted fields with embedded newlines

```csv
id,note
1,"line one
line two"
```

Line-based processing splits this into two broken rows. A correct state machine tracks whether you
are inside quotes across newlines:

```js
function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
      continue;
    }
    if (c === '"') { q = true; continue; }
    if (c === ",") { row.push(cell); cell = ""; continue; }
    if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; continue; }
    if (c === "\r") continue;
    cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
```

### 5. Redacting the header

If a column is literally named `jane@acme.com`, redact it. But don't blanket-redact header cells:
you will turn `email` into `[EMAIL_1]` and lose the column semantics for every downstream step.

### 6. Dates and order numbers that look like data

`2024-01-15` matches loose phone patterns. `202401150001234567` matches loose card patterns. This is
why card detection uses Luhn as a confidence signal rather than a filter, and why phone detection needs prefix constraints — see the
[Chinese PII detection guide](02-chinese-pii-redaction-regex.md).

---

## Quality check before you upload the clean file

A 30-second manual review catches nearly everything:

- Open the redacted CSV and look at the first 20 rows: are the interesting columns still human-readable?
- Count distinct placeholders per type. `[EMAIL_1..N]` where N = number of unique emails expected.
- Search for `@` in the redacted file. Zero hits = no email survived.
- Search for a known substring of a real name you saw in the original.
- Confirm the mapping file is **not** in the same folder you are about to share.

---

## Prompting on the clean table

Two prompt patterns work well:

**Aggregate analysis** — "Here is a week of support rows with identifiers replaced by placeholders.
Group them into thematic clusters, count each, and name the likely root cause. Do not invent rows."

**Template drafting** — "Using `[PERSON_1]` and `[ORDER_1]` as literal tokens, write a reply template
for category 2. Keep the tokens exactly as written."

Then restore. Because the restore step is a mechanical string substitution, it works on templates too:
the model never needs to see a real name to produce a usable reply.

---

## Tooling

If you want to skip building this, [RedactLocal](/) does the whole pipeline in one file: drop a CSV,
every cell is scanned, the structure and quoting are preserved, you get `file.redacted.csv` plus
`mapping.csv`, and the Restore tab puts the real values back into the model's answer.

It runs in the browser tab with no network calls — worth verifying yourself in DevTools → Network,
because "local" is a claim, not a guarantee.
