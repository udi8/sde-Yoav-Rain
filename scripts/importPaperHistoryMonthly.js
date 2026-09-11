#!/usr/bin/env node
// Full monthly-resolution replacement for importPaperHistory.js's
// season-total-only entries (1991/92-2020/21), transcribed from the paper
// "לוח גשם רב שנתי" table. Each season gets one reading per month-end
// (Sept-Jun; Jul/Aug aren't tracked in the source table), amountMm = that
// month's total, cumulativeMm = running total through that month.
//
// Source rows are keyed by the *printed* year on each line, but the
// physical page wasn't flat in its sleeve when photographed, so the
// printed total/months on a line actually belong to the season printed on
// the NEXT line down (confirmed by matching the last 4 rows against
// seasons we already have exact data for from the WhatsApp import: the
// shift makes every one of them line up within rounding). PRINTED_ROWS
// below is exactly as read off the page — the +1 shift is applied in code.
//
// Per-row checksums (sum of months vs. the row's own printed total) came
// out exact or within 1-5mm on every row except 1992/93, where two
// glare-obscured cells (Dec/Nov) only give a combined figure (100) — split
// as Dec=100/Nov=0, the more likely reading position, noted below.
//
//   node scripts/importPaperHistoryMonthly.js <path-to-service-account-key.json>
import fs from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [, , keyPath] = process.argv;
if (!keyPath) {
  console.error('Usage: node scripts/importPaperHistoryMonthly.js <path-to-service-account-key.json>');
  process.exit(1);
}

// Printed year on the row, and [Jun, May, Apr, Mar, Feb, Jan, Dec, Nov, Oct, Sept]
// exactly as they appear on that row (the real season is printedYear+1).
const PRINTED_ROWS = [
  [1990, [6, 1, 19, 299, 195, 426, 99, 14, 0, 0]], // -> 1991-1992
  [1991, [30, 0, 25, 197, 139, 281, 100, 0, 0, 0]], // -> 1992-1993 (Dec/Nov split estimated, see header note)
  [1992, [0, 48, 41, 123, 113, 15, 59, 2, 0, 0]], // -> 1993-1994
  [1993, [0, 26, 19, 110, 55, 198, 268, 59, 0, 0]], // -> 1994-1995
  [1994, [0, 8, 155, 51, 146, 90, 104, 0, 0, 0]], // -> 1995-1996
  [1995, [29, 6, 139, 178, 125, 71, 5, 59, 0, 0]], // -> 1996-1997
  [1996, [4, 0, 129, 22, 87, 131, 31, 6, 0, 0]], // -> 1997-1998
  [1997, [0, 13, 5, 23, 76, 8, 14, 2, 0, 0]], // -> 1998-1999
  [1998, [0, 1, 37, 68, 228, 18, 2, 1, 0, 0]], // -> 1999-2000
  [1999, [4, 0, 9, 75, 128, 177, 3, 140, 0, 0]], // -> 2000-2001
  [2000, [0, 19, 34, 35, 286, 171, 5, 15, 0, 0]], // -> 2001-2002
  [2001, [0, 2, 122, 286, 63, 215, 10, 10, 0, 0]], // -> 2002-2003
  [2002, [0, 4, 21, 89, 154, 106, 88, 2, 0, 0]], // -> 2003-2004
  [2003, [0, 2, 30, 93, 101, 48, 74, 0, 0, 0]], // -> 2004-2005
  [2004, [0, 30, 10, 35, 168, 101, 62, 15, 0, 0]], // -> 2005-2006
  [2005, [0, 4, 101, 73, 135, 107, 15, 68, 0, 0]], // -> 2006-2007
  [2006, [0, 0, 0, 100, 141, 59, 129, 1, 0, 0]], // -> 2007-2008
  [2007, [0, 8, 73, 100, 12, 59, 10, 77, 0, 0]], // -> 2008-2009
  [2008, [0, 2, 27, 68, 39, 93, 62, 32, 0, 1]], // -> 2009-2010
  [2009, [12, 28, 63, 63, 68, 101, 0, 2, 0, 1]], // -> 2010-2011
  [2010, [0, 0, 108, 151, 103, 73, 105, 2, 0, 0]], // -> 2011-2012
  [2011, [0, 13, 2, 51, 156, 173, 89, 0, 0, 4]], // -> 2012-2013
  [2012, [23, 0, 89, 6, 10, 358, 28, 1, 0, 0]], // -> 2013-2014
  [2013, [0, 43, 4, 89, 171, 36, 241, 34, 0, 2]], // -> 2014-2015
  [2014, [0, 10, 24, 105, 164, 84, 72, 72, 0, 0]], // -> 2015-2016
  [2015, [0, 1, 1, 74, 57, 150, 0, 0, 0, 0]], // -> 2016-2017
  [2016, [13, 8, 57, 4, 70, 204, 45, 22, 6, 1]], // -> 2017-2018
  [2017, [0, 0, 28, 117, 126, 71, 163, 57, 52, 0]], // -> 2018-2019
  [2018, [0, 4, 11, 116, 97, 312, 226, 10, 20, 0]], // -> 2019-2020
  [2019, [0, 0, 0, 38, 108, 139, 49, 234, 0, 0]], // -> 2020-2021
];

function isLeap(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function monthEndDates(seasonEndYear) {
  const febDays = isLeap(seasonEndYear) ? 29 : 28;
  const y0 = seasonEndYear - 1;
  const y1 = seasonEndYear;
  return [
    `${y0}-09-30`,
    `${y0}-10-31`,
    `${y0}-11-30`,
    `${y0}-12-31`,
    `${y1}-01-31`,
    `${y1}-02-${febDays}`,
    `${y1}-03-31`,
    `${y1}-04-30`,
    `${y1}-05-31`,
    `${y1}-06-30`,
  ];
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  let writes = [];
  for (const [printedYear, printedMonths] of PRINTED_ROWS) {
    const startYear = printedYear + 1;
    const endYear = startYear + 1;
    const season = `${startYear}-${endYear}`;
    // printedMonths is [Jun, May, Apr, Mar, Feb, Jan, Dec, Nov, Oct, Sept] -> chronological
    const chronological = [...printedMonths].reverse(); // [Sept, Oct, Nov, Dec, Jan, Feb, Mar, Apr, May, Jun]
    const dates = monthEndDates(endYear);

    let cumulative = 0;
    for (let i = 0; i < 10; i++) {
      cumulative = Math.round((cumulative + chronological[i]) * 10) / 10;
      writes.push({
        date: dates[i],
        season,
        amountMm: chronological[i],
        cumulativeMm: cumulative,
        note: 'מהלוח הרב-שנתי הכתוב (סה"כ חודשי)',
        source: 'historical',
        enteredBy: 'יגאל',
      });
    }
  }

  console.log(`Prepared ${writes.length} monthly readings across ${PRINTED_ROWS.length} seasons.`);

  const BATCH_SIZE = 400;
  let written = 0;
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const chunk = writes.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const w of chunk) batch.set(db.collection('readings').doc(w.date), w);
    await batch.commit();
    written += chunk.length;
    console.log(`Wrote ${written}/${writes.length}`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
