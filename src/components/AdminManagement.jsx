import { useState } from 'react';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmins } from '../hooks/useAdmins';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AdminManagement() {
  const { user } = useAuth();
  const { admins, loading } = useAdmins();
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [message, setMessage] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) {
      setMessage({ type: 'error', text: 'כתובת אימייל לא תקינה' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, 'admins', normalized), {
        email: normalized,
        addedBy: user?.email || null,
        addedAt: serverTimestamp(),
      });
      setMessage({ type: 'ok', text: `${normalized} נוסף כמנהל` });
      setEmail('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id) {
    if (id === user?.email?.toLowerCase()) return; // can't remove yourself
    if (admins.length <= 1) return; // never leave zero admins
    if (!confirm(`להסיר את ${id} ממנהלי המערכת?`)) return;
    setRemovingId(id);
    try {
      await deleteDoc(doc(db, 'admins', id));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="admin-management">
      <form className="admin-form" onSubmit={handleAdd}>
        <div className="field">
          <label htmlFor="new-admin-email">הוספת מנהל (כתובת Gmail)</label>
          <input
            id="new-admin-email"
            type="email"
            inputMode="email"
            placeholder="name@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'מוסיף…' : 'הוספה'}
        </button>
        {message && (
          <p className={message.type === 'ok' ? 'form-msg-ok' : 'form-msg-error'}>{message.text}</p>
        )}
      </form>

      <div className="admins-table-wrap">
        <table className="readings-table admins-table">
          <thead>
            <tr>
              <th>אימייל</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const isSelf = a.id === user?.email?.toLowerCase();
              const isLast = admins.length <= 1;
              return (
                <tr key={a.id}>
                  <td>
                    {a.email}
                    {isSelf && <span className="source-tag">אתה</span>}
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleRemove(a.id)}
                      disabled={isSelf || isLast || removingId === a.id}
                      aria-label={`הסרת ${a.email} ממנהלים`}
                      title={isLast ? 'לא ניתן להסיר את המנהל האחרון' : isSelf ? 'לא ניתן להסיר את עצמך' : undefined}
                    >
                      {removingId === a.id ? '…' : '🗑'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && admins.length === 0 && (
              <tr>
                <td colSpan={2} className="empty-row">
                  אין עדיין מנהלים
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
