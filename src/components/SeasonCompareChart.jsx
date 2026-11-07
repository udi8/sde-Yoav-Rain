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
import wheatUrl from '../assets/wheat.svg';
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

  const maxTotal = Math.max(...data.map((d) => d.totalMm), 1);
  const recordTotal = Math.max(...data.filter((d) => !d.ongoing).map((d) => d.totalMm), 0);

  return (
    <div className="compare">
      <div className="compare-header">
        <h3>השוואה בין עונות</h3>
        <span className="compare-sub">קו מקווקו = ממוצע רב-שנתי ({FULL_SEASON_AVERAGE_MM} מ״מ)</span>
      </div>
      {/* The table below repeats this data accessibly (including the same
          season-select behavior via its rows), so the chart itself stays
          hidden from screen readers rather than exposing an unlabeled SVG —
          aria-hidden doesn't affect the bars' onClick for mouse/touch users. */}
      <div aria-hidden="true">
      <ResponsiveContainer width="100%" height={240} debounce={50}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--ink)" tick={{ fontFamily: 'Karantina', fontSize: 16, fill: 'var(--ink)' }} />
          <YAxis stroke="var(--ink)" tick={{ fontFamily: 'Karantina', fontSize: 14, fill: 'var(--ink)' }} width={40} />
          <ReferenceLine
            y={FULL_SEASON_AVERAGE_MM}
            stroke="var(--earth)"
            strokeDasharray="6 4"
            strokeWidth={1.5}
          />
          <Tooltip
            cursor={false}
            formatter={(value, _name, item) => [
              `${value} מ״מ (${item.payload.pctOfAvg}% מהממוצע)`,
              item.payload.ongoing ? 'מצטבר עד כה' : 'סה״כ עונה',
            ]}
            contentStyle={{
              background: 'var(--tag)',
              border: '1.5px dashed var(--earth)',
              borderRadius: 2,
              fontFamily: 'Assistant, sans-serif',
            }}
          />
          <Bar
            dataKey="totalMm"
            radius={0}
            onClick={(item) => onSelectSeason?.(item.season, { scroll: false })}
            style={{ cursor: onSelectSeason ? 'pointer' : undefined }}
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell
                key={d.season}
                fill={d.season === selectedSeason ? 'var(--earth)' : 'var(--green)'}
              />
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
          </tr>
        </thead>
        <tbody>
          {[...data].reverse().map((d) => {
            const isRecord = !d.ongoing && d.totalMm === recordTotal;
            return (
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
                <td className={isRecord ? 'compare-season-record' : undefined}>
                  {d.label}
                  {d.ongoing && <span className="season-badge-small">מתמשכת</span>}
                </td>
                <td>
                  <div className="compare-bar-cell">
                    <div
                      className="compare-bar"
                      style={{
                        width: `${Math.max((d.totalMm / maxTotal) * 100, 3)}%`,
                        background: isRecord ? 'var(--earth)' : 'var(--green)',
                      }}
                    />
                    <img src={wheatUrl} alt="" className="compare-bar-wheat" />
                    <bdi className={isRecord ? 'compare-total compare-season-record' : 'compare-total'}>
                      {d.totalMm}
                    </bdi>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
