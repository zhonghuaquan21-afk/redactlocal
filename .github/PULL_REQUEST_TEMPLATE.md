## What does this change?

<!-- One or two sentences. -->

## Why?

<!-- The problem being solved. Link the issue if there is one. -->

## Checklist

- [ ] A failing test was added for the new behaviour **before** the fix (`test/run.js`)
- [ ] `npm test` passes on both builds
- [ ] `npm run build:cn` was run if any UI string changed, and `cn/index.html` is committed
- [ ] No network calls were introduced (`fetch`, `XMLHttpRequest`, `sendBeacon`, remote assets)
- [ ] New UI strings exist in both `en` and `zh` of the `I18N` table
- [ ] No real personal data in tests, fixtures, screenshots or commit messages

## Notes for the reviewer

<!-- Trade-offs, things you are unsure about, follow-ups. -->
