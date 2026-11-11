# Security Policy

## The threat model

RedactLocal is a **client-side text transformer**. Understanding what it does *not* do is as
important as what it does.

| Property | Reality |
|---|---|
| Network calls | **None.** No fetch, no XHR, no sendBeacon, no remote fonts/CDNs, no analytics |
| Server component | **None.** There is nothing to breach on the backend |
| Storage | `localStorage` only: UI language, and whether the app has been unlocked |
| File handling | `File.text()` in the browser tab; contents never leave memory |
| Third-party code | **None.** No dependencies, no bundled libraries |

### What this means

- **Your pasted text cannot leak through this app**, because there is no channel for it to use.
  You can verify this yourself: DevTools → Network, or disconnect the machine entirely.
- **The mapping file is the actual secret.** Once you export `mapping.csv`, it is a concentrated list
  of exactly the PII you were trying to protect. Store it like a password file and delete it when done.
- **Redaction is not encryption.** Placeholders are reversible by design. Anyone holding both the
  redacted text and the mapping can recover the original.

## Reporting a vulnerability

Please **do not** open a public issue for anything that could cause data exposure.

Use GitHub's private reporting: **Security → Report a vulnerability** on the repository, or email the
maintainer listed in `package.json`.

Please include:

- A description of the issue and its impact
- A minimal reproduction (input string that triggers it)
- The affected build (`index.html` or `cn/index.html`) and browser version

### What counts as a vulnerability here

- Any code path that **transmits** user text off the machine
- A **silent false negative** in a detector that leaves a high-confidence identifier in the output
  (e.g. a well-formed ID number or card number that is not redacted and not flagged)
- An **XSS / injection** path via pasted content (note: rendering uses `textContent`-style escaping,
  but report anything suspicious)
- Convincing a user their data is redacted when it is not

### What is not a vulnerability

- Regex limitations listed in the README's *Known limitations* section — those are documented gaps,
  not surprises. Do file them as regular issues if you have a fix.
- The fact that redaction is reversible with the mapping file. That is the feature.
- Full-width digits or free-form names not being caught (documented).

## Supported versions

Only the latest commit on `main` is supported. There are no LTS branches.

## A note on compliance claims

This project is a **data-minimisation measure**, not a compliance control. Nothing in this repository
constitutes legal advice, and passing your data through it does not by itself make a processing
activity lawful under GDPR, 个人信息保护法, or any other regime. Talk to your DPO.
