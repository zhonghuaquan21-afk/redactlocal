#!/usr/bin/env node
/**
 * RedactLocal — offline license key generator (keep this file private!)
 *
 * Usage:
 *   node genkey.js            -> one new key
 *   node genkey.js 10         -> ten new keys (for a batch of buyers)
 *   node genkey.js --check RL-XXXX-XXXX-XXXX
 *
 * Key format: RL-AAAA-BBBB-CCCC
 *   CCCC = checksum over AAAA + BBBB + SECRET
 * The same SECRET must exist inside index.html (LICENSE_SECRET).
 * To rotate, change both, and old keys stop working.
 */
const crypto = require("crypto");

const SECRET = "REDACTLOCAL-2025-a7f3";

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid typos
function block(len = 4) {
  const bytes = crypto.randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

function checksum(a, b) {
  return fnv1a(a + b + SECRET).toString(36).toUpperCase().padStart(7, "0").slice(0, 4);
}

function makeKey() {
  const a = block(4);
  const b = block(4);
  return `RL-${a}-${b}-${checksum(a, b)}`;
}

function validKey(key) {
  const m = /^RL-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/.exec((key || "").trim().toUpperCase());
  if (!m) return false;
  return m[3] === checksum(m[1], m[2]) || m[3] === checksum(m[2], m[1]);
}

const args = process.argv.slice(2);
if (args[0] === "--check") {
  const k = args[1];
  console.log(validKey(k) ? `VALID   ${k.trim().toUpperCase()}` : `INVALID ${k}`);
} else {
  const n = Math.max(1, Math.min(500, parseInt(args[0] || "1", 10) || 1));
  for (let i = 0; i < n; i++) console.log(makeKey());
}
