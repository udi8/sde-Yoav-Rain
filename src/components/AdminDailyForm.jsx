import { useMemo, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { seasonForDate, seasonLabel } from '../utils/season';
import { formatDateIL } from '../utils/format';
import { buildDailyReadingMessage, buildWhatsAppShareUrl } from '../utils/whatsapp';

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

  async function saveReading() {
    const cumulativeMm = cumulativeOverride !== '' ? Number(cumulativeOverride) : computedCumulative;
    await setDoc(doc(db, 'readings', date), {
      date,
      season,
      amountMm: Number(amountMm),
      cumulativeMm,
      note: null,
      source: 'manual',
    });
    return cumulativeMm;
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const cumulativeMm = await saveReading();
      setMessage({
        type: 'ok',
        text: `נשמר: ${formatDateIL(date)} — ${amountMm} מ״מ, מצטבר ${cumulativeMm} מ״מ`,
      });
      setAmountMm('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndShare() {
    if (!date || amountMm === '') return;
    // Open the tab synchronously, in direct response to the click, and
    // navigate it once the save finishes — opening it only after the
    // `await` below would get it blocked as a popup on iOS Safari.
    const shareTab = window.open('', '_blank');
    setSaving(true);
    setMessage(null);
    try {
      const cumulativeMm = await saveReading();
      const text = buildDailyReadingMessage({
        dateLabel: formatDateIL(date),
        amountMm: Number(amountMm),
        cumulativeMm,
        seasonLabel: seasonLabel(season),
      });
      const url = buildWhatsAppShareUrl(text);
      if (shareTab) {
        shareTab.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      setMessage({
        type: 'ok',
        text: `נשמר: ${formatDateIL(date)} — ${amountMm} מ״מ, מצטבר ${cumulativeMm} מ״מ`,
      });
      setAmountMm('');
    } catch (err) {
      shareTab?.close();
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSave}>
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

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'שומר…' : 'שמירה'}
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={handleSaveAndShare}
          disabled={saving || amountMm === ''}
        >
          {saving ? 'שומר…' : 'שמירה ושליחה בוואטסאפ'}
        </button>
      </div>

      {message && (
        <p className={message.type === 'ok' ? 'form-msg-ok' : 'form-msg-error'}>{message.text}</p>
      )}
    </form>
  );
}
