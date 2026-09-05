import { useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const SOURCE_LABEL = {
  'whatsapp-import': 'ייבוא וואטסאפ',
  manual: 'הזנה יומית',
  historical: 'היסטורי',
};

export function AdminReadingsList({ readings, limit = 15 }) {
  const [deletingId, setDeletingId] = useState(null);

  const recent = [...readings].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);

  async function handleDelete(date) {
    if (!confirm(`למחוק את הרשומה של ${date}?`)) return;
    setDeletingId(date);
    try {
      await deleteDoc(doc(db, 'readings', date));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="readings-list">
      <table className="readings-table">
        <thead>
          <tr>
            <th>תאריך</th>
            <th>יום</th>
            <th>מצטבר</th>
            <th>מקור</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {recent.map((r) => (
            <tr key={r.date}>
              <td>{r.date}</td>
              <td>{r.amountMm ?? '—'}</td>
              <td>{r.cumulativeMm}</td>
              <td>
                <span className="source-tag">{SOURCE_LABEL[r.source] || r.source}</span>
              </td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(r.date)}
                  disabled={deletingId === r.date}
                  aria-label={`מחיקת רשומת ${r.date}`}
                >
                  {deletingId === r.date ? '…' : '🗑'}
                </button>
              </td>
            </tr>
          ))}
          {recent.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-row">
                אין עדיין רשומות
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
