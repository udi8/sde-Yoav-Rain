import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { sortedSeasons, seasonLabel } from '../utils/season';
import { FULL_SEASON_AVERAGE_MM } from '../utils/historicalAverage';
import './SeasonCompareChart.css';

export function SeasonCompareChart({ readings, currentSeason, selectedSeason, onSelectSeason }) {
  const bySeason = new Map();
  for (const r of readings) {
    const prev = bySeason.get(r.season);
    if (!prev || r.date > prev.date) bySeason.set(r.season, r);
  }

  const seasons = sortedSeasons([...bySeason.keys()]);
  const data = seasons.map((s) => {
    const last = bySeason.get(s);
    return {
      season: s,
      label: seasonLabel(s),
      totalMm: last.cumulativeMm,
      ongoing: s === currentSeason,
      pctOfAvg: Math.round((last.cumulativeMm / FULL_SEASON_AVERAGE_MM) * 100),
    };
  });

  return (
    <div className="compare card">
      <div className="compare-header">
        <h3>השוואה בין עונות</h3>
        <span className="compare-sub">קו מקווקו = ממוצע רב-שנתי ({FULL_SEASON_AVERAGE_MM} מ״מ)</span>
      </div>
      {/* The table below repeats this data accessibly (including the same
          season-select behavior via its rows), so the chart itself stays
          hidden from screen readers rather than exposing an unlabeled SVG —
          aria-hidden doesn't affect the bars' onClick for mouse/touch users. */}
      <div aria-hidden="true">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} />
          <YAxis stroke="var(--text-muted)" fontSize={12} width={44} />
          <ReferenceLine
            y={FULL_SEASON_AVERAGE_MM}
            stroke="var(--rain-avg)"
            strokeDasharray="6 4"
            strokeWidth={2}
          />
          <Tooltip
            cursor={false}
            formatter={(value, _name, item) => [
              `${value} מ״מ (${item.payload.pctOfAvg}% מהממוצע)`,
              item.payload.ongoing ? 'מצטבר עד כה' : 'סה״כ עונה',
            ]}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
            }}
          />
          <Bar
            dataKey="totalMm"
            radius={[6, 6, 0, 0]}
            onClick={(item) => onSelectSeason?.(item.season, { scroll: false })}
            style={{ cursor: onSelectSeason ? 'pointer' : undefined }}
          >
            {data.map((d) => (
              <Cell key={d.season} fill={d.season === selectedSeason ? 'var(--accent)' : 'var(--rain)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>

      <table className="compare-table">
        <thead>
          <tr>
            <th>עונה</th>
            <th>{'מ"מ'}</th>
            <th>% מהממוצע</th>
          </tr>
        </thead>
        <tbody>
          {[...data].reverse().map((d) => (
            <tr
              key={d.season}
              className={d.season === selectedSeason ? 'compare-row-selected' : undefined}
              onClick={() => onSelectSeason?.(d.season, { scroll: true })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSeason?.(d.season, { scroll: true });
                }
              }}
              role={onSelectSeason ? 'button' : undefined}
              tabIndex={onSelectSeason ? 0 : undefined}
            >
              <td>
                {d.label}
                {d.ongoing && <span className="tag">מתמשכת</span>}
              </td>
              <td>{d.totalMm}</td>
              <td className={d.pctOfAvg >= 100 ? 'pct-high' : 'pct-low'}>
                <span aria-hidden="true">{d.pctOfAvg >= 100 ? '▲' : '▼'} </span>
                {d.pctOfAvg}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
