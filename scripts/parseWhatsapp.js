#!/usr/bin/env node
/**
 * Parses a WhatsApp chat export (_chat.txt) of Yigal Sharoni's daily rainfall
 * reports into structured JSON rainfall readings.
 *
 * Usage:
 *   node scripts/parseWhatsapp.js <path-to-_chat.txt> [output.json]
 *
 * Message shape in the export (one WhatsApp message, exported as 2+ lines):
 *   [DD/MM/YYYY, H:MM:SS] Yigal Sharoni: 20.5 ממ
 *   מצטבר: 43.5 ממ
 *
 * Known noise the regexes below tolerate:
 *  - unit written as "ממ", "מ"מ", "מ״מ", or omitted entirely
 *  - unit glued to the number ("17.5ממ")
 *  - "מצטבר" with or without ":", with a stray "," before the colon,
 *    with 1-2 spaces around the colon, with or without a trailing unit
 *  - trailing note lines (measurement-time remarks, "crossed the average"
 *    remarks) kept as `note`, never parsed as data
 *  - non-numeric messages (chit-chat, monthly summaries, links, photos)
 *    are skipped entirely and reported at the end for manual review
 */
import fs from 'node:fs';
import path from 'node:path';

const SENDER = 'Yigal Sharoni';

const HEADER_RE =
  /^‎?\[(\d{2})\/(\d{2})\/(\d{4}), (\d{1,2}):(\d{2}):(\d{2})\] ([^:]+): (.*)$/;

// A message body that is *only* a rainfall amount, e.g. "20.5 ממ", "11.5", "17.5ממ"
const AMOUNT_RE = /^(\d+(?:[.,]\d+)?)\s*(?:מ+["׳״]?מ)?\.?\s*$/;

// A "מצטבר: Y ממ" line, tolerant of the noise described above.
const CUMULATIVE_RE =
  /^מצטבר\s*,?\s*:?\s*(\d+(?:[.,]\d+)?)\s*(?:מ+["׳״]?מ)?\.?\s*$/;

// Rare same-line form: "1.2 מצטבר: 177.7" (amount and cumulative on one line).
const AMOUNT_AND_CUMULATIVE_RE =
  /^(\d+(?:[.,]\d+)?)\s*מ*\s*מצטבר\s*,?\s*:?\s*(\d+(?:[.,]\d+)?)/;

// Yigal occasionally sends a follow-up message correcting a typo in the same
// day's cumulative total ("תיקון טעות: מצטבר: 346 ממ", "אופס, 439.5 ממ",
// "399.5 כמובן"). These are found by hand in the source chat (see below)
// rather than guessed by regex, since a generic "any lone number = a
// correction" rule would misfire on unrelated chit-chat containing numbers
// (prices, phone numbers, dates).
const MANUAL_CUMULATIVE_CORRECTIONS = {
  '2024-01-13': 221.5, // deleted message + correction superseded the original 233.5
  '2024-01-30': 346, // "תיקון טעות:"
  '2024-02-14': 399.5, // "399.5 כמובן" corrected an obvious typo (499.5)
  '2024-02-28': 439.5, // "אופס, 439.5 ממ" corrected an obvious typo (539.5)
};

function seasonForDate(year, month) {
  // Season runs September -> August. month is 1-12.
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function parseNum(s) {
  return parseFloat(s.replace(',', '.'));
}

function parseChat(text) {
  const rawLines = text.split(/\r?\n/);

  // Group into blocks: each block starts at a header line and swallows
  // any following lines that are NOT a new header (WhatsApp multi-line
  // messages are exported without a repeated [date] prefix).
  const blocks = [];
  for (const line of rawLines) {
    const m = line.match(HEADER_RE);
    if (m) {
      blocks.push({
        day: m[1],
        month: m[2],
        year: m[3],
        hour: m[4],
        minute: m[5],
        second: m[6],
        sender: m[7].trim(),
        lines: [m[8]],
      });
    } else if (blocks.length && line.trim() !== '') {
      blocks[blocks.length - 1].lines.push(line.trim());
    }
  }

  const readings = [];
  const skipped = [];

  for (const b of blocks) {
    if (b.sender !== SENDER) continue;

    const bodyLines = b.lines.map((l) => l.trim()).filter(Boolean);
    if (bodyLines.length === 0) continue;

    let amountMm;
    let cumulativeMm = null;
    const noteLines = [];

    const sameLineMatch = bodyLines[0].match(AMOUNT_AND_CUMULATIVE_RE);
    const amountMatch = bodyLines[0].match(AMOUNT_RE);

    if (sameLineMatch) {
      amountMm = parseNum(sameLineMatch[1]);
      cumulativeMm = parseNum(sameLineMatch[2]);
      noteLines.push(...bodyLines.slice(1));
    } else if (amountMatch) {
      amountMm = parseNum(amountMatch[1]);
      for (let i = 1; i < bodyLines.length; i++) {
        const cm = bodyLines[i].match(CUMULATIVE_RE);
        if (cm && cumulativeMm === null) {
          cumulativeMm = parseNum(cm[1]);
        } else {
          noteLines.push(bodyLines[i]);
        }
      }
    } else {
      skipped.push({
        date: `${b.year}-${b.month}-${b.day}`,
        preview: bodyLines[0].slice(0, 60),
      });
      continue;
    }

    const date = `${b.year}-${b.month}-${b.day}`;
    const season = seasonForDate(Number(b.year), Number(b.month));

    readings.push({
      date,
      season,
      amountMm,
      cumulativeMm, // may be null if Yigal didn't report it that day
      note: noteLines.length ? noteLines.join(' ') : null,
      source: 'whatsapp-import',
      reportedAt: `${b.year}-${b.month}-${b.day}T${b.hour.padStart(2, '0')}:${b.minute}:${b.second}`,
    });
  }

  // Guard against duplicate dates (two readings same day) — keep the last,
  // but warn so it can be checked by hand.
  const byDate = new Map();
  const duplicates = [];
  for (const r of readings) {
    if (byDate.has(r.date)) duplicates.push(r.date);
    byDate.set(r.date, r);
  }

  const deduped = Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const corrected = [];
  for (const r of deduped) {
    if (Object.prototype.hasOwnProperty.call(MANUAL_CUMULATIVE_CORRECTIONS, r.date)) {
      const fixed = MANUAL_CUMULATIVE_CORRECTIONS[r.date];
      if (r.cumulativeMm !== fixed) {
        r.cumulativeMm = fixed;
        r.note = [r.note, '(מצטבר תוקן ידנית לפי הודעת תיקון בצ׳אט)']
          .filter(Boolean)
          .join(' ');
        corrected.push(r.date);
      }
    }
  }

  // A handful of readings have no "מצטבר" line at all (Yigal just sent the
  // day's amount). Fill those in as running total = previous known
  // cumulative + today's amount, scoped per season.
  const filled = [];
  let runningTotal = null;
  let currentSeason = null;
  for (const r of deduped) {
    if (r.season !== currentSeason) {
      currentSeason = r.season;
      runningTotal = 0;
    }
    if (r.cumulativeMm !== null) {
      runningTotal = r.cumulativeMm;
    } else {
      runningTotal += r.amountMm;
      r.cumulativeMm = runningTotal;
      r.note = [r.note, '(מצטבר חושב אוטומטית: יום קודם + כמות היום, לא דווח בצ׳אט)']
        .filter(Boolean)
        .join(' ');
      filled.push(r.date);
    }
  }

  return { readings: deduped, skipped, duplicates, corrected, filled };
}

function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath) {
    console.error('Usage: node scripts/parseWhatsapp.js <path-to-_chat.txt> [output.json]');
    process.exit(1);
  }

  const text = fs.readFileSync(inputPath, 'utf8');
  const { readings, skipped, duplicates, corrected, filled } = parseChat(text);

  const out = outputPath || path.join('scripts', 'data', 'readings-import.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(readings, null, 2), 'utf8');

  console.log(`Parsed ${readings.length} rainfall readings -> ${out}`);

  if (filled.length) {
    console.log(`\n${filled.length} reading(s) had no "מצטבר" line — cumulative auto-computed (previous + today's amount):`);
    for (const d of filled) console.log(`  - ${d}`);
  }

  if (corrected.length) {
    console.log(`\n${corrected.length} reading(s) had a manual cumulative correction applied:`);
    for (const d of corrected) console.log(`  - ${d}`);
  }

  if (duplicates.length) {
    console.log(`\n${duplicates.length} duplicate date(s) found (kept the later message):`);
    for (const d of duplicates) console.log(`  - ${d}`);
  }

  if (skipped.length) {
    console.log(`\n${skipped.length} message(s) from ${SENDER} skipped (not a plain rainfall number — review manually):`);
    for (const s of skipped) console.log(`  - ${s.date}: "${s.preview}"`);
  }
}

main();
