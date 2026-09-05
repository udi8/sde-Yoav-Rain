import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AdminLoginPage.css';

export function AdminLoginPage() {
  const { user, loading, isAdmin, signIn, signOutUser } = useAuth();
  const [error, setError] = useState(null);

  if (loading) return null;
  if (user && isAdmin) return <Navigate to="/admin" replace />;

  return (
    <div className="admin-login container">
      <div className="admin-login-card card">
        <h1>כניסת מנהלים</h1>
        <p className="admin-login-sub">מד-גשם שדה יואב</p>

        {user && !isAdmin && (
          <div className="not-allowed">
            <p>
              המשתמש <strong>{user.email}</strong> אינו מורשה לגשת לאזור הניהול.
            </p>
            <button className="btn btn-secondary" onClick={signOutUser}>
              התנתקות ונסיון עם חשבון אחר
            </button>
          </div>
        )}

        {!user && (
          <button
            className="btn btn-primary"
            onClick={() => signIn().catch((e) => setError(e.message))}
          >
            כניסה עם Google
          </button>
        )}

        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );
}
