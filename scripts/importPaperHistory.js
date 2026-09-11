#!/usr/bin/env node
// One-time import of season totals (1991/92-2020/21) transcribed from the
// kibbutz's paper "לוח גשם רב שנתי" table (photographed, see conversation).
// Seasons 2021/22 onward already have accurate day-by-day data from the
// WhatsApp import, so aren't included here.
//
// Only the season total is known (not daily/even monthly breakdown at
// reliable precision), so each season becomes a single reading dated at
// the conventional "end of season" point (April 30 - see historicalAverage.js
// for why that's the traditional cutoff this table itself uses), with
// amountMm left null.
//
//   node scripts/importPaperHistory.js <path-to-service-account-key.json>
import fs from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [, , keyPath] = process.argv;
if (!keyPath) {
  console.error('Usage: node scripts/importPaperHistory.js <path-to-service-account-key.json>');
  process.exit(1);
}

// [seasonStartYear, totalMm]
const SEASON_TOTALS = [
  [1991, 1059],
  [1992, 772],
  [1993, 401],
  [1994, 735],
  [1995, 554],
  [1996, 612],
  [1997, 410],
  [1998, 141],
  [1999, 355],
  [2000, 536],
  [2001, 564],
  [2002, 707],
  [2003, 462],
  [2004, 346],
  [2005, 420],
  [2006, 502],
  [2007, 429],
  [2008, 338],
  [2009, 323],
  [2010, 334],
  [2011, 544],
  [2012, 483],
  [2013, 515],
  [2014, 617],
  [2015, 530],
  [2016, 284],
  [2017, 427],
  [2018, 613],
  [2019, 794],
  [2020, 567],
];

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  const batch = db.batch();
  for (const [startYear, totalMm] of SEASON_TOTALS) {
    const endYear = startYear + 1;
    const season = `${startYear}-${endYear}`;
    const date = `${endYear}-04-30`;
    const ref = db.collection('readings').doc(date);
    batch.set(ref, {
      date,
      season,
      amountMm: null,
      cumulativeMm: totalMm,
      note: 'מהלוח הרב-שנתי הכתוב (סה"כ לעונה, ללא פירוט יומי)',
      source: 'historical',
      enteredBy: 'יגאל',
    });
  }
  await batch.commit();
  console.log(`Imported ${SEASON_TOTALS.length} season totals.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
