---
title: How to safely use ChatGPT with customer data (without uploading it)
slug: safely-use-chatgpt-with-customer-data
description: A practical workflow for using LLMs on support tickets, CRM exports and logs without sending customer PII to a third party. Redact locally, prompt, restore.
keywords: redact pii before chatgpt, use chatgpt with customer data, gdpr chatgpt prompts, anonymize data for llm
target: 1500 words
---

# How to safely use ChatGPT with customer data (without uploading it)

The request I hear most often from small teams sounds like this: *"We want to use ChatGPT to
summarise support tickets / draft replies / classify complaints — but our DPO said no, because the
tickets contain customer data."*

Both sides are right. The LLM genuinely helps. And the customer data genuinely should not be
pasted into a third-party service without a lawful basis, a processor agreement, and a decision
about retention. Most teams have none of those things, so the project stalls.

There is a middle path that nobody documents well: **redact locally, prompt with placeholders,
restore the real values afterwards.** It works today, it needs no vendor approval, and it takes
about five seconds per ticket. This article is the operational version — including where it fails.

---

## What actually happens when you paste a ticket

When you paste a support ticket into a chat window, you are sending more than the question.

| In the text | Why it matters |
|---|---|
| Name, email, phone | Direct identifiers — trivially linked to a person |
| Order ID, account number | Pseudonymous, but joins back to your database |
| Card number, IBAN | Financial data, near-universally regulated |
| Free-text notes | Often contain health, family or dispute details nobody intended to share |
| Internal hostnames, IPs, API keys | Not personal data, but a security incident waiting to happen |

Two things make this worse than it looks:

1. **The data leaves your boundary.** Whatever the retention policy says, you have handed a copy
   to a processor in another jurisdiction.
2. **You cannot un-send it.** Deleting a chat does not delete it from logs, backups or a model
   vendor's abuse-monitoring pipeline.

Compliance frameworks (GDPR Art. 5 data minimisation, China's 个人信息保护法 Art. 6) all point the
same direction: **send less**. Redaction is the technical expression of that principle.

---

## The three options, honestly compared

| Approach | Effort | Cost | What breaks |
|---|---|---|---|
| Don't use AI at all | zero | opportunity cost | You fall behind on response time |
| Enterprise DLP / redaction gateway | high | $10k+/yr | Procurement, rollout, "it's too slow" |
| **Redact in the browser, then prompt** | low | free–$29 | Some sensitive items slip through if you don't check |

The third option is not a compliance program. It is a **data-minimisation measure** — one control
among several. But it is the only one a 5-person team will actually adopt this week.

---

## The workflow

### 1. Strip the identifiers before the text leaves your machine

Run the text through a redactor that operates locally — in the browser tab, or as a local file — so
no copy is transmitted. Replacements should be **structured placeholders**, not asterisks:

```
Before:  Jane Doe (jane@acme.com, +1 415 555 0132) says order A1002 never arrived.
After:   [PERSON_1] ([EMAIL_1], [PHONE_1]) says order [ORDER_1] never arrived.
```

Structured placeholders do two jobs asterisks can't: they keep the sentence readable for the model,
and they make the text reversible.

### 2. Keep the mapping, locally

The placeholder→original table is the sensitive artefact now. Rules for it:

- Store it on your machine, not in a shared drive by default
- Delete it when the task is done
- Never paste the mapping into the same chat as the redacted text (that defeats the whole exercise)

### 3. Prompt normally

Models handle placeholders well. A prompt like *"Draft a reply to [PERSON_1] apologising for
[ORDER_1] being late"* produces a reply that also uses `[PERSON_1]` and `[ORDER_1]`. Nothing is lost
in quality — the model never needed the real name to write a good apology.

### 4. Restore before sending

Take the model's answer, run it through the reverse mapping, and the real values come back:
`[PERSON_1]` → Jane Doe. Now you have an AI-drafted reply containing real customer data, and that
data never left your environment.

### 5. Log the decision, not the data

If you need an audit trail, record *that* redaction happened (timestamp, tool, categories removed),
not the removed values. Auditors want evidence of a control, not a second copy of the PII.

---

## What to redact (and what to leave alone)

Over-redaction makes prompts useless; under-redaction defeats the purpose. A workable default:

**Always redact**
- Email addresses, phone numbers
- Government IDs (SSN, 身份证, passport)
- Payment cards, IBANs
- Credentials: API keys, tokens, passwords, JWTs, connection strings
- IP addresses and internal hostnames

**Usually redact**
- Personal names — unless the gender/tone of the name matters to the task
- Postal addresses — keep the city if the task is about logistics
- Account/customer/order IDs — keep them if you need to reason about *the same* customer across turns

**Leave alone**
- Product names, error messages, stack traces (after stripping secrets)
- Dates, amounts, currencies
- The actual question the customer is asking

A useful heuristic: **redact what identifies a person, keep what describes the problem.**

---

## The part most guides skip: verifying "local"

"Runs in your browser" is a marketing claim until you check it. Two minutes of verification:

1. Open the tool, open DevTools → Network tab, clear it.
2. Paste a paragraph with an email in it.
3. Watch the Network panel. If a request appears with your text in the payload, it is not local.
4. Better: disconnect from the internet (or set DevTools to Offline) and try again. A genuinely
   local tool behaves identically.

A tool that ships as a single HTML file is easy to audit: `Ctrl+U` shows the whole program, and
`grep` for `fetch(`, `XMLHttpRequest` and `sendBeacon` tells you whether it can talk to a server
at all.

---

## Where this approach fails

Be honest with your team about the limits, because a false sense of safety is worse than none.

- **Free-form names in prose.** "My husband Greg called about the boiler" — a regex will not catch
  `Greg` reliably. You need a name list, a NER model, or manual review.
- **Indirect identifiers.** A rare job title plus a city plus a date can identify someone without a
  single name. Redaction does not solve k-anonymity.
- **Images and attachments.** Screenshots of invoices are outside the scope of a text redactor.
- **The mapping file.** It is now a concentrated list of exactly the PII you were trying to
  protect. Treat it like a password file.
- **It is not a legal opinion.** Minimisation is one control. Purpose limitation, retention,
  processor agreements and lawful basis are separate questions only your DPO can settle.

---

## FAQ

**Can I use this with the API instead of the chat UI?**
Yes, and it is usually the better option: you control retention and logging. Redact before the
request body is built.

**Do placeholders confuse the model?**
Rarely. Bracketed uppercase tokens are read as opaque identifiers, which is exactly what they are.
Avoid punctuation that looks like markdown or template syntax (`{{ }}`, `<% %>`) — some models try
to interpret it.

**What about consistency across a long conversation?**
Use the same mapping for the whole session. `[EMAIL_1]` must mean the same address in turn 1 and
turn 12, otherwise the model's reasoning drifts.

**Is masking (`j***@acme.com`) good enough?**
For display, yes. For prompting, no: masked strings are hard to reverse reliably and the model
learns nothing useful from them. Prefer placeholders when you plan to restore.

---

## Try it

[RedactLocal](/) is a single 13 KB HTML file that does steps 1 and 4: it finds emails, phones,
government IDs, card numbers, IPs, JWTs and API keys, replaces them with consistent
placeholders, exports the mapping, and restores the originals afterwards. It runs entirely in the
tab — check the Network panel — and works offline.

The free version handles 5,000 characters at a time, which is enough to test the workflow on a real
ticket. If it earns a place in your process, the Pro version removes the limit and adds batch CSV
files.
