import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useReadings } from '../hooks/useReadings';
import { AdminDailyForm } from '../components/AdminDailyForm';
import { AdminHistoricalForm } from '../components/AdminHistoricalForm';
import { AdminReadingsList } from '../components/AdminReadingsList';
import './AdminPage.css';

export function AdminPage() {
  const { user, signOutUser } = useAuth();
  const { readings, loading } = useReadings();
  const [tab, setTab] = useState('daily');

  return (
    <div className="admin-page container">
      <header className="admin-header">
        <div>
          <h1>ניהול מד-גשם</h1>
          <p className="admin-user">מחובר כ-{user?.email}</p>
        </div>
        <div className="admin-actions">
          <Link to="/" className="btn btn-secondary">
            לעמוד הציבורי
          </Link>
          <button className="btn btn-secondary" onClick={signOutUser}>
            התנתקות
          </button>
        </div>
      </header>

      <div className="tabs">
        <button className={tab === 'daily' ? 'tab active' : 'tab'} onClick={() => setTab('daily')}>
          הזנה יומית
        </button>
        <button
          className={tab === 'historical' ? 'tab active' : 'tab'}
          onClick={() => setTab('historical')}
        >
          הזנת נתון היסטורי
        </button>
      </div>

      <div className="admin-content">
        <div className="card admin-form-card">
          {tab === 'daily' ? <AdminDailyForm readings={readings} /> : <AdminHistoricalForm />}
        </div>

        <div className="card admin-list-card">
          <h2>רשומות אחרונות</h2>
          {loading ? <p>טוען…</p> : <AdminReadingsList readings={readings} />}
        </div>
      </div>
    </div>
  );
}
