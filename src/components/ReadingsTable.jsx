import { formatDateIL } from '../utils/format';
import './ReadingsTable.css';

// Read-only public listing of every measurement in a season — the chart
// above shows the trend, this is the underlying data for anyone who wants
// the exact numbers (per Apple's charting-data guidance: a chart for the
// trend, a list/table for the raw values).
export function ReadingsTable({ readings, seasonLabel }) {
  const sorted = [...readings].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="readings-card card">
      <div className="readings-card-header">
        <h3>כל המדידות לעונת {seasonLabel}</h3>
      </div>
      <div className="readings-list">
        <table className="readings-table">
          <thead>
            <tr>
              <th>תאריך</th>
              <th>גשם (מ״מ)</th>
              <th>מצטבר (מ״מ)</th>
              <th>נמדד ע״י</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.date}>
                <td>{formatDateIL(r.date)}</td>
                <td>{r.amountMm ?? '—'}</td>
                <td>{r.cumulativeMm}</td>
                <td>{r.enteredBy || '—'}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-row">
                  אין עדיין מדידות לעונה זו
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
