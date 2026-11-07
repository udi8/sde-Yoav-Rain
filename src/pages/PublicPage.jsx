import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReadings } from '../hooks/useReadings';
import { FieldHeader } from '../components/FieldHeader';
import { RainGauge } from '../components/RainGauge';
import { SeasonChart } from '../components/SeasonChart';
import { SeasonCompareChart } from '../components/SeasonCompareChart';
import { ReadingsTable } from '../components/ReadingsTable';
import { currentSeason, seasonLabel, sortedSeasons } from '../utils/season';
import { FULL_SEASON_AVERAGE_MM } from '../utils/historicalAverage';
import { formatWeekdayShortIL } from '../utils/format';
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

  // Clicking a bar in the chart just highlights that season in place — the
  // chart is what you're looking at, so the page shouldn't jump away from
  // it. Clicking a row in the season list below it is a more deliberate
  // "show me that season's readings" action, so that one still scrolls
  // down to the detail list.
  function handleSelectSeason(season, { scroll = false } = {}) {
    setSelectedSeason(season);
    if (scroll) {
      readingsTableRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }

  return (
    <div className="public-page">
      <FieldHeader height={140} />

      <header className="page-header">
        <div className="container header-row">
          <div className="title-block">
            <span className="kicker">★ מד הגשם ★</span>
            <h1>שדה יואב</h1>
          </div>
          <span className="season-badge">חורף {seasonLabel(nowSeason)}</span>
        </div>
        <div className="container">
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
            <section className="today-tag card">
              <div className="today-tag-top">
                <span className="kicker">
                  {latest ? `גשם היום · ${formatWeekdayShortIL(latest.date)}` : 'גשם היום'}
                </span>
                <span className="punch-hole" aria-hidden="true" />
              </div>

              {latest ? (
                <>
                  <div className="today-tag-hero">
                    <div className="today-tag-main">
                      <div className="today-tag-amount">
                        <span className="today-amount-num">
                          <bdi>{latest.amountMm}</bdi>
                        </span>
                        <span className="today-amount-unit">מ״מ</span>
                      </div>
                      <div className="today-tag-meta">
                        <span>הוזן ע״י</span>
                        <span className="signature">{latest.enteredBy || '—'}</span>
                      </div>
                    </div>
                    <RainGauge total={latest.cumulativeMm} average={FULL_SEASON_AVERAGE_MM} />
                  </div>

                  <div className="today-tag-stats">
                    <div className="today-stat">
                      <span className="today-stat-label">מצטבר לעונה</span>
                      <span className="today-stat-value">
                        <bdi>{latest.cumulativeMm}</bdi> <small>מ״מ</small>
                      </span>
                    </div>
                    <div className="today-stat today-stat-accent">
                      <span className="today-stat-label">מהממוצע ({FULL_SEASON_AVERAGE_MM})</span>
                      <span className="today-stat-value">
                        <bdi>{pctOfAvg}</bdi>%
                      </span>
                    </div>
                  </div>

                  {actualAverage && (
                    <p className="today-tag-note">
                      ממוצע בפועל ({actualAverage.count} עונות במערכת):{' '}
                      <bdi>{Math.round(actualAverage.avg * 10) / 10}</bdi> מ״מ (
                      <bdi>
                        {actualAverage.diff >= 0 ? '+' : ''}
                        {Math.round(actualAverage.diff * 10) / 10}
                      </bdi>
                      )
                    </p>
                  )}
                </>
              ) : (
                <p className="today-empty">אין עדיין נתונים לעונה זו</p>
              )}
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

            <section className="season-chart-section">
              <SeasonChart season={activeSeason} readings={readings} />
            </section>

            <section className="compare-section">
              <SeasonCompareChart
                readings={readings}
                currentSeason={nowSeason}
                selectedSeason={activeSeason}
                onSelectSeason={handleSelectSeason}
              />
            </section>

            <section className="readings-section" ref={readingsTableRef}>
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
