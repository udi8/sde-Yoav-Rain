import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReadings } from '../hooks/useReadings';
import { StatCard } from '../components/StatCard';
import { SeasonChart } from '../components/SeasonChart';
import { SeasonCompareChart } from '../components/SeasonCompareChart';
import { currentSeason, seasonLabel, sortedSeasons } from '../utils/season';
import { FULL_SEASON_AVERAGE_MM } from '../utils/historicalAverage';
import './PublicPage.css';

export function PublicPage() {
  const { readings, loading, error } = useReadings();
  const nowSeason = currentSeason();
  const [selectedSeason, setSelectedSeason] = useState(nowSeason);

  const seasons = useMemo(() => sortedSeasons([...new Set(readings.map((r) => r.season))]), [readings]);

  const latest = useMemo(() => {
    const seasonReadings = readings.filter((r) => r.season === nowSeason);
    return seasonReadings[seasonReadings.length - 1] || null;
  }, [readings, nowSeason]);

  const activeSeason = seasons.includes(selectedSeason) ? selectedSeason : nowSeason;

  const pctOfAvg = latest ? Math.round((latest.cumulativeMm / FULL_SEASON_AVERAGE_MM) * 100) : null;

  return (
    <div className="public-page">
      <header className="page-header">
        <div className="container header-row">
          <div>
            <h1>מד-גשם שדה יואב</h1>
            <p className="subtitle">מדידות יומיות מאת יגאל שרוני</p>
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
                sub={latest ? new Date(latest.date).toLocaleDateString('he-IL') : 'אין נתונים עדיין'}
              />
              <StatCard
                label={`מצטבר לעונת ${seasonLabel(nowSeason)}`}
                value={latest ? latest.cumulativeMm : '—'}
                unit="מ״מ"
                sub={pctOfAvg !== null ? `${pctOfAvg}% מהממוצע הרב-שנתי` : undefined}
              />
              <StatCard label="ממוצע רב-שנתי לעונה" value={FULL_SEASON_AVERAGE_MM} unit="מ״מ" />
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
              <SeasonCompareChart readings={readings} currentSeason={nowSeason} />
            </section>
          </>
        )}
      </main>

      <footer className="page-footer">
        <div className="container">
          <p>קיבוץ שדה יואב · נתוני משקעים נאספים על ידי יגאל שרוני מדי בוקר</p>
        </div>
      </footer>
    </div>
  );
}
