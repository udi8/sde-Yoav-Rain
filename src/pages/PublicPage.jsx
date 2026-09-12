import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReadings } from '../hooks/useReadings';
import { StatCard } from '../components/StatCard';
import { SeasonChart } from '../components/SeasonChart';
import { SeasonCompareChart } from '../components/SeasonCompareChart';
import { ReadingsTable } from '../components/ReadingsTable';
import { currentSeason, seasonLabel, sortedSeasons } from '../utils/season';
import { FULL_SEASON_AVERAGE_MM } from '../utils/historicalAverage';
import { formatDateIL } from '../utils/format';
import './PublicPage.css';

export function PublicPage() {
  const { readings, loading, error } = useReadings();
  const nowSeason = currentSeason();
  const [selectedSeason, setSelectedSeason] = useState(nowSeason);

  // Always include the current season as a selectable option, even before
  // it has any readings — otherwise the <select>'s value (defaulting to
  // nowSeason) matches none of its <option>s and the browser silently
  // displays a different one than what's actually shown below it.
  const seasons = useMemo(() => {
    const fromReadings = new Set(readings.map((r) => r.season));
    fromReadings.add(nowSeason);
    return sortedSeasons([...fromReadings]);
  }, [readings, nowSeason]);

  const latest = useMemo(() => {
    const seasonReadings = readings.filter((r) => r.season === nowSeason);
    return seasonReadings[seasonReadings.length - 1] || null;
  }, [readings, nowSeason]);

  const activeSeason = seasons.includes(selectedSeason) ? selectedSeason : nowSeason;

  const pctOfAvg = latest ? Math.round((latest.cumulativeMm / FULL_SEASON_AVERAGE_MM) * 100) : null;

  // The actual average across every completed season in the system so
  // far — informational only. FULL_SEASON_AVERAGE_MM (the 489 figure) is
  // the one everything else on the page compares against; this just notes
  // how our own recorded seasons compare to it, and updates on its own as
  // more seasons are added.
  const actualAverage = useMemo(() => {
    const bySeason = new Map();
    for (const r of readings) {
      if (r.season === nowSeason) continue; // exclude the still-in-progress season
      const prev = bySeason.get(r.season);
      if (!prev || r.date > prev.date) bySeason.set(r.season, r);
    }
    if (bySeason.size === 0) return null;
    const totals = [...bySeason.values()].map((r) => r.cumulativeMm);
    const avg = totals.reduce((sum, v) => sum + v, 0) / totals.length;
    return { count: totals.length, avg, diff: avg - FULL_SEASON_AVERAGE_MM };
  }, [readings, nowSeason]);

  const readingsTableRef = useRef(null);

  function handleSelectSeason(season) {
    setSelectedSeason(season);
    readingsTableRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  return (
    <div className="public-page">
      <header className="page-header">
        <div className="container header-row">
          <div>
            <h1>מד-גשם שדה יואב</h1>
            <p className="subtitle">מדידות יומיות של משקעים</p>
          </div>
          <Link to="/admin/login" className="admin-link">
            כניסת מנהלים
          </Link>
        </div>
      </header>

      <main className="container">
        {loading && <p className="loading">טוען נתונים…</p>}
        {error && <p className="error-msg">שגיאה בטעינת הנתונים: {error.message}</p>}

        {!loading && !error && (
          <>
            <section className="stats-grid">
              <StatCard
                label="גשם היום"
                value={latest ? latest.amountMm : '—'}
                unit="מ״מ"
                sub={
                  latest
                    ? [formatDateIL(latest.date), latest.enteredBy && `נמדד ע״י ${latest.enteredBy}`]
                        .filter(Boolean)
                        .join(' · ')
                    : 'אין נתונים עדיין'
                }
              />
              <StatCard
                label={`מצטבר לעונת ${seasonLabel(nowSeason)}`}
                value={latest ? latest.cumulativeMm : '—'}
                unit="מ״מ"
                sub={pctOfAvg !== null ? `${pctOfAvg}% מהממוצע הרב-שנתי` : undefined}
              />
              <StatCard
                label="ממוצע רב-שנתי לעונה"
                value={FULL_SEASON_AVERAGE_MM}
                unit="מ״מ"
                sub={
                  actualAverage
                    ? `ממוצע בפועל (${actualAverage.count} עונות במערכת): ${
                        Math.round(actualAverage.avg * 10) / 10
                      } מ״מ (${actualAverage.diff >= 0 ? '+' : ''}${
                        Math.round(actualAverage.diff * 10) / 10
                      })`
                    : undefined
                }
              />
            </section>

            <section className="season-select-row">
              <label htmlFor="season-select">היסטוריית עונה:</label>
              <select
                id="season-select"
                value={activeSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
              >
                {[...seasons].reverse().map((s) => (
                  <option key={s} value={s}>
                    {seasonLabel(s)}
                  </option>
                ))}
              </select>
            </section>

            <section>
              <SeasonChart season={activeSeason} readings={readings} />
            </section>

            <section>
              <SeasonCompareChart
                readings={readings}
                currentSeason={nowSeason}
                selectedSeason={activeSeason}
                onSelectSeason={handleSelectSeason}
              />
            </section>

            <section ref={readingsTableRef}>
              <ReadingsTable
                readings={readings.filter((r) => r.season === activeSeason)}
                seasonLabel={seasonLabel(activeSeason)}
              />
            </section>
          </>
        )}
      </main>

      <footer className="page-footer">
        <div className="container">
          <p>קיבוץ שדה יואב · נתוני משקעים נאספים מדי בוקר</p>
        </div>
      </footer>
    </div>
  );
}
