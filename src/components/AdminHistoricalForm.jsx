import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { seasonForDate } from '../utils/season';
import { formatDateIL } from '../utils/format';

// Free-date entry for pre-2021 data (1991 paper records, not yet
// digitized). Unlike the daily form, cumulative isn't auto-computed here —
// there's no reliable "previous reading" to build on for old, possibly
// gappy, paper records — so it's typed in directly.
export function AdminHistoricalForm() {
  const [date, setDate] = useState('');
  const [amountMm, setAmountMm] = useState('');
  const [cumulativeMm, setCumulativeMm] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!date) return;
    setSaving(true);
    setMessage(null);
    try {
      const season = seasonForDate(date);
      await setDoc(doc(db, 'readings', date), {
        date,
        season,
        amountMm: amountMm !== '' ? Number(amountMm) : null,
        cumulativeMm: Number(cumulativeMm),
        note: note || null,
        source: 'historical',
      });
      setMessage({ type: 'ok', text: `נשמר נתון היסטורי: ${formatDateIL(date)}` });
      setDate('');
      setAmountMm('');
      setCumulativeMm('');
      setNote('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <p className="form-hint">
        להזנת נתונים ישנים (למשל מהטבלה הכתובה משנת 1991) שעדיין לא הוזנו למערכת.
      </p>

      <div className="field">
        <label htmlFor="h-date">תאריך</label>
        <input id="h-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="field">
        <label htmlFor="h-amount">כמות באותו יום (מ״מ) — אופציונלי</label>
        <input
          id="h-amount"
          type="number"
          step="0.1"
          min="0"
          inputMode="decimal"
          value={amountMm}
          onChange={(e) => setAmountMm(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="h-cumulative">מצטבר לעונה (מ״מ)</label>
        <input
          id="h-cumulative"
          type="number"
          step="0.1"
          min="0"
          inputMode="decimal"
          value={cumulativeMm}
          onChange={(e) => setCumulativeMm(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="h-note">הערה (אופציונלי)</label>
        <input id="h-note" type="text" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? 'שומר…' : 'שמירת נתון היסטורי'}
      </button>

      {message && (
        <p className={message.type === 'ok' ? 'form-msg-ok' : 'form-msg-error'}>{message.text}</p>
      )}
    </form>
  );
}
