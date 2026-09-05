// Approximate multi-year average cumulative-rainfall curve, used to draw the
// reference line on the season chart.
//
// There is no full historical daily/monthly average table yet (paper
// records from 1991 haven't been digitized — see the "היסטוריה"
// admin page). Until that exists, this curve is reconstructed from the few
// reference points mentioned in the WhatsApp group over the years:
//
//   - end of Dec 2021: actual was 60% of the seasonal-average-to-date
//     (actual ~121.5mm -> avg ~202mm)
//   - end of Jan 2022: 120% of seasonal-average-to-date, 82% of full-season
//     average (actual ~395mm -> avg-to-date ~329mm, full-season avg ~482mm)
//   - end of Feb 2022: 114% of period average, 97% of full-season average
//     (actual ~468.5mm -> avg-to-date ~411mm, full-season avg ~483mm)
//   - "ממוצע רב שנתי: 485 מ״מ" (full-season average, quoted directly)
//   - "ממוצע רב שנתי לסוף אפריל: 489 מ״מ" (avg-to-date at end of April)
//
// Points between these anchors (Sept/Oct/Nov, and March) are *not* backed by
// a quoted figure — they're a straight-line guess between the nearest known
// anchors. Treat this whole curve as approximate: good enough to draw a
// reference line on the chart, not for anything more precise. Update
// FULL_SEASON_AVERAGE_MM and the anchors below once real historical data is
// imported (see the admin "היסטוריה" page).

export const FULL_SEASON_AVERAGE_MM = 489;

// [dayOfSeason (0 = Sept 1), cumulative average mm]
const ANCHORS = [
  [0, 0],
  [60, 15], // end of Oct — no source, light-rain estimate
  [91, 70], // end of Nov — no source, estimate
  [121, 202], // end of Dec — derived from the 60% quote above
  [152, 329], // end of Jan — derived from the 120% / 82% quotes above
  [180, 411], // end of Feb — derived from the 114% / 97% quotes above
  [211, 460], // end of Mar — interpolated, no direct source
  [242, 489], // end of Apr — quoted directly ("489 מ״מ")
  [273, 489], // end of May — flat, negligible rain this late
  [365, 489], // end of season — flat
];

export function averageCumulativeAtDay(day) {
  const clamped = Math.max(0, Math.min(day, ANCHORS[ANCHORS.length - 1][0]));
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [d0, v0] = ANCHORS[i];
    const [d1, v1] = ANCHORS[i + 1];
    if (clamped >= d0 && clamped <= d1) {
      const t = d1 === d0 ? 0 : (clamped - d0) / (d1 - d0);
      return v0 + t * (v1 - v0);
    }
  }
  return FULL_SEASON_AVERAGE_MM;
}

export function averageCurve(stepDays = 7) {
  const points = [];
  for (let d = 0; d <= 365; d += stepDays) {
    points.push({ day: d, avgMm: Math.round(averageCumulativeAtDay(d) * 10) / 10 });
  }
  return points;
}
