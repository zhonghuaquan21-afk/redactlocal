---
name: False negative (something was not redacted)
about: A value that should have been redacted passed through untouched
title: "[miss] "
labels: false-negative
---

<!--
Please do NOT paste real customer data.
Replace every digit/character with a shape-identical fake, e.g. 110105199003071234.
-->

**Input (redacted or fabricated)**

```
paste here
```

**What was not redacted**

```
the exact substring that survived
```

**Which detector should have caught it**

<!-- email / phone / id / card / name / address / identifier / secret / other -->

**Environment**

- Build: `index.html` / `cn/index.html`
- Browser + version:
- Mode: placeholder / mask / hash / remove
- Input channel: text box / batch file

**Anything else**

<!-- Does it only happen in JSON? Only with separators? Only at the start of a line? -->
