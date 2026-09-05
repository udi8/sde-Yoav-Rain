#!/usr/bin/env node
// One-time backfill: sets `enteredBy` on readings written before that field
// existed (the WhatsApp import and any historical entries), so the public
// page's "נמדד ע״י" attribution and the admin table's column aren't blank
// for old rows. Safe to re-run — it only touches docs missing the field.
//
//   node scripts/backfillEnteredBy.js <path-to-service-account-key.json> <name>
import fs from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [, , keyPath, name] = process.argv;
if (!keyPath || !name) {
  console.error('Usage: node scripts/backfillEnteredBy.js <path-to-service-account-key.json> <name>');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  const snap = await db.collection('readings').where('source', '!=', 'manual').get();
  const toUpdate = snap.docs.filter((d) => !d.data().enteredBy);

  const BATCH_SIZE = 400;
  let written = 0;
  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const chunk = toUpdate.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const doc of chunk) batch.update(doc.ref, { enteredBy: name });
    await batch.commit();
    written += chunk.length;
    console.log(`Updated ${written}/${toUpdate.length}`);
  }

  console.log(`Done. ${toUpdate.length} of ${snap.size} non-manual readings updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
