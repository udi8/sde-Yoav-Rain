import { useMemo, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { seasonForDate } from '../utils/season';

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

export function AdminDailyForm({ readings }) {
  const [date, setDate] = useState(todayISO());
  const [amountMm, setAmountMm] = useState('');
  const [cumulativeOverride, setCumulativeOverride] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const season = seasonForDate(date);

  const previousCumulative = useMemo(() => {
    const seasonReadings = readings
      .filter((r) => r.season === season && r.date < date)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return seasonReadings[0]?.cumulativeMm ?? 0;
  }, [readings, season, date]);

  const computedCumulative =
    amountMm !== '' ? Math.round((previousCumulative + Number(amountMm)) * 10) / 10 : previousCumulative;

  function handleDateChange(value) {
    setDate(value);
    setCumulativeOverride('');
  }

  function handleAmountChange(value) {
    setAmountMm(value);
    setCumulativeOverride('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const cumulativeMm =
        cumulativeOverride !== '' ? Number(cumulativeOverride) : computedCumulative;
      await setDoc(doc(db, 'readings', date), {
        date,
        season,
        amountMm: Number(amountMm),
        cumulativeMm,
        note: null,
        source: 'manual',
      });
      setMessage({ type: 'ok', text: `נשמר: ${date} — ${amountMm} מ״מ, מצטבר ${cumulativeMm} מ״מ` });
      setAmountMm('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="date">תאריך</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="amount">כמות גשם היום (מ״מ)</label>
        <input
          id="amount"
          type="number"
          step="0.1"
          min="0"
          inputMode="decimal"
          value={amountMm}
          onChange={(e) => handleAmountChange(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="cumulative">מצטבר לעונה (מחושב אוטומטית, ניתן לתקן)</label>
        <input
          id="cumulative"
          type="number"
          step="0.1"
          value={cumulativeOverride !== '' ? cumulativeOverride : computedCumulative}
          onChange={(e) => setCumulativeOverride(e.target.value)}
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? 'שומר…' : 'שמירה'}
      </button>

      {message && (
        <p className={message.type === 'ok' ? 'form-msg-ok' : 'form-msg-error'}>{message.text}</p>
      )}
    </form>
  );
}
