import { useMemo, useState } from 'react';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAdmins } from '../hooks/useAdmins';
import { sortedSeasons, seasonLabel } from '../utils/season';
import { formatDateIL } from '../utils/format';
import { formatAdminName } from '../utils/adminName';
import { buildDailyReadingMessage, buildWhatsAppShareUrl } from '../utils/whatsapp';

const SOURCE_LABEL = {
  'whatsapp-import': 'וואטסאפ',
  manual: 'יומית',
  historical: 'היסטורי',
};

export function AdminReadingsList({ readings, limit = 15 }) {
  const { admins } = useAdmins();
  const [deletingId, setDeletingId] = useState(null);
  const [seasonFilter, setSeasonFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const seasons = useMemo(
    () => sortedSeasons([...new Set(readings.map((r) => r.season))]).reverse(),
    [readings]
  );

  const filtered =
    seasonFilter === 'all' ? readings : readings.filter((r) => r.season === seasonFilter);
  const sorted = [...filtered].sort((a, b) => (a.date < b.date ? 1 : -1));
  const visible = showAll ? sorted : sorted.slice(0, limit);

  async function handleDelete(date) {
    if (!confirm(`למחוק את הרשומה של ${formatDateIL(date)}?`)) return;
    setDeletingId(date);
    try {
      await deleteDoc(doc(db, 'readings', date));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleEnteredByChange(date, value) {
    setUpdatingId(date);
    try {
      await updateDoc(doc(db, 'readings', date), { enteredBy: value || null });
    } finally {
      setUpdatingId(null);
    }
  }

  function handleShare(r) {
    const text = buildDailyReadingMessage({
      dateLabel: formatDateIL(r.date),
      amountMm: r.amountMm,
      cumulativeMm: r.cumulativeMm,
      seasonLabel: seasonLabel(r.season),
    });
    window.open(buildWhatsAppShareUrl(text), '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="readings-list">
      <div className="readings-list-controls">
        <select
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value)}
          aria-label="סינון לפי עונה"
        >
          <option value="all">כל העונות ({readings.length})</option>
          {seasons.map((s) => (
            <option key={s} value={s}>
              עונת {seasonLabel(s)}
            </option>
          ))}
        </select>
        {sorted.length > limit && (
          <button type="button" className="btn btn-secondary" onClick={() => setShowAll((v) => !v)}>
            {showAll ? `הצג ${limit} אחרונות בלבד` : `הצג את כל ${sorted.length} הרשומות`}
          </button>
        )}
      </div>

      <table className="readings-table">
        <thead>
          <tr>
            <th>תאריך</th>
            <th>יום</th>
            <th>מצטבר</th>
            <th>מקור</th>
            <th>הוזן ע״י</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr key={r.date}>
              <td>{formatDateIL(r.date)}</td>
              <td>{r.amountMm ?? '—'}</td>
              <td>{r.cumulativeMm}</td>
              <td>
                <span className="source-tag">{SOURCE_LABEL[r.source] || r.source}</span>
              </td>
              <td>
                <select
                  className="entered-by-select"
                  value={r.enteredBy || ''}
                  disabled={updatingId === r.date}
                  onChange={(e) => handleEnteredByChange(r.date, e.target.value)}
                  aria-label={`שינוי מי הזין את רשומת ${formatDateIL(r.date)}`}
                >
                  <option value="">—</option>
                  {r.enteredBy && !admins.some((a) => formatAdminName(a) === r.enteredBy) && (
                    <option value={r.enteredBy}>{r.enteredBy}</option>
                  )}
                  {admins.map((a) => (
                    <option key={a.id} value={formatAdminName(a)}>
                      {formatAdminName(a)}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => handleShare(r)}
                  aria-label={`שליחת רשומת ${formatDateIL(r.date)} בוואטסאפ`}
                  title="שליחה בוואטסאפ"
                >
                  שלח
                </button>
              </td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(r.date)}
                  disabled={deletingId === r.date}
                  aria-label={`מחיקת רשומת ${formatDateIL(r.date)}`}
                >
                  {deletingId === r.date ? '…' : 'מחיקה'}
                </button>
              </td>
            </tr>
          ))}
          {visible.length === 0 && (
            <tr>
              <td colSpan={7} className="empty-row">
                אין רשומות
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
