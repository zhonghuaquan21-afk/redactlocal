# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/); versions follow semver.

## [1.0.0] — 2026-11-11

First public release. Single-file browser app, MIT licensed, fully free (no license key, no limits).

### Detection

- 13 detector families: email, CN mobile, international phone, CN resident ID, bank/credit card,
  IPv4, API keys, JWT, Chinese name (context), name + honorific, Chinese address, user/customer ID,
  and `password:`-style secret values
- **JSON key-aware pass** — matches `"key": "value"` pairs and classifies by key name, so
  `"address": "江西省…"` is caught without any 地址 prefix. `goods_name` / `product_name` /
  `file_name` are explicitly excluded to avoid eating product names
- Chinese secret keywords (`密钥`, `密码`, `口令`, `令牌`) and full-width colon support
- Phone numbers with group separators (`138 1234 5678`, `138-1234-5678`) while still ignoring dates
- Single-character surnames before honorifics (`王女士`, `李经理`), with guards against
  `该女士` / `一位女士`
- User/customer identifiers: `用户编号：`, `"userId"`, and inline `用户U202601190087`

### Behaviour

- Four replacement modes: placeholder, partial mask, stable hash, remove
- Reversible via exported `mapping.csv`, with longest-placeholder-first substitution so
  `[EMAIL_1]` never eats `[EMAIL_10]`
- Batch CSV/TXT with quoting, embedded commas and newlines preserved
- `restore` panel to put real values back into an LLM's answer

### Deliberate trade-offs

- **Checksums never filter.** A bank card failing Luhn is redacted and flagged ("low confidence"),
  not silently dropped. Earlier behaviour dropped it, which meant a single mistyped digit made an
  entire card number pass through unredacted
- **ID card checksum is not enforced at all.** Synthetic and mistyped numbers are exactly what people
  paste into AI tools
- Weak card candidates additionally require plausible card shape (grouping or a known BIN prefix) so
  18-digit order numbers are not swallowed
- `password: hunter2` redacts only the value, keeping the field name readable for the model

### Testing

- 54 assertions covering five reference payloads, all detector families, over-redaction guards,
  consistency/idempotence, mapping round-trips, replacement modes, CSV parsing, and performance
- Tests extract the `<script>` block from `index.html` and run it against a DOM stub, so they exercise
  the shipped file rather than a copy
- Known limitations are reported separately and excluded from the pass rate

### Known limitations

Free-form names in prose, bare addresses without a prefix, English person names, full-width digits,
and indirect identifiers are not detected. See the README for the full list.
