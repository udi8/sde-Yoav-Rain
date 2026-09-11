// Multi-year average cumulative-rainfall curve, used to draw the reference
// line on the season chart.
//
// Sourced from the kibbutz's own paper rain-average table ("לוח גשם רב
// שנתי") — Negba station 1939/40-1990/91, Sde Yoav itself from 1991/92
// onward, 86 seasons total. Its "ממוצע רב שנתי" (multi-year average) row
// gives a real monthly average, not a guess:
//
//   ספט 1 | אוק 19 | נוב 68 | דצמ 118 | ינו 127 | פבר 86 | מרץ 55 |
//   אפר 15 | מאי 3 | יוני 0.22    (מ״מ, ממוצע לחודש)
//
// The table's own "סה״כ" (489mm) is the traditional total through the end
// of April — cumulative Sept-Apr above sums to exactly that. May and June
// add a further ~3.2mm of trace rain most years; July/August aren't
// tracked in the source table at all (effectively zero), so the curve
// stays flat past June.
//
// FULL_SEASON_AVERAGE_MM keeps the traditional end-of-April figure, since
// that's the number people actually mean by "the multi-year average" —
// the curve itself runs very slightly past it into May/June, which is
// expected and fine for a reference line.

export const FULL_SEASON_AVERAGE_MM = 489;

// [dayOfSeason (0 = Sept 1), cumulative average mm]
const ANCHORS = [
  [0, 0],
  [29, 1], // end of Sept
  [60, 20], // end of Oct
  [90, 88], // end of Nov
  [121, 206], // end of Dec
  [152, 333], // end of Jan
  [180, 419], // end of Feb
  [211, 474], // end of Mar
  [241, 489], // end of Apr — matches the table's own "סה״כ"
  [272, 492], // end of May
  [302, 492.2], // end of Jun
  [364, 492.2], // end of season — flat, no Jul/Aug data in the source table
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
