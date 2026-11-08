import { useEffect, useRef, useState } from 'react';
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
  Brush,
} from 'recharts';
import { sortedSeasons, seasonLabel } from '../utils/season';
import { FULL_SEASON_AVERAGE_MM } from '../utils/historicalAverage';
import wheatUrl from '../assets/wheat.svg';
import './SeasonCompareChart.css';

// A second, compact chart below the main one holds the brush control: it
// always shows every season (the "zoomed all the way out" overview), and
// dragging its handles re-slices the data array fed to the main chart above
// it. (Recharts' own built-in Brush-drives-its-parent-chart auto-zoom
// doesn't actually re-slice a sibling Bar in this recharts version, so the
// slicing is done by hand here instead of relying on that.) Only shown once
// there's more than this many seasons to zoom through in the first place.
const MIN_ZOOM_SEASONS = 5;

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

  const lastIndex = Math.max(0, data.length - 1);

  // The brush itself is left uncontrolled (no startIndex/endIndex props):
  // feeding its own drag output back to it as controlled props fights its
  // internal drag tracking and makes the handles feel stuck. Instead
  // `range` (read from onChange) drives the slice handed to the main
  // chart's data, and `brushKey` is bumped to force a clean remount back to
  // the full view on reset or when the season count changes.
  const [range, setRange] = useState({ startIndex: 0, endIndex: lastIndex });
  const [brushKey, setBrushKey] = useState(0);
  const prevLastIndex = useRef(lastIndex);

  useEffect(() => {
    if (lastIndex === prevLastIndex.current) return;
    prevLastIndex.current = lastIndex;
    setRange({ startIndex: 0, endIndex: lastIndex });
    setBrushKey((k) => k + 1);
  }, [lastIndex]);

  function handleBrushChange(next) {
    if (!next || next.startIndex == null || next.endIndex == null) return;
    setRange({ startIndex: next.startIndex, endIndex: next.endIndex });
  }

  function resetZoom() {
    setRange({ startIndex: 0, endIndex: lastIndex });
    setBrushKey((k) => k + 1);
  }

  const isZoomed = range.startIndex > 0 || range.endIndex < lastIndex;
  const visibleData = data.slice(range.startIndex, range.endIndex + 1);

  return (
    <div className="compare">
      <div className="compare-header">
        <h3>השוואה בין עונות</h3>
        <span className="compare-sub">קו מקווקו = ממוצע רב-שנתי ({FULL_SEASON_AVERAGE_MM} מ״מ)</span>
      </div>
      {data.length > MIN_ZOOM_SEASONS && (
        <div className="compare-zoom-row">
          <span className="compare-zoom-hint">גרור את הידיות כדי להתמקד בעונות ספציפיות</span>
          {isZoomed && (
            <button type="button" className="compare-zoom-reset" onClick={resetZoom}>
              לתצוגה המלאה
            </button>
          )}
        </div>
      )}
      {/* The table below repeats this data accessibly (including the same
          season-select behavior via its rows), so the chart itself stays
          hidden from screen readers rather than exposing an unlabeled SVG —
          aria-hidden doesn't affect the bars' onClick for mouse/touch users. */}
      <div aria-hidden="true">
      <ResponsiveContainer width="100%" height={240} debounce={50}>
        <BarChart data={visibleData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
          >
            {visibleData.map((d) => (
              <Cell
                key={d.season}
                fill={d.season === selectedSeason ? 'var(--earth)' : 'var(--green)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {data.length > MIN_ZOOM_SEASONS && (
        <ResponsiveContainer width="100%" height={32} debounce={50}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Brush
              key={brushKey}
              dataKey="totalMm"
              height={28}
              travellerWidth={10}
              onChange={handleBrushChange}
              stroke="var(--rule-soft)"
              fill="var(--tag-inner)"
              tickFormatter={(i) => data[i]?.label || ''}
            >
              <BarChart data={data}>
                <Bar dataKey="totalMm" fill="var(--wheat)" />
              </BarChart>
            </Brush>
          </BarChart>
        </ResponsiveContainer>
      )}
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
