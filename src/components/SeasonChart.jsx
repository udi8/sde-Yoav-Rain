import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { dayOfSeason, seasonStartYear, seasonLabel } from '../utils/season';
import { averageCurve, FULL_SEASON_AVERAGE_MM } from '../utils/historicalAverage';
import './SeasonChart.css';

const MONTHS_HE = [
  'ספט',
  'אוק',
  'נוב',
  'דצמ',
  'ינו',
  'פבר',
  'מרץ',
  'אפר',
  'מאי',
  'יונ',
  'יול',
  'אוג',
];

function monthTicks(startYear) {
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const monthIndex = (8 + i) % 12; // 8 = September
    const year = startYear + (8 + i >= 12 ? 1 : 0);
    const d = new Date(year, monthIndex, 1);
    const seasonStart = new Date(startYear, 8, 1);
    const day = Math.round((d - seasonStart) / (1000 * 60 * 60 * 24));
    ticks.push({ day, label: MONTHS_HE[i] });
  }
  return ticks;
}

export function SeasonChart({ season, readings }) {
  const startYear = seasonStartYear(season);
  const avg = averageCurve(10);

  const actualPoints = readings
    .filter((r) => r.season === season)
    .map((r) => ({ day: dayOfSeason(r.date), date: r.date, actualMm: r.cumulativeMm }));

  // Merge onto a shared x-axis: average curve at fixed 10-day steps, plus
  // every real reading day, so the average line stays smooth while actual
  // rainfall shows every reported day.
  const byDay = new Map();
  for (const p of avg) byDay.set(p.day, { day: p.day, avgMm: p.avgMm });
  for (const p of actualPoints) {
    const existing = byDay.get(p.day) || { day: p.day };
    byDay.set(p.day, { ...existing, actualMm: p.actualMm, date: p.date });
  }

  const data = Array.from(byDay.values()).sort((a, b) => a.day - b.day);
  const ticks = monthTicks(startYear);

  const latestActual = [...actualPoints].sort((a, b) => b.day - a.day)[0];
  const chartSummary = latestActual
    ? `נכון ל-${latestActual.date}: ${latestActual.actualMm} מ״מ מצטבר, לעומת ממוצע רב-שנתי של ${FULL_SEASON_AVERAGE_MM} מ״מ לעונה שלמה.`
    : `אין עדיין נתונים לעונת ${seasonLabel(season)}.`;

  return (
    <div className="season-chart card">
      <div className="season-chart-header">
        <h3>עונת {seasonLabel(season)}</h3>
      </div>
      <p className="sr-only">{chartSummary}</p>
      <div aria-hidden="true">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="day"
            type="number"
            domain={[0, 365]}
            ticks={ticks.map((t) => t.day)}
            tickFormatter={(day) => ticks.find((t) => t.day === day)?.label || ''}
            stroke="var(--text-muted)"
            fontSize={12}
          />
          <YAxis stroke="var(--text-muted)" fontSize={12} width={44} />
          <Tooltip
            labelFormatter={(day) => {
              const p = data.find((d) => d.day === day);
              return p?.date || '';
            }}
            formatter={(value, name) => [
              `${value?.toFixed ? value.toFixed(1) : value} מ״מ`,
              name === 'actualMm' ? 'מצטבר בפועל' : 'ממוצע רב-שנתי',
            ]}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
            }}
          />
          <Legend
            formatter={(value) => (value === 'actualMm' ? 'מצטבר בפועל' : 'ממוצע רב-שנתי')}
          />
          <Area
            type="monotone"
            dataKey="actualMm"
            stroke="var(--rain)"
            fill="var(--accent-soft)"
            strokeWidth={2.5}
            connectNulls
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="avgMm"
            stroke="var(--rain-avg)"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
