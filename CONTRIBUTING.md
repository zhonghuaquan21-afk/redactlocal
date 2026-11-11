# Contributing

Thanks for taking the time. This project is deliberately small — one HTML file, no build step, no
dependencies — and the most useful contributions are **detector improvements** and **false-positive
reports**.

## The one rule: test first

Every change to detection behaviour needs a test. The workflow is:

1. Add a case to `test/run.js` that **fails** with the current code.
2. Make it pass.
3. Run `npm test` and confirm both builds are green.

If a rule change makes a previously-passing case fail, that is usually a real regression — look at it
before "fixing" the test.

## Setting up

```bash
git clone https://github.com/zhonghuaquan21-afk/redactlocal.git
cd redactlocal
npm test
```

No `npm install` is needed; there are no dependencies. Node 18+.

## Adding a detector

Detectors live in the `DETECTORS` array inside `index.html`. Each entry is:

```js
{
  id: "email",                          // stable id — used in mapping CSVs, don't rename casually
  en: "Email address",                  // label, English UI
  zh: "邮箱",                            // label, Chinese UI
  re: /.../g,                           // global regex
  mask: m => kept(m, 1, 0),             // optional: how "partial mask" mode renders it
  soft: fn                              // optional: confidence check; NEVER a hard filter
}
```

Rules of thumb, learned the hard way:

- **Use lookarounds, always.** `(?<!\d)` / `(?!\d)` prevent slicing digits out of a longer number.
- **Require a real separator in context rules.** Allowing zero separators made `用户姓名：` eat the
  word 姓名 itself.
- **A failed check must never drop a candidate.** Mark it and surface a warning instead. Silent
  misses are the worst failure mode a redaction tool can have.
- **Prefer precision where the format is weak, recall where it is strong.** 18-digit IDs have strong
  internal structure; 16-digit card numbers don't, so the latter needs a confidence signal.
- **Don't swallow the label.** For `password: hunter2`, match only the value so the output stays
  `password: [SECRET_1]` — the model still needs to know what the field is.

## Chinese build

`cn/index.html` is **generated**. Do not edit it by hand:

```bash
npm run build:cn
```

It is produced from `index.html` by `build-cn.js`, which asserts every replacement it makes and exits
non-zero if the source has drifted. If you change a string that `build-cn.js` targets, update that
file in the same commit.

## Reporting a false negative

The most valuable issue you can file. Please include:

- The exact input string (or a shape-identical replacement, e.g. `110105199003071234`)
- What you expected to be redacted
- Which detector you think should have caught it

Do **not** paste real customer data into an issue. Rotate or fake every digit.

## Style

- Keep `index.html` dependency-free and openable via `file://`
- No network calls, ever — that is the product
- UI strings go through the `I18N` table; both `en` and `zh` keys are required
- Comments explain *why*, not *what*

## Commit messages

Conventional-ish, plain English, imperative mood:

```
fix(detector): require separator in cn_name context rules

"用户姓名：" was matching 姓名 itself as a name because the separator
was optional. Now requires ：or whitespace, and guards label words.
```

## License

By contributing you agree your work is released under the [MIT License](LICENSE).
