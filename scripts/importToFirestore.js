#!/usr/bin/env node
/**
 * One-time import: writes scripts/data/readings-import.json (produced by
 * parseWhatsapp.js) into the `readings` Firestore collection.
 *
 * Requires a service account key, since it writes to Firestore outside the
 * security rules (rules only allow the two admin emails via client auth).
 *
 *   1. Firebase Console → Project Settings → Service accounts → Generate
 *      new private key. Save it e.g. as ./serviceAccountKey.json
 *      (already gitignored via *adminsdk*.json — keep it out of git either way).
 *   2. node scripts/importToFirestore.js ./serviceAccountKey.json
 *
 * Safe to re-run: writes are `set` with merge, keyed by date, so re-running
 * after fixing a parsing issue just overwrites the same docs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [, , keyPath, dataPathArg] = process.argv;
if (!keyPath) {
  console.error('Usage: node scripts/importToFirestore.js <path-to-service-account-key.json> [readings.json]');
  process.exit(1);
}

const dataPath = dataPathArg || path.join('scripts', 'data', 'readings-import.json');
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
const readings = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  const BATCH_SIZE = 400; // Firestore batch limit is 500
  let written = 0;

  for (let i = 0; i < readings.length; i += BATCH_SIZE) {
    const chunk = readings.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const r of chunk) {
      const ref = db.collection('readings').doc(r.date);
      batch.set(
        ref,
        {
          date: r.date,
          season: r.season,
          amountMm: r.amountMm,
          cumulativeMm: r.cumulativeMm,
          note: r.note || null,
          source: r.source,
        },
        { merge: true }
      );
    }
    await batch.commit();
    written += chunk.length;
    console.log(`Wrote ${written}/${readings.length}`);
  }

  console.log('Import done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
