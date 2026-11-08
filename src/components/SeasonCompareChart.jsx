import { useEffect, useMemo, useRef, useState } from 'react';
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
  // Recharts' Brush keeps its own zoom/pan position in a Redux store keyed
  // off this array's *identity*, resetting to the full range whenever it
  // sees what looks like new data — so a fresh array on every render (as
  // `readings.map(...)` would produce) silently snapped the brush back to
  // full zoom on every re-render, making dragging feel broken/stuck. Memoing
  // it keeps the same reference across renders that don't actually change
  // the underlying readings.
  const data = useMemo(() => {
    const bySeason = new Map();
    for (const r of readings) {
      const prev = bySeason.get(r.season);
      if (!prev || r.date > prev.date) bySeason.set(r.season, r);
    }

    const seasons = sortedSeasons([...bySeason.keys()]);
    return seasons.map((s) => {
      const last = bySeason.get(s);
      return {
        season: s,
        label: seasonLabel(s),
        totalMm: last.cumulativeMm,
        ongoing: s === currentSeason,
        pctOfAvg: Math.round((last.cumulativeMm / FULL_SEASON_AVERAGE_MM) * 100),
      };
    });
  }, [readings, currentSeason]);

  const maxTotal = Math.max(...data.map((d) => d.totalMm), 1);
  const recordTotal = Math.max(...data.filter((d) => !d.ongoing).map((d) => d.totalMm), 0);

  const lastIndex = Math.max(0, data.length - 1);

  // `range` is the live zoom window — updated continuously from both the
  // brush's onChange (handle drags, panning) and from the pinch gesture
  // below — and it alone drives `visibleData`. The brush itself is left
  // uncontrolled the rest of the time: feeding its own drag output back to
  // it as controlled props on every render fights its internal drag
  // tracking and makes the handles feel stuck. `brushSeed` is the one
  // exception — it's only updated on a reset, a season-count change, or
  // after a pinch ends, and it forces a clean remount (via `key`) with that
  // range as the brush's starting position, which is safe because it stays
  // constant between seeds rather than changing every onChange.
  const [range, setRange] = useState({ startIndex: 0, endIndex: lastIndex });
  const [brushSeed, setBrushSeed] = useState({ key: 0, startIndex: 0, endIndex: lastIndex });
  const prevLastIndex = useRef(lastIndex);
  const rangeRef = useRef(range);

  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  useEffect(() => {
    if (lastIndex === prevLastIndex.current) return;
    prevLastIndex.current = lastIndex;
    setRange({ startIndex: 0, endIndex: lastIndex });
    setBrushSeed((s) => ({ key: s.key + 1, startIndex: 0, endIndex: lastIndex }));
  }, [lastIndex]);

  function handleBrushChange(next) {
    if (!next || next.startIndex == null || next.endIndex == null) return;
    setRange({ startIndex: next.startIndex, endIndex: next.endIndex });
  }

  function resetZoom() {
    setRange({ startIndex: 0, endIndex: lastIndex });
    setBrushSeed((s) => ({ key: s.key + 1, startIndex: 0, endIndex: lastIndex }));
  }

  // Two-finger pinch directly on the charts, since on a touch screen that's
  // the gesture people reach for before noticing the brush handles below —
  // without this, a pinch there just zooms the whole page instead. Scoped
  // to a raw DOM listener (not onTouchMove) because stopping the page zoom
  // requires calling preventDefault from a non-passive listener, which
  // React's synthetic touch handlers don't allow.
  const chartsWrapRef = useRef(null);
  const pinchRef = useRef(null);

  useEffect(() => {
    const el = chartsWrapRef.current;
    if (!el || data.length <= MIN_ZOOM_SEASONS) return undefined;

    function touchDistance(touches) {
      return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    }

    function indexFromClientX(clientX) {
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return ratio * lastIndex;
    }

    function onTouchStart(e) {
      if (e.touches.length !== 2) return;
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      pinchRef.current = {
        startDistance: touchDistance(e.touches),
        startRange: { ...rangeRef.current },
        midIndex: indexFromClientX(midX),
      };
    }

    function onTouchMove(e) {
      if (e.touches.length !== 2 || !pinchRef.current) return;
      e.preventDefault();
      const { startDistance, startRange, midIndex } = pinchRef.current;
      if (startDistance < 1) return;
      const scale = touchDistance(e.touches) / startDistance;
      const startWidth = startRange.endIndex - startRange.startIndex + 1;
      const newWidth = Math.min(data.length, Math.max(MIN_ZOOM_SEASONS, Math.round(startWidth / scale)));
      const midRatio = startWidth > 1 ? (midIndex - startRange.startIndex) / (startWidth - 1) : 0.5;
      let newStart = Math.round(midIndex - midRatio * (newWidth - 1));
      newStart = Math.max(0, Math.min(data.length - newWidth, newStart));
      setRange({ startIndex: newStart, endIndex: newStart + newWidth - 1 });
    }

    function endPinch() {
      if (!pinchRef.current) return;
      pinchRef.current = null;
      setBrushSeed((s) => ({
        key: s.key + 1,
        startIndex: rangeRef.current.startIndex,
        endIndex: rangeRef.current.endIndex,
      }));
    }

    function onTouchEnd(e) {
      if (e.touches.length < 2) endPinch();
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [data.length, lastIndex]);

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
      <div aria-hidden="true" ref={chartsWrapRef} className="compare-chart-area">
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
              key={brushSeed.key}
              dataKey="totalMm"
              height={28}
              travellerWidth={10}
              startIndex={brushSeed.startIndex}
              endIndex={brushSeed.endIndex}
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
