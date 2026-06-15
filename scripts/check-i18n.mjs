#!/usr/bin/env node
// i18n parity checker: ensures every locale has the exact same set of keys as en.json.
// No dependencies. Run with: node scripts/check-i18n.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, "..", "src", "i18n", "locales");

const BASE = "en";
const LOCALES = ["de", "es", "fr", "nl"];

function load(locale) {
  const path = join(localesDir, `${locale}.json`);
  return JSON.parse(readFileSync(path, "utf8"));
}

// Flatten a nested object into a Set of dot-delimited leaf-key paths.
function flatten(obj, prefix = "", out = new Set()) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, path, out);
    } else {
      out.add(path);
    }
  }
  return out;
}

const baseKeys = flatten(load(BASE));
let hasError = false;

for (const locale of LOCALES) {
  let localeKeys;
  try {
    localeKeys = flatten(load(locale));
  } catch (err) {
    console.error(`[${locale}] failed to load/parse: ${err.message}`);
    hasError = true;
    continue;
  }

  const missing = [...baseKeys].filter((k) => !localeKeys.has(k)).sort();
  const extra = [...localeKeys].filter((k) => !baseKeys.has(k)).sort();

  if (missing.length === 0 && extra.length === 0) {
    console.log(`[${locale}] OK — ${localeKeys.size} keys, full parity with ${BASE}.`);
    continue;
  }

  hasError = true;
  console.error(`[${locale}] MISMATCH — ${missing.length} missing, ${extra.length} extra.`);
  if (missing.length) {
    console.error(`  Missing keys (present in ${BASE}, absent in ${locale}):`);
    for (const k of missing) console.error(`    - ${k}`);
  }
  if (extra.length) {
    console.error(`  Extra keys (present in ${locale}, absent in ${BASE}):`);
    for (const k of extra) console.error(`    + ${k}`);
  }
}

if (hasError) {
  console.error("\ni18n parity check FAILED.");
  process.exit(1);
} else {
  console.log(`\ni18n parity check passed for all locales (${baseKeys.size} keys each).`);
}
