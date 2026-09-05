// A rainfall "season" runs September 1 -> August 31, matching how Yigal has
// always tracked it (and how Israeli rain years are conventionally counted).

export function seasonForDate(date) {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export function seasonStartYear(season) {
  return Number(season.split('-')[0]);
}

export function seasonLabel(season) {
  const [y1, y2] = season.split('-');
  return `${y1}/${y2.slice(2)}`; // "2021-2022" -> "2021/22"
}

export function dayOfSeason(date) {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const season = seasonForDate(d);
  const startYear = seasonStartYear(season);
  const seasonStart = new Date(startYear, 8, 1); // September 1
  return Math.floor((d - seasonStart) / (1000 * 60 * 60 * 24));
}

export function currentSeason() {
  return seasonForDate(new Date());
}

export function sortedSeasons(seasons) {
  return [...seasons].sort((a, b) => seasonStartYear(a) - seasonStartYear(b));
}
