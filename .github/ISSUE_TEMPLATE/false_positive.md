---
name: False positive (something was over-redacted)
about: Ordinary text got replaced even though it contains no personal data
title: "[over-redact] "
labels: false-positive
---

**Input**

```
paste here
```

**What got replaced that should not have been**

```
e.g. "偏好" replaced inside "该用户偏好线上订阅"
```

**Expected output**

```
what the text should look like
```

**Environment**

- Build: `index.html` / `cn/index.html`
- Browser + version:
- Mode: placeholder / mask / hash / remove

**Why it matters**

<!-- e.g. "it destroys product names, so the LLM can't analyse the ticket" -->
