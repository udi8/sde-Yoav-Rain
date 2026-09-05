import './StatCard.css';

export function StatCard({ label, value, unit, sub }) {
  return (
    <div className="stat-card card">
      <span className="stat-card-label">{label}</span>
      <div className="stat-card-value">
        <span className="stat-card-number">{value}</span>
        {unit && <span className="stat-card-unit">{unit}</span>}
      </div>
      {sub && <span className="stat-card-sub">{sub}</span>}
    </div>
  );
}
